export type Settings = Record<string, Record<string, any>>; 

export interface SettingsBridgeAPI {
  get(): Promise<Settings>;
  set(settings: Settings): Promise<Settings>;
}