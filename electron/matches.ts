import { app, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { type MatchMetadata } from '../common/types.ts';
import { tryGetConfiguredDir } from './utils.ts';

/**
 * In-memory cache of files in the matches directory.
 * Stays sorted in ASCENDING ORDER by queued time (in the filename).
 * Whenever we write/update a match we can just add/move it to the front since its most recent
 * 
 * Note that matchId (containing queuedTime and a random suffix) is used as filename
 */
const MATCHES_INDEX: {
  matchId: string;
  queuedTimestamp: number;
}[] = [];

export function rebuildMatchesIndex() {
  const matchesPath = tryGetConfiguredDir("Matches Directory");

  const files = fs.readdirSync(matchesPath);
  MATCHES_INDEX.length = 0; // clear the index
  for (const filename of files) {
    if (filename.endsWith('.json')) {
      // extract queuedTime from filename
      const queuedTime = parseInt(filename.split('-')[0]);
      MATCHES_INDEX.push({ matchId: filename, queuedTimestamp: queuedTime });
    }
  }

  // sort by queuedTime (newest first)
  MATCHES_INDEX.sort((a, b) => b.queuedTimestamp - a.queuedTimestamp);

	console.log(`Rebuilt matches index - size: ${MATCHES_INDEX.length}`);
}

export async function updateMatchStatus(matchId: string, newStatus: MatchMetadata["status"]): Promise<boolean> {
  const matchPath = path.join(tryGetConfiguredDir("Matches Directory"), matchId);

  try {
    const data = await fs.promises.readFile(matchPath, { encoding: 'utf8' });
    const matchData: MatchMetadata = JSON.parse(data);
    matchData.status = newStatus;
    await fs.promises.writeFile(matchPath, JSON.stringify(matchData, null, 2), { encoding: 'utf8' });
    return true;
  } catch (err: any) {
    console.error(`Failed to update match status for ${matchId}: ${err.message}`);
    return false;
  }
}

/**
 * initialization, run on app startup
 */
export function initMatches() {
  const matchesDir = tryGetConfiguredDir("Matches Directory");

	// create matches dir if it doesn't exist
	if (!fs.existsSync(matchesDir)) {
		fs.mkdirSync(matchesDir, { recursive: true });
	}

  // build initial index
  rebuildMatchesIndex();
}


export function setupMatchesHandlers() {
  ipcMain.handle('matches:reindex', () => {
    rebuildMatchesIndex();
    return { success: true };
  });

	ipcMain.handle('matches:readmany', async (event, start: number = 0, limit: number = 100) => {
		try {
			const paginatedFiles = MATCHES_INDEX.slice(start, start + limit).map(item => item.matchId);
			
      // read all of them
			const matches = await Promise.all(
				paginatedFiles.map(async (file) => {
					const matchesDir = tryGetConfiguredDir("Matches Directory");
					const filePath = path.join(matchesDir, file);
					const data = await fs.promises.readFile(filePath, { encoding: 'utf8' });
					return { fileName: file, data };
				})
			);
			
			return { 
				success: true, 
				matches, 
				total: MATCHES_INDEX.length,
				start,
				limit
			};
		} catch (err: any) {
			console.error(`Failed to list matches: ${err.message}`);
			return { success: false, error: err.message, matches: [], total: 0 };
		}
	});

	ipcMain.handle('matches:write', async (event, matchData: MatchMetadata) => {
		const matchesDir = tryGetConfiguredDir("Matches Directory");
		const matchPath = path.join(matchesDir, matchData.matchId);
		console.log(`[matches:write] Writing match ${matchData.matchId} to ${matchPath}`);

		try {
			await fs.promises.writeFile(matchPath, JSON.stringify(matchData, null, 2), { encoding: 'utf8' });

      // add to index if new. we can assume its most recent, no need to resort
      if (!MATCHES_INDEX.some(ele => ele.matchId === matchData.matchId)) {
        MATCHES_INDEX.push({ matchId: matchData.matchId, queuedTimestamp: matchData.queuedTimestamp });
      }

			return { success: true };
		} catch (err: any) {
			console.error(`Failed to write match ${matchData.matchId}: ${err.message}`);
			return { success: false, error: err.message };
		}
	});

	ipcMain.handle('matches:delete', async (event, fileNames: string[]) => {
		const deleted: Set<string> = new Set();
		for (const fileName of fileNames) {
			const matchesDir = tryGetConfiguredDir("Matches Directory");
			const matchPath = path.join(matchesDir, fileName);
			try {
				await fs.promises.unlink(matchPath);
				deleted.add(fileName);
			} catch (err: any) {
				console.warn(`[matches:delete] Failed to delete match ${fileName}: ${err.message}`);
			}
		}

    // update index using pointers to avoid o(n^2) splice bs
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < MATCHES_INDEX.length; readIndex++) {
      if (!deleted.has(MATCHES_INDEX[readIndex].matchId)) {
        MATCHES_INDEX[writeIndex] = MATCHES_INDEX[readIndex];
        writeIndex++;
      }
    }
    MATCHES_INDEX.length = writeIndex; // truncate the rest

		return { success: deleted.size === fileNames.length, deleted: Array.from(deleted) };
	});
}
