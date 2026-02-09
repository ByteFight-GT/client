import ElectronStore from 'electron-store';
import { setupElectronStoreHandlers, setupFileHandlers, setupMatchHandlers } from './handlers.ts';
import { setupPythonScriptHandlers} from './pythonHandlers.ts';
import { setupSettingsHandlers } from './settings.ts';

export function setupAllHandlers(store: ElectronStore, enginePath: string, matchPath: string) {
  setupElectronStoreHandlers(store);
  setupFileHandlers();
  setupMatchHandlers(matchPath);
  setupSettingsHandlers();
  
  setupPythonScriptHandlers(store, enginePath);
}
