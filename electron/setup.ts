import ElectronStore from 'electron-store';
import { setupElectronStoreHandlers, setupFileHandlers, setupMatchHandlers } from './handlers.ts';
import { setupRunnerHandlers} from './runner.ts';
import { setupSettingsHandlers } from './settings.ts';
import { setupMapsHandlers } from './maps.ts';
import { setupBotsHandlers } from './bots.ts';
import { setupMatchesHandlers } from './matches.ts';

export function setupAllHandlers(store: ElectronStore, enginePath: string, matchPath: string) {
  setupElectronStoreHandlers(store);
  setupFileHandlers();
  setupMatchHandlers(matchPath);
  setupSettingsHandlers();
  setupMapsHandlers();
  setupBotsHandlers();
  setupMatchesHandlers();
  setupRunnerHandlers(enginePath);
}
