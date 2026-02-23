import net from 'net';

/** general class to manage TCP connection with the python local server that runs matches. */
export class TcpClientManager {

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
		onServerClosed: () => void, 
		onError: (error: Error) => void, 
		onComplete: () => void, 
		maxRetries = 20, 
	) {

		let currRetryDelay = 100; // initial delay (ms)

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				await this._attemptConnect(host, port, onData, onMessage, onServerClosed, onError, onComplete);
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
		onRawData: (data: string) => void, 
		onData: (message: any) => void, 
		onServerClosed: () => void, 
		onError: (error: Error) => void, 
		onComplete: () => void
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
				onRawData(chunk);

				const splitMessageBuffer = this.messageBuffer.split('\n');
				if (splitMessageBuffer.length > 1) {
					for (const msg of splitMessageBuffer.slice(0, -1)) {
						if (msg.trim()) {
							try {
								const jsonMessage = JSON.parse(msg);
								onData(jsonMessage);
							} catch (e) {
								console.warn('Received non-JSON message:', msg);
								onData({ type: "unparsed", raw: msg });
							}
						}
					}
					this.messageBuffer = splitMessageBuffer.at(-1) ?? '';
				}
			});

			this.client.on('end', () => {
				console.log('TCP connection ended');
				this.connected = false;
				onServerClosed();
			});

			this.client.on('close', () => {
				console.log('TCP connection closed');
				this.connected = false;
				onComplete();
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