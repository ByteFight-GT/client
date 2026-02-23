import path from "path";
import { app } from 'electron';
import { getCachedSettingOrDefault } from "./settings.ts";

/**
 * an app-relative path is one defined in the settings file like `$/some/path` or `$some/path`.
 * The `$` prefix indicates to start from the `app.getPath("userData")` directory.
 * 
 * if `relPath` arg doesnt start with `$`, then returns it as is. 
 * Otherwise, resolves to a full absolute path.
 */
export function resolveAppRelativePath(appRelativePath: string): string {
  if (!appRelativePath.startsWith('$')) {
    return appRelativePath;
  }
  return path.join(app.getPath('userData'), appRelativePath.substring(1));
}

/**
 * Get a resolved path to common directories for the app, like bots, maps, matches, etc.
 * If it somehow doesnt exist in both settings cache and theres somehow not even a default
 * value (which prob means someones tampering with something or your settingKey is wrong), 
 * then throws an error telling the user to reset that setting to default config.
 * 
 * Look in default-settings.json for the keys this can be used with. as of writing we have
 * - "Bots Directory"
 * - "Maps Directory"
 * - "Matches Directory"
 * - "Games Directory"
 * - "Logs Directory"
 */
export function tryGetConfiguredDir(settingKey: string): string {
  const settingValue = getCachedSettingOrDefault(settingKey);
  if (!settingValue) {
    throw new Error(`Couldn't resolve the "${settingKey}" path from config. This is likely to be a settings file problem, or a bug. Try reopening the client or updating "${settingKey}" in config to a valid value.`);
  }

  return resolveAppRelativePath(settingValue);
}
  