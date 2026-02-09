import ElectronStore from 'electron-store';
import { setupElectronStoreHandlers, setupFileHandlers, setupMatchHandlers, setupSettingsHandlers } from './handlers.ts';
import { setupPythonScriptHandlers} from './pythonHandlers.ts';

export function setupAllHandlers(store: ElectronStore, enginePath: string, matchPath: string) {
  setupElectronStoreHandlers(store);
  setupFileHandlers();
  setupMatchHandlers(matchPath);
  setupSettingsHandlers();
  
  setupPythonScriptHandlers(store, enginePath);
}
