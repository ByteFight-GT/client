import { ipcMain } from 'electron';
import * as child_process from 'child_process';
import path from 'path';
import net from 'net';
import { getCachedSettingOrDefault } from './settings.ts';
import { type MatchMetadata } from '../common/types.ts';
import { tryGetConfiguredDir } from './utils.ts';
import { readMap } from './maps.ts';
import { TcpClientManager } from './TcpClientManager.ts';

const LOCAL_SERVER_SCRIPT = 'local_server.py';

export let pythonProcess: child_process.ChildProcessWithoutNullStreams | null = null;
export let tcpClientManager = new TcpClientManager();

/** tries finding a free tcp port by creating a server lol */
function getFreePort() {
	return new Promise<number>((resolve, reject) => {
		const server = net.createServer();
		server.listen(0, () => {
			const addrObj = server.address();

			if (typeof addrObj === 'string' || addrObj === null) {
				reject(new Error(`Failed to get free port: dummy server.address() returned ${addrObj}`));
				return;
			}

			server.close(() => resolve(addrObj.port));
		});
		server.on("error", reject);
	});
}

/** closes the TCPClientManager's connection if it exists */
export function closeTCPClient() {
	tcpClientManager?.disconnect();
}

/** Kills `pythonProcess` if its running (forcibly) */
export function closePython() {
	if (pythonProcess && !pythonProcess.killed) {
		const killResult = pythonProcess.kill();

		// note killResult is true only if the signal is sent, technically the process could still be alive
		if (!killResult) {
			console.warn(`Failed to kill python process ${pythonProcess.pid} gracefully, forcing kill.`);

			const forceKillCmd = process.platform === "win32"? 
				`taskkill /PID ${pythonProcess.pid} /T /F` :
				`kill -9 ${pythonProcess.pid}`;

			child_process.exec(forceKillCmd, (err) => {
				if (err) console.error("Failed to kill process:", err);
				else console.log("Process killed");
			});
		}
	}
}

export function setupRunnerHandlers(enginePath: string) {
	ipcMain.handle('runner:start-match', async (event, matchData: MatchMetadata) => {

		// initial setup/checks/data gathering
		if (pythonProcess) {
			// already a match running, reject
			return {
				success: false,
				error: "A match is already running. Please allow it to finish or terminate it before starting a new one."
			};
		}

		// by this point the python serv shouldnt be running, but close any previous connections just in case
		tcpClientManager.disconnect(); 

		// get python executable/command to use from settings
		const pythonPath = getCachedSettingOrDefault("Python Path");
		if (!pythonPath) {
			return {
				success: false,
				error: "Python path not configured in settings. Try resetting \"Python Path\" to default config or point it to a valid python executable."
			};
		}
		
		// get bots directory from settings
		let botsDir: string;
		try {
			botsDir = tryGetConfiguredDir("Bots Directory");
		} catch (err: any) {
			return {
				success: false,
				error: `Failed to resolve bots directory: ${err.message}`
			};
		} 

		// get output dir for the pgn file(s)
		let outputDir: string;
		try {
			outputDir = tryGetConfiguredDir("Games Directory");
		} catch (err: any) {
			return {
				success: false,
				error: `Failed to resolve games directory: ${err.message}`
			};
		}

		// read maps
		const mapsData: string[] = [];
		for (const mapName of matchData.maps) {
			const mapReadRes = await readMap(mapName);
			if (mapReadRes.success) {
				mapsData.push(mapReadRes.mapData);
			} else {
				return {
					success: false,
					error: `Failed to read map ${mapName}: ${mapReadRes.error}`
				};
			}
		}

		// finding port for to listen for output on.
		let port: number;
		try {
			port = await getFreePort();
		} catch (err: any) {
			return {
				success: false,
				error: `Failed to find free port for streaming game data: ${err.message}`
			};
		}

		// compiling args
		const scriptArgs: string[] = [];
		scriptArgs.push('--output_port', port.toString())
		scriptArgs.push('--output_dir', outputDir);
		scriptArgs.push('--a_dir', path.join(botsDir, matchData.teamGreen));
		scriptArgs.push('--b_dir', path.join(botsDir, matchData.teamBlue));
		
		scriptArgs.push('--map_string', mapsData[0]);
		// scriptArgs.push('--maps', ...mapsData); 
		// ^ TODO - server only handles 1 game at a time rn.
		// pushing just first map for now, in the future we can try handling multiple

		const pythonServerScript = path.join(enginePath, LOCAL_SERVER_SCRIPT);

		return new Promise<string>(async (resolve, reject) => {
			let scriptOutput = '';
			let scriptError = '';

			pythonProcess = child_process.spawn(`${pythonPath} ${pythonServerScript}`, [...scriptArgs], {
				cwd: enginePath,
				shell: true
			});

			// Stream stdout for debugging
			// this should mostly be user-created data, like print() and stuff.
			pythonProcess.stdout.on('data', (data) => {
				const chunk = data.toString();
				scriptOutput += chunk;
				event.sender.send('game-usr:stdout', chunk);
				// event.sender.send('stream-output-full', scriptOutput);
			});

			// Stream stderr for errors
			// this should also mostly be user-created, errors, etc.
			pythonProcess.stderr.on('data', (data) => {
				const chunk = data.toString();
				scriptError += chunk;
				event.sender.send('game-usr:stderr', chunk);
				// event.sender.send('stream-error-full', scriptError);
			});

			// note: 'close' happens when stdio streams close, while 'exit' doesnt necessarily imply that
			pythonProcess.on('close', (code) => {
				tcpClientManager?.disconnect();

				event.sender.send('game-sys:process-closed', {
					code,
					stdout: scriptOutput,
				});

				if (code !== 0) {
					reject(new Error(`Python script error: ${scriptError}`));
				} else {
					resolve(scriptOutput);
				}
			});

			pythonProcess.on('error', (err) => {
				tcpClientManager?.disconnect();
				reject(err);
			});

			// Connect TCP client
			setTimeout(async () => {
				try {
					await tcpClientManager?.connect(
						'127.0.0.1', // host
						port, // port
						(chunk) => { // onRawData
							event.sender.send('game-sys:raw-data', chunk);
							console.log('TCP raw data received');
						},
						(data) => { // onData
							event.sender.send('game-sys:data', data);
							console.log('TCP data parsed');
						}, 
						() => { // onServerClosed
							event.sender.send('game-sys:server-closed');
						},
						(err) => { // onError
							event.sender.send('game-sys:error', err);
							console.error('TCP connection error:', err);
						},
						() => { // onComplete
							event.sender.send('game-sys:complete');
						},
					);
				} catch (err) {
					console.error('Failed to connect TCP client:', err);
				}
			}, 500);
		});
	});

	ipcMain.handle('runner:terminate', async (event) => {
		if (tcpClientManager) {
			return tcpClientManager.sendInterrupt();
		}
		return false;
	});

	ipcMain.handle('runner:disconnect', async (event) => {
		tcpClientManager?.disconnect();
		return false;
	});
}
