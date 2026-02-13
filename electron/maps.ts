import { app, dialog, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

export const USER_MAPS_PATH = path.join(
	app.getPath("userData"),
	"maps"
);

export const DEFAULT_MAPS_PATH = path.join(
	app.getAppPath(),
	"resources/default-maps"
);

/**
 * initialization/update checking, run on app startup
 */
export function initMaps() {
	// update maps dir with updated maps from resources/
	if (!fs.existsSync(USER_MAPS_PATH)) {
		fs.mkdirSync(USER_MAPS_PATH, { recursive: true });
	}

	// copying default maps over (but we wont overwrite existing ones)
	const defaultMaps = fs.readdirSync(DEFAULT_MAPS_PATH);
	defaultMaps.forEach(map => {
		const userMapPath = path.join(USER_MAPS_PATH, map);
		const defaultMapPath = path.join(DEFAULT_MAPS_PATH, map);
		if (!fs.existsSync(userMapPath)) {
			fs.copyFileSync(defaultMapPath, userMapPath);
		}
	});
}

export function setupMapsHandlers() {
	ipcMain.handle('maps:delete', async (event, mapNames: string[]) => {
		const deleted: string[] = [];
		for (const mapName of mapNames) {
			const mapPath = path.join(USER_MAPS_PATH, mapName);
			try {
				await fs.promises.unlink(mapPath);
				deleted.push(mapName);
			} catch (err: any) {
				console.warn(`[maps:delete] Failed to delete map ${mapName}: ${err.message}`);
				deleted.push(mapName);
			}
		}
		return { success: deleted.length === mapNames.length, deleted };
	});

	ipcMain.handle('maps:list', async (event) => {
		try {
			const files = await fs.promises.readdir(USER_MAPS_PATH);
			return { success: true, maps: files.filter(file => file.endsWith('.json')) };
		} catch (err: any) {
			console.error(`Failed to list maps: ${err.message}`);
			return { success: false, error: err.message, maps: [] };
		}
	});

	ipcMain.handle('maps:import', async (event) => {
		const { canceled, filePaths } = await dialog.showOpenDialog({
			title: "Import Maps",
			properties: ['openFile', 'multiSelections'],
			filters: [
				{ name: 'JSON Files', extensions: ['json'] }
			]
		});
		
		if (!canceled) {
			const importedNames: string[] = [];
			for (const filePath of filePaths) {
				const mapName = path.basename(filePath);
				const userMapPath = path.join(USER_MAPS_PATH, mapName);
				if (!fs.existsSync(userMapPath)) {
					fs.copyFileSync(filePath, userMapPath);
					importedNames.push(mapName);
				}
			}
			return { success: true, imported: importedNames };
		}
		return { success: false, error: "Import canceled by user" };
	});

	ipcMain.handle('maps:read', async (event, mapName) => {
		const mapPath = path.join(USER_MAPS_PATH, mapName);
		try {
			const mapData = await fs.promises.readFile(mapPath, { encoding: 'utf8' });
			return { success: true, mapData };
		} catch (err: any) {
			console.error(`Failed to read map ${mapName}: ${err.message}`);
			return { success: false, error: err.message, mapData: null };
		}
	});

	ipcMain.handle('maps:write', async (event, mapName: string, mapData: string) => {
		const mapPath = path.join(USER_MAPS_PATH, mapName);
		console.log(`[maps:write] Writing map ${mapName} to ${mapPath}, data:`, mapData);
		try {
			await fs.promises.writeFile(mapPath, mapData, { encoding: 'utf8' });
			return { success: true };
		} catch (err: any) {
			console.error(`Failed to write map ${mapName}: ${err.message}`);
			return { success: false, error: err.message };
		}
	});
}
