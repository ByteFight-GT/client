import { app, ipcMain, dialog } from 'electron';
import ElectronStore from 'electron-store';
import { promises as fs } from 'fs';
import { join } from 'path';

/** registers ipcMain handlers for interacting with ElectronStore */
export function setupElectronStoreHandlers(store: ElectronStore) {
	ipcMain.handle('store-set', async (event, key, value) => {
		store.set(key, value);
	});

	ipcMain.handle('store-get', async (event, key) => {
		return store.get(key);
	});

	ipcMain.handle('delete-map', async (event, map) => {
		const maps = store.get("maps", {}) as Record<string, string>;
		delete maps[map];
		store.set("maps", maps);
	});

	

	/*
	// [27dec2025 / michael]: idt we need this, im planning on allowing users to just one-click delete maps
	// instead of having a "delete all custom" maps thing cuz that feels a bit unneeded anyways.
	ipcMain.handle('delete-maps', async (event) => {
		const ogResponse = await fs.readFile(join(enginePath, 'config', 'maps.json'));
		const originalMaps = JSON.parse(ogResponse);
		
		const mapPairs: Record<string, string> = {};
		Object.keys(originalMaps).forEach(key => {
			mapPairs[key] = originalMaps[key];
		});
		
		store.set("maps", mapPairs);
	});
	*/
}

/** registers ipcMain handlers for file operations */
export function setupFileHandlers() {
	ipcMain.handle('read-file', async (event, filePath) => {
		try {
			const data: string = await fs.readFile(filePath, {encoding: 'utf8'});
			return data;
		} catch (err: any) {
			throw new Error(`Failed to read file ${filePath}: ${err.message}`);
		}
	});

	ipcMain.handle('dialog:select-file', async () => {
		const result = await dialog.showOpenDialog({
			properties: ['openFile'],
		});
		return result.filePaths[0];
	});

	ipcMain.handle('dialog:select-folder', async () => {
		const result = await dialog.showOpenDialog({
			properties: ['openDirectory'],
		});
		return result.filePaths[0];
	});
}

/** registers ipcMain handlers for reading/writing a JSON settings file */
export function setupSettingsHandlers() {
	const settingsFilePath = join(app.getPath('userData'), 'settings.json');

	ipcMain.handle('settings:get', async () => {
		try {
			const data = await fs.readFile(settingsFilePath, { encoding: 'utf8' });
			return JSON.parse(data);
		} catch (err: any) {
			if (err?.code === 'ENOENT') {
				return {};
			}
			throw new Error(`Failed to read settings: ${err.message}`);
		}
	});

	ipcMain.handle('settings:set', async (event, settings) => {
		try {
			const data = JSON.stringify(settings ?? {}, null, 2);
			await fs.writeFile(settingsFilePath, data, { encoding: 'utf8' });
			return true;
		} catch (err: any) {
			throw new Error(`Failed to write settings: ${err.message}`);
		}
	});
}


/** registers ipcMain handlers for reading/writing/handling match files  */
export function setupMatchHandlers(matchPath: string) {
	ipcMain.handle('get-matches', async (event) => {
		try {
			const files: string[] = await fs.readdir(matchPath);
			return files;
		} catch (err: any) {
			console.error('Error reading matches:', err);
			return [];
		}
	});

	ipcMain.handle('read-match', async (event, matchJson: string) => {
		try {
			const data: string = await fs.readFile(join(matchPath, matchJson), {encoding: 'utf8'});
			return data;
		} catch (err: any) {
			console.error('Error reading match:', err);
			throw err;
		}
	});

	ipcMain.handle('import-match', async (event, sourceFile: string, num: number) => {
		try {
			await fs.copyFile(sourceFile, join(matchPath, `${num}.json`));
		} catch (err: any) {
			throw new Error(`Failed to load match: ${err.message}`);
		}
	});

	ipcMain.handle('delete-match', async (event, file: string) => {
		const filePath = join(matchPath, file);
		await fs.unlink(filePath);
	});

	ipcMain.handle('delete-matches', async (event) => {
		try {
			const files = await fs.readdir(matchPath);
			for (const file of files) {
				const filePath = join(matchPath, file);
				await fs.unlink(filePath);
			}
		} catch (err: any) {
			console.error('Error deleting matches:', err);
		}
	});
}
