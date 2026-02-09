import { app, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { type Settings } from '../common/settingsBridge.ts';

export const USER_SETTINGS_PATH = path.join(
  app.getPath("userData"),
  "settings.json"
);
console.log(`User settings path: ${USER_SETTINGS_PATH}`);

export const DEFAULT_SETTINGS_PATH = path.join(
  app.getAppPath(),
  "resources/default-settings.json"
);

/** cache settings from file on startup, then write to disk on updates */
let cachedSettings: Settings | null = null;

/**
 * settings entrypoint. does the following:
 * - reads settings.json, if it doesnt exist, copies from default-settings.json
 * - if it does exist, merges default-settings into it
 * - writes that merged result into the file
 * - updates memory cache (cachedSettings) as well
 */
export async function loadSettings() {
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
    
    // merge default settings in without overwriting (in case of any updates)
    const mergedSettings = { ...defaultSettings, ...userSettings };
    
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

/** registers ipcMain handlers for reading/writing a JSON settings file */
export function setupSettingsHandlers() {
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
        await loadSettings();
        return cachedSettings;
      }
      throw new Error(`Failed to save settings: ${err.message}`);
    }
  });
}
  