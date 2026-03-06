import { app, dialog, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { tryGetConfiguredDir } from './utils';

export const DEFAULT_BOT_PATH = path.join(
	app.isPackaged ? process.resourcesPath : app.getAppPath(),
	"resources/example-bot"
);

/**
 * initialization/update checking, run on app startup
 */
export function initBots() {
	// create bots dir if it doesn't exist
	const botsDir = tryGetConfiguredDir("Bots Directory");

	if (!fs.existsSync(botsDir)) {
		fs.mkdirSync(botsDir, { recursive: true });
	}

	// copy default bot if it doesn't exist yet
	const defaultBotName = path.basename(DEFAULT_BOT_PATH);
	const userDefaultBotPath = path.join(botsDir, defaultBotName);
	if (!fs.existsSync(userDefaultBotPath)) {
		fs.cpSync(DEFAULT_BOT_PATH, userDefaultBotPath, { recursive: true });
	}
}

export function setupBotsHandlers() {
	ipcMain.handle('bots:list', async (event) => {

		const botsDir = tryGetConfiguredDir("Bots Directory");

		try {
			const entries = await fs.promises.readdir(botsDir, { withFileTypes: true });
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

		const botsDir = tryGetConfiguredDir("Bots Directory");

		const { canceled, filePaths } = await dialog.showOpenDialog({
			title: "Import Bots",
			properties: ['openDirectory', 'multiSelections']
		});

		if (!canceled) {
			const importedNames: string[] = [];
			
			for (const filePath of filePaths) {
				try {
					const botName = path.basename(filePath);
					const dstBotPath = path.join(botsDir, botName);
					
					if (!fs.existsSync(dstBotPath)) {
						fs.cpSync(filePath, dstBotPath, { recursive: true });
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
