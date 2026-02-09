import { ipcMain } from 'electron';
import * as child_process from 'child_process';
import path from 'path';
import net from 'net';
import ElectronStore from 'electron-store';

const LOCAL_SERVER_SCRIPT = 'local_server.py';

export let pythonProcess: child_process.ChildProcessWithoutNullStreams | null = null;
export let tcpClientManager: TcpClientManager | null = null;

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

/** general class to manage TCP connection with the python local server that runs matches. */
class TcpClientManager {

	client: net.Socket | null;
	connected: boolean;
	dataBuffer: string;
	messageBuffer: string;

	static TIMEOUT_MS = 2000;

	constructor() {
		this.client = null;
		this.connected = false;
		this.dataBuffer = '';
		this.messageBuffer = ''; // For handling partial messages
	}

	/** runs a loop wrapping this._attemptConnect() for retrying on failure */
	async connect(
		host: string, 
		port: number, 
		onData: (data: string) => void, 
		onMessage: (message: any) => void, 
		onComplete: () => void, 
		onError: (error: Error) => void, 
		onClose: () => void, 
		maxRetries = 20, 
	) {

		let currRetryDelay = 100; // initial delay (ms)

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				await this._attemptConnect(host, port, onData, onMessage, onComplete, onError, onClose);
				console.log(`Successfully connected to TCP server on port ${port}`);
				return; // Success!
			} catch (error: any) {
				if (attempt === maxRetries - 1) {
					throw new Error(`Failed to connect after ${maxRetries} attempts: ${error?.message}`);
				}
				
				const thisDelay = Math.min(currRetryDelay, TcpClientManager.TIMEOUT_MS);
				currRetryDelay *= 1.5; // for next time

				console.log(`Connection attempt ${attempt + 1} failed, retrying in ${thisDelay}ms...`);
				await new Promise(resolve => setTimeout(resolve, thisDelay));
			}
		}
	}

	/** Attempts to connect to the TCP server once */
	_attemptConnect(
		host: string, 
		port: number, 
		onData: (data: string) => void, 
		onMessage: (message: any) => void, 
		onComplete: () => void, 
		onError: (error: Error) => void, 
		onClose: () => void
	) {
		return new Promise<void>((resolve, reject) => {
			// Create tcp client
			this.client = new net.Socket();

			// Set connection timeout
			const connectionTimeout = setTimeout(() => {
				this.client?.destroy();
				reject(new Error('Connection timeout'));
			}, TcpClientManager.TIMEOUT_MS);
				
			// Start registering handlers
			this.client.on('data', (data) => {
				const chunk = data.toString();
				this.dataBuffer += chunk;
				this.messageBuffer += chunk;

				// Send raw data to renderer (for debugging)
				onData(chunk);

				const splitMessageBuffer = this.messageBuffer.split('\n');
				if (splitMessageBuffer.length > 1) {
					for (const msg of splitMessageBuffer.slice(0, -1)) {
						if (msg.trim()) {
							try {
								const jsonMessage = JSON.parse(msg);
								onMessage(jsonMessage);
							} catch (e) {
								console.warn('Received non-JSON message:', msg);
								onMessage({ type: "unparsed", raw: msg });
							}
						}
					}
					this.messageBuffer = splitMessageBuffer.at(-1) ?? '';
				}
			});

			this.client.on('end', () => {
				console.log('TCP connection ended');
				this.connected = false;
				onComplete();
			});

			this.client.on('close', () => {
				console.log('TCP connection closed');
				this.connected = false;
				onClose();
			});

			this.client.on('error', (err) => {
				clearTimeout(connectionTimeout);
				console.error('TCP client error:', err);
				
				// Only call onError for errors after successful connection
				if (this.connected) {
					onError(err);
				}
				
				this.connected = false;
				reject(err);
			});

			// Actually connect
			this.client.connect(port, host, () => {
				clearTimeout(connectionTimeout);
				console.log(`TCP client connected to ${host}:${port}`);
				this.connected = true;
				resolve();
			});
		});
	}

	disconnect() {
		if (this.client && this.connected) {
			this.client.end();
		}
		this.connected = false;
	}

	sendInterrupt() {
		if (this.client && this.connected) {
			console.log('Sending interrupt message');
			const interruptMessage = JSON.stringify({ type: 'terminate' }) + '\n';
			this.client.write(interruptMessage);
			return true;
		}
	}
}

export function setupPythonScriptHandlers(store: ElectronStore, enginePath: string) {
	ipcMain.handle('run-python-script', async (event, scriptArgs) => {
		console.log('ipcMain.handle called with args:', scriptArgs);

		return new Promise<string>(async (resolve, reject) => {
			console.log('Running python script with args:', scriptArgs);

			const pythonpath = store.get("pythonpath");
			const pythonServerScript = path.join(enginePath, LOCAL_SERVER_SCRIPT);

			const port = await getFreePort();
			scriptArgs.push('--output_port', port.toString());

			let scriptOutput = '';
			let scriptError = '';
			let tcpResult = null;

			// Create new TCP client manager
			tcpClientManager = new TcpClientManager();

			console.log(`Spawning ${pythonpath} ${pythonServerScript} ${[...scriptArgs]}...`);

			pythonProcess = child_process.spawn(`"${pythonpath}" "${pythonServerScript}"`, [...scriptArgs], {
				cwd: enginePath,
				shell: true
			});

			// Stream stdout for debugging
			pythonProcess.stdout.on('data', (data) => {
				const chunk = data.toString();
				scriptOutput += chunk;
				event.sender.send('stream-output', chunk);
				event.sender.send('stream-output-full', scriptOutput);
			});

			// Stream stderr for errors
			pythonProcess.stderr.on('data', (data) => {
				const chunk = data.toString();
				scriptError += chunk;
				event.sender.send('stream-error', chunk);
				event.sender.send('stream-error-full', scriptError);
			});

			pythonProcess.on('close', (code) => {
				tcpClientManager?.disconnect();

				event.sender.send('stream-complete', {
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
						(chunk) => { // onData
							event.sender.send('stream-tcp-data', chunk);
							console.log('TCP data received');
						},
						(jsonData) => { // onMessage
							event.sender.send('stream-tcp-json', jsonData);
							console.log('TCP data parsed');
							tcpResult = jsonData;
						}, 
						() => { // onComplete
							event.sender.send('stream-tcp-status', "complete");
						},
						(err) => { // onError
							event.sender.send('stream-tcp-status', "error");
							console.error('TCP connection error:', err);
						},
						() => { // onClose
							event.sender.send('stream-tcp-status', "close");
						},
					);
				} catch (err) {
					console.error('Failed to connect TCP client:', err);
				}
			}, 500);
		});
	});

	ipcMain.handle('tcp-send-interrupt', async (event) => {
		if (tcpClientManager) {
			return tcpClientManager.sendInterrupt();
		}
		return false;
	});

	ipcMain.handle('tcp-disconnect', async (event) => {
		tcpClientManager?.disconnect();
		return false;
	});
}
