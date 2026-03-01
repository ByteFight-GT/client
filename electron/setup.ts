import ElectronStore from 'electron-store';
import { setupRunnerHandlers} from './runner.ts';
import { setupSettingsHandlers } from './settings.ts';
import { setupMapsHandlers } from './maps.ts';
import { setupBotsHandlers } from './bots.ts';
import { setupMatchesHandlers } from './matches.ts';

export function setupAllHandlers(store: ElectronStore) {
  setupSettingsHandlers();
  setupMapsHandlers();
  setupBotsHandlers();
  setupMatchesHandlers();
  setupRunnerHandlers();
}
