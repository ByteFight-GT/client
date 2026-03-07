import path from 'path';
import fs from 'fs';
import { ipcMain } from 'electron';
import { tryGetConfiguredDir } from './utils.ts';

/**
 * Initialization, run on app startup
 */
export function initLogs() {
  const logsDir = tryGetConfiguredDir("Logs Directory");

  // create logs dir if it doesn't exist
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  console.log(`Initialized logs directory: ${logsDir}`);
}

/**
 * Get the path to a log file
 * Format: <logsDir>/<matchId>/<mapName>.txt
 */
function getLogPath(matchId: string, mapName: string): string {
  const logsDir = tryGetConfiguredDir("Logs Directory");
  return path.join(logsDir, matchId, `${mapName}.txt`);
}

/**
 * Get the directory path for a match's logs
 */
function getMatchLogsDir(matchId: string): string {
  const logsDir = tryGetConfiguredDir("Logs Directory");
  return path.join(logsDir, matchId);
}

export function setupLogsHandlers() {
  /**
   * Write log data to a file
   * logs:write takes matchId, mapName, and logData (string)
   */
  ipcMain.handle('logs:write', async (event, matchId: string, mapName: string, logData: string) => {
    const logPath = getLogPath(matchId, mapName);

    try {
      // create directory structure if needed
      const logDir = path.dirname(logPath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      await fs.promises.writeFile(logPath, logData, { encoding: 'utf8' });

      console.log(`[logs:write] Wrote log for ${matchId}/${mapName} to ${logPath}`);
      return { success: true };
    } catch (err: any) {
      console.error(`[logs:write] Failed to write log for ${matchId}/${mapName}: ${err.message}`);
      return { success: false, error: err.message };
    }
  });

  /**
   * Read a log file
   * logs:read takes matchId and mapName
   */
  ipcMain.handle('logs:read', async (event, matchId: string, mapName: string) => {
    const logPath = getLogPath(matchId, mapName);

    // check if log exists - game runs that dont produce any stdout wont have a log file
    if (!fs.existsSync(logPath)) {
      return { success: true, logData: null };
    }

    try {
      const logData = await fs.promises.readFile(logPath, { encoding: 'utf8' });

      console.log(`[logs:read] Read log for ${matchId}/${mapName}`);
      return { success: true, logData };
    } catch (err: any) {
      console.error(`[logs:read] Failed to read log for ${matchId}/${mapName}: ${err.message}`);
      return { success: false, error: err.message };
    }
  });

  /**
   * Delete a log file
   * logs:delete takes matchId and mapName
   */
  ipcMain.handle('logs:delete', async (event, matchId: string, mapName: string) => {
    const logPath = getLogPath(matchId, mapName);

    try {
      await fs.promises.unlink(logPath);

      console.log(`[logs:delete] Deleted log for ${matchId}/${mapName}`);
      return { success: true };
    } catch (err: any) {
      console.error(`[logs:delete] Failed to delete log for ${matchId}/${mapName}: ${err.message}`);
      return { success: false, error: err.message };
    }
  });

  /**
   * Bulk delete logs for a match
   * logs:deletematch takes matchId and optionally a list of mapNames to delete
   * If mapNames is not provided, deletes the entire match directory
   */
  ipcMain.handle('logs:deletematch', async (event, matchId: string, mapNames?: string[]) => {
    const matchLogsDir = getMatchLogsDir(matchId);

    try {
      if (!fs.existsSync(matchLogsDir)) {
        return { success: true, deleted: 0 };
      }

      let deletedCount = 0;

      if (mapNames && mapNames.length > 0) {
        // delete specific maps
        for (const mapName of mapNames) {
          const logPath = getLogPath(matchId, mapName);
          try {
            await fs.promises.unlink(logPath);
            deletedCount++;
          } catch (err) {
            console.warn(`[logs:deletematch] Failed to delete ${mapName} for match ${matchId}`);
          }
        }
      } else {
        // delete entire match directory
        const files = fs.readdirSync(matchLogsDir);
        deletedCount = files.filter(file => file.endsWith('.txt')).length;
        await fs.promises.rm(matchLogsDir, { recursive: true });
      }

      console.log(`[logs:deletematch] Deleted ${deletedCount} logs for match ${matchId}`);
      return { success: true, deleted: deletedCount };
    } catch (err: any) {
      console.error(`[logs:deletematch] Failed to delete logs for match ${matchId}: ${err.message}`);
      return { success: false, error: err.message };
    }
  });
}
