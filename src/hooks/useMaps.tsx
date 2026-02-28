"use client";

import React from 'react';
import { useToast } from '@/hooks/useToast';
import { useLoadings } from './loadingsContext';
import { MapData } from '@/gametypes';

export type UseMapsValue = {
  maps: string[];
  fetchMapList: () => void;
  readMap: (mapName: string) => Promise<MapData | null>;
  handleImportMaps: () => Promise<void>;

  /** attempts to delete all maps in mapNames, return array of successfully deleted maps. */
  handleDeleteMaps: (mapNames: Iterable<string>) => Promise<string[]>;

  handleSaveMap: (mapData: MapData) => Promise<void>;
};

const MapsContext = React.createContext<UseMapsValue | undefined>(undefined);

export const MapsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [maps, setMaps] = React.useState<string[]>([]);
  const {loadings, toggleLoading, asyncLoadingWrapper} = useLoadings();
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

  const readMap = React.useCallback(asyncLoadingWrapper(
    "readMap",
    async (mapName: string) => {
      const res = await window.electron.invoke('maps:read', mapName);
      if (res.success) {
        return JSON.parse(res.mapData);
      } else {
        toastError("Failed to read map", res.error);
        return null;
      }
		}), 
    [toastError]
  );

  const handleImportMaps = React.useCallback(asyncLoadingWrapper(
    "handleImportMaps",
    async () => {
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
    }), 
    [toast, toastError]
  );

  const handleDeleteMaps = React.useCallback(asyncLoadingWrapper(
    "handleDeleteMaps", 
    async (mapNames: Iterable<string>) => {
      const res = await window.electron.invoke('maps:delete', [...mapNames])
      if (res.success) {
        setMaps(prev => {
          return prev.filter(mapName => !res.deleted.includes(mapName));
        });
      } else {
        toastError("Failed to delete maps", res.error);
      }
      return res.deleted;
    }), 
    [toastError]
  );

  const handleSaveMap = React.useCallback(asyncLoadingWrapper(
    "handleSaveMap",
    async (mapData: MapData) => {
      window.electron.invoke('maps:write', mapData.name, JSON.stringify(mapData, null, 2))
      .then(res => {
        if (res.success) {
          toast({
            title: "Map Saved",
            description: `Successfully saved map "${mapData.name}"`,
          });
          if (!maps.includes(mapData.name)) {
            setMaps(prev => [...prev, mapData.name]);
          }
        } else {
          toastError("Failed to save map", res.error);
        }
      })
      .catch((err: any) => {
        toastError("Failed to save map", err);
      })
    }), 
    [maps, toast, toastError]
  );

  // >>> INITIAL SETUP

  React.useEffect(() => {
    fetchMapList();
  }, []);

  const value = React.useMemo(() => ({
    maps,
    fetchMapList,
    readMap,
    handleImportMaps,
    handleDeleteMaps,
    handleSaveMap,
  } satisfies UseMapsValue), [
    maps, 
    fetchMapList, 
    readMap,
    handleImportMaps, 
    handleDeleteMaps,
    handleSaveMap,
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
