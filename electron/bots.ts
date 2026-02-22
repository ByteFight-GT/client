import { app, dialog, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

export const USER_BOTS_PATH = path.join(
	app.getPath("userData"),
	"bots"
);

export const DEFAULT_BOT_PATH = path.join(
	app.getAppPath(),
	"resources/example-bot"
);

/**
 * initialization/update checking, run on app startup
 */
export function initBots() {
	// create bots dir if it doesn't exist
	if (!fs.existsSync(USER_BOTS_PATH)) {
		fs.mkdirSync(USER_BOTS_PATH, { recursive: true });
	}

	// copy default bot if it doesn't exist yet
	const defaultBotName = path.basename(DEFAULT_BOT_PATH);
	const userDefaultBotPath = path.join(USER_BOTS_PATH, defaultBotName);
	if (!fs.existsSync(userDefaultBotPath)) {
		fs.cpSync(DEFAULT_BOT_PATH, userDefaultBotPath, { recursive: true });
	}
}

export function setupBotsHandlers() {
	ipcMain.handle('bots:list', async (event) => {
		try {
			const entries = await fs.promises.readdir(USER_BOTS_PATH, { withFileTypes: true });
			const botFolders = entries
				.filter(entry => entry.isDirectory())
				.map(entry => entry.name);
			return { success: true, bots: botFolders };
		} catch (err: any) {
			console.error(`Failed to list bots: ${err.message}`);
			return { success: false, error: err.message, bots: [] };
		}
	});

	ipcMain.handle('bots:import', async (event) => {
		const { canceled, filePaths } = await dialog.showOpenDialog({
			title: "Import Bots",
			properties: ['openDirectory', 'multiSelections']
		});

		if (!canceled) {
			const importedNames: string[] = [];
			
			for (const filePath of filePaths) {
				try {
					const botName = path.basename(filePath);
					const userBotPath = path.join(USER_BOTS_PATH, botName);
					
					if (!fs.existsSync(userBotPath)) {
						fs.cpSync(filePath, userBotPath, { recursive: true });
						importedNames.push(botName);
					}
				} catch (err: any) {
					console.warn(`[bots:import] Failed to import from ${filePath}: ${err.message}`);
				}
			}
			
			return { success: importedNames.length > 0, imported: importedNames };
		}
		return { success: false, error: "Import canceled by user", imported: [] };
	});
}
