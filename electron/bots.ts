import { app, dialog, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { tryGetConfiguredDir } from './utils.ts';

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

export function validateBot(botPath: string): boolean {
	const initPath = path.join(botPath, "__init__.py");
	const controllerPath = path.join(botPath, "controller.py");

	return fs.existsSync(initPath) && fs.existsSync(controllerPath);
}

export function setupBotsHandlers() {
	ipcMain.handle('bots:list', async (event) => {

		const botsDir = tryGetConfiguredDir("Bots Directory");

		try {
			const entries = await fs.promises.readdir(botsDir, { withFileTypes: true });
			const botFolders = entries
				.filter(entry => {
					if (!entry.isDirectory()) {
						return false;
					}
					return validateBot(path.join(botsDir, entry.name));
				})
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

		console.log(`[bots:import] User selected paths: ${filePaths.join(', ')}, canceled: ${canceled}`);

		if (!canceled) {
			const importedNames: string[] = [];
			const invalidBots: string[] = [];
			
			for (const filePath of filePaths) {
				try {
					const botName = path.basename(filePath);
					const dstBotPath = path.join(botsDir, botName);

					// validate the bot before copying
					if (!validateBot(filePath)) {
						invalidBots.push(botName);
						continue;
					}
					
					if (!fs.existsSync(dstBotPath)) {
						fs.cpSync(filePath, dstBotPath, { recursive: true });
						importedNames.push(botName);
					}
				} catch (err: any) {
					return { success: false, error: err, imported: [], invalid: [] };
				}
			}
			
			return { success: true, imported: importedNames, invalid: invalidBots };
		}
		return { success: false, error: "Import canceled by user", imported: [], invalid: [] };
	});
}
