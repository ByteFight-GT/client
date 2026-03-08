import path from 'path';
import fs from 'fs';
import { app, dialog, ipcMain, shell } from 'electron';
import { type Settings } from '../common/types.ts';
import { resolveAppRelativePath } from './utils.ts';

export const USER_SETTINGS_PATH = path.join(
  app.getPath("userData"),
  "settings.json"
);

export const DEFAULT_SETTINGS_PATH = path.join(
  app.isPackaged ? process.resourcesPath : app.getAppPath(),
  "resources/default-settings.json"
);

/** cache settings from file on startup, then write to disk on updates */
export let cachedSettings: Settings | null = null;

/**
 * Tries to find value of the setting key in `cachedSettings`.
 * If not found, returns the default value from `default-settings.json`.
 * If still not found, returns null.
 */
export function getCachedSettingOrDefault(key: string): any | null {
  if (cachedSettings && key in cachedSettings) {
    return cachedSettings[key].value;
  }

  try {
    const defaultData = fs.readFileSync(DEFAULT_SETTINGS_PATH, { encoding: 'utf8' });
    const defaultSettings: Settings = JSON.parse(defaultData);
    if (key in defaultSettings) {
      return defaultSettings[key].value;
    } else {
      return null;
    }
  } catch (err: any) {
    console.error(`Couldn't find setting ${key} in cache, then failed to read default settings: ${err.message}`);
    return null;
  }
}

/**
 * Refreshes settings file and cache. does the following:
 * - reads settings file, if it doesnt exist, copies from default-settings.json
 * - if it did already exist, merges default-settings into it (obv no overwriting)
 * - writes that merged result back into settings file
 * - updates memory cache (cachedSettings) as well
 */
export async function refreshSettings() {
  try {
    // read default settings
    const defaultData = await fs.promises.readFile(DEFAULT_SETTINGS_PATH, { encoding: 'utf8' });
    const defaultSettings: Settings = JSON.parse(defaultData);
    
    let userSettings: Settings = {};
    
    try {
      const userData = await fs.promises.readFile(USER_SETTINGS_PATH, { encoding: 'utf8' });
      userSettings = JSON.parse(userData);
    } catch (err: any) {
      if (err?.code !== 'ENOENT') {
        throw err; // wasnt file not found, uh we might have other problems
      }
      // else: maybe first time launching, we gotta create it in user data dir
    }
    
    // merge default settings in without overwriting VALUES (in case of any updates)
    // however we can overwrite other things like __desc or __placeholder since those are just for UI
    const mergedSettings = { ...defaultSettings };
    for (const key in userSettings) {
      mergedSettings[key] = { ...mergedSettings[key], value: userSettings[key].value };
    }
    
    // writing back to file + update cache if things didnt break
    const data = JSON.stringify(mergedSettings, null, 2);
    await fs.promises.writeFile(USER_SETTINGS_PATH, data, { encoding: 'utf8' });
    cachedSettings = mergedSettings;
    
    console.log(`Settings loaded/updated -> ${USER_SETTINGS_PATH}`);
  } catch (err: any) {
    console.error(`Failed to load/update settings: ${err.message}`);
    throw err;
  }
}

/**
 * settings entrypoint. does the following:
 * - reads settings.json, if it doesnt exist, copies from default-settings.json
 * - if it does exist, merges default-settings into it
 * - writes that merged result into the file
 * - updates memory cache (cachedSettings) as well
 */
export async function initSettings() {
  await refreshSettings();
}

/** registers ipcMain handlers for reading/writing a JSON settings file */
export function setupSettingsHandlers() {
  ipcMain.handle('settings:refresh', async () => {
    try {
      await refreshSettings();
      return { success: true, settings: cachedSettings };
    } catch (err: any) {
      return { success: false, error: err.message, settings: cachedSettings };
    }
  });

  ipcMain.handle('settings:get', () => cachedSettings);

  ipcMain.handle('settings:set', async (_, settings) => {
    try {
      const data = JSON.stringify(settings ?? {}, null, 2);
      await fs.promises.writeFile(USER_SETTINGS_PATH, data, { encoding: 'utf8' });
      cachedSettings = settings;
      return settings;
    } catch (err: any) {
      if (err?.code === 'ENOENT') {
        // hmm, did they fkin delete their settings file WHILE on the page??? bruh. recreate
        await initSettings();
        return cachedSettings;
      }
      throw new Error(`Failed to save settings: ${err.message}`);
    }
  });

  ipcMain.handle('settings:open-explorer', async (_, possiblyAppRelativePath: string) => {
    const resolvedPath = resolveAppRelativePath(possiblyAppRelativePath);
    if (fs.existsSync(resolvedPath)) {
      await shell.openPath(resolvedPath);
      return { success: true };
    } else {
      return { success: false, error: `Path does not exist: ${resolvedPath}` };
    }
  });

  ipcMain.handle('settings:choose-dir', async (event, maybeAppRelativePath?: string) => {

    // if maybeAppRelativePath, then use as default, otherwise start at $ (userData dir)
    let startDir = resolveAppRelativePath(maybeAppRelativePath ?? "$");

    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Select Directory",
      properties: ['openDirectory'],
      defaultPath: startDir,
    });
    return { success: !canceled, selectedPath: filePaths[0] };
  });
}
  