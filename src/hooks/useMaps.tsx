'use client';

import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLoadings } from './loadingsContext';

export type UseMapsValue = {
  maps: string[];
  fetchMapList: () => void;
  handleImportMaps: () => void;
};

const MapsContext = React.createContext<UseMapsValue | undefined>(undefined);

export const MapsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [maps, setMaps] = React.useState<string[]>([]);
  const {loadings, toggleLoading} = useLoadings();
  const {toast, toastError} = useToast();

  // >>> HANDLERS

  const fetchMapList = React.useCallback(() => {
    if (loadings['fetchMapList']) return;
    
    toggleLoading('fetchMapList', true);

    window.electron.invoke('maps:list')
    .then(res => {
      if (res.success) {
        setMaps(res.maps);
      } else {
        toastError("Failed to fetch map list", res.error);
      }
    })
    .catch((err: any) => {
      toastError("Failed to fetch map list", err);
    })
    .finally(() => {
      toggleLoading('fetchMapList', false);
    });
  }, [loadings, toastError]);

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
      })
      .catch((err: any) => {
        toastError("Failed to import maps", err);
      });
  }, [toast, toastError]);

  // >>> INITIAL SETUP

  React.useEffect(() => {
    fetchMapList();
  }, []);

  const value = React.useMemo(() => ({
    maps,
    fetchMapList,
    handleImportMaps,
  } satisfies UseMapsValue), [
    maps, 
    fetchMapList, 
    handleImportMaps, 
  ]);

  return (
    <MapsContext.Provider value={value}>
      {children}
    </MapsContext.Provider>
  );
};

export function useMaps(): UseMapsValue {
  const context = React.useContext(MapsContext);
  if (context === undefined) {
    throw new Error('useMaps must be used within a MapsProvider');
  }
  return context;
}
