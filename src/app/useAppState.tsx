'use client';

import React from 'react';
import { Settings } from '../../common/types';
import { useToast } from '@/hooks/use-toast';

export type AppStateValue = {
  maps: string[];
  bots: string[];
  settings: Settings;
  setMaps: React.Dispatch<React.SetStateAction<string[]>>;
  setBots: React.Dispatch<React.SetStateAction<string[]>>;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  errors: Record<string, Error>;
  loadings: Record<string, boolean>;
  handleImportMaps: () => void;
  handleImportBots: () => void;
};

const AppContext = React.createContext<AppStateValue | undefined>(undefined);

/** App-wide global states that can be used everywhere */
export const AppContextProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [maps, setMaps] = React.useState<string[]>([]);
  const [bots, setBots] = React.useState<string[]>([]);
  const [settings, setSettings] = React.useState<Settings>({});

  const [loadings, setLoadings] = React.useState<Record<string, boolean>>({});
  const [errors, setErrors] = React.useState<Record<string, Error>>({});

  const { toast } = useToast();

  function addError(key: string, error: string | Error) {
    setErrors(prev => ({ 
      ...prev, 
      [key]: error instanceof Error? error : new Error(error) 
    }));
  }
  function toggleLoading(key: string, value?: boolean) {
    setLoadings(prev => ({
      ...prev,
      [key]: value !== undefined ? value : !prev[key],
    }));
  }
  
  // >>> FETCHERS (from electron)

  const fetchSettings = React.useCallback(() => {
    if (loadings["fetchSettings"]) return; // prevent multiple fetches
    
    toggleLoading("fetchSettings", true);

    window.electron.invoke('settings:get')
    .then((settings) => {
      setSettings(settings);
    }).catch((err: any) => {
      addError("fetchSettings", err);
    }).finally(() => {
      toggleLoading("fetchSettings", false);
    });
  }, [loadings]);

  const fetchMapList = React.useCallback(() => {
    if (loadings["fetchMapList"]) return;

    toggleLoading("fetchMapList", true);

    window.electron.invoke('maps:list')
    .then(res => {
      if (res.success) {
        setMaps(res.maps);
      } else {
        addError("fetchMapList", res.error);
      }
    }).finally(() => {
      toggleLoading("fetchMapList", false);
    });
  }, [loadings]);

  const fetchBotsList = React.useCallback(() => {
    if (loadings["fetchBotsList"]) return;

    toggleLoading("fetchBotsList", true);

    window.electron.invoke('bots:list')
    .then(res => {
      if (res.success) {
        setBots(res.bots);
      } else {
        addError("fetchBotsList", res.error);
      }
    }).finally(() => {
      toggleLoading("fetchBotsList", false);
    });
  }, [loadings]);

  // <<< END FETCHERS

  // INITIAL SETUP
  React.useEffect(() => {
    console.log("AppContextProvider mounted, fetching initial data...");
    fetchSettings();
    fetchMapList();
    fetchBotsList();
  }, []);

  // >>> HANDLERS

  const handleImportMaps = React.useCallback(() => {
    window.electron.invoke('maps:import')
    .then((res) => {
      if (res.success && res.imported.length > 0) {
        setMaps(prev => [...prev, ...res.imported]);
        toast({
          title: "Maps Imported",
          description: `Successfully imported ${res.imported.length} map(s)!`,
        });
      }
    }).catch((err: any) => {
      toast({
        title: "Failed to import maps",
        description: err instanceof Error? err.message : String(err),
      });
    });
  }, [toast]);

  const handleImportBots = React.useCallback(() => {
    window.electron.invoke('bots:import')
    .then((res) => {
      if (res.success && res.imported.length > 0) {
        setBots(prev => [...prev, ...res.imported]);
        toast({
          title: "Bots Imported",
          description: `Successfully imported ${res.imported.length} bot(s)!`,
        });
      }
    }).catch((err: any) => {
      toast({
        title: "Failed to import bots",
        description: err instanceof Error? err.message : String(err),
      });
    });
  }, [toast]);

  // <<< END HANDLERS

  const value = React.useMemo(() => ({
    maps,
    bots,
    settings,
    setMaps,
    setBots,
    setSettings,
    errors,
    loadings,
    handleImportMaps,
    handleImportBots
  }), [
    maps,
    bots,
    settings,
    errors,
    loadings,
    handleImportMaps,
    handleImportBots
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = (): AppStateValue => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error("AppContext must be used within a AppContextProvider");
  }
  return context;
};
