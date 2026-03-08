"use client";

import React from 'react';
import { Settings } from '../../common/types';
import { useToast } from '@/hooks/useToast';
import { useLoadings } from './useLoadings';

export type UseSettingsValue = {
  settings: Settings;
  fetchSettings: () => void;
  openAppRelativePathInExplorer: (appRelativePath: string) => void;
};

const SettingsContext = React.createContext<UseSettingsValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = React.useState<Settings>({});
  const {loadings, toggleLoading} = useLoadings();
  const {toastError} = useToast();

  // >>> HANDLERS

  const fetchSettings = React.useCallback(() => {
    if (loadings.fetchSettings) return;
    
    toggleLoading('fetchSettings', true);

    window.electron.invoke('settings:get')
    .then((settings) => {
      setSettings(settings);
    })
    .catch((err: any) => {
      toastError("Failed to fetch settings", err);
    })
    .finally(() => {
      toggleLoading('fetchSettings', false);
    });
  }, [loadings.fetchSettings, toggleLoading, toastError]);

  const openAppRelativePathInExplorer = React.useCallback((appRelativePath: string) => {
    if (loadings.openExplorer) return;
    toggleLoading('openExplorer', true);

    window.electron.invoke('settings:open-explorer', appRelativePath)
    .then((res) => {
      if (!res.success) {
        toastError("Failed to open explorer", new Error(res.error));
      }
    })
    .catch((err) => {
      toastError("Failed to open explorer", err);
    })
    .finally(() => {
      toggleLoading('openExplorer', false);
    });
  }, [loadings.openExplorer, toggleLoading]);


  // >>> INITIAL SETUP

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const value = React.useMemo(() => ({
    settings,
    fetchSettings,
    openAppRelativePathInExplorer,
  } satisfies UseSettingsValue), [
    settings, 
    fetchSettings,
    openAppRelativePathInExplorer,
  ]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): UseSettingsValue {
  const context = React.useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
