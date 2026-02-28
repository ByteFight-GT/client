"use client";

import React from 'react';
import { useToast } from '@/hooks/useToast';
import { useLoadings } from './loadingsContext';

export type UseBotsValue = {
  bots: string[];
  fetchBotList: () => void;
  handleImportBots: () => void;
};

const BotsContext = React.createContext<UseBotsValue | undefined>(undefined);

export const BotsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bots, setBots] = React.useState<string[]>([]);
  const {loadings, toggleLoading} = useLoadings();
  const {toast, toastError} = useToast();

  // >>> HANDLERS

  const fetchBotList = React.useCallback(() => {
    if (loadings['fetchBotList']) return;

    toggleLoading('fetchBotList', true);

    window.electron.invoke('bots:list')
    .then(res => {
      if (res.success) {
        setBots(res.bots);
      } else {
        toastError("Failed to fetch bot list", res.error);
      }
    })
    .catch((err: any) => {
      toastError("Failed to fetch bot list", err);
    })
    .finally(() => {
      toggleLoading('fetchBotList', false);
    });
  }, [loadings, toggleLoading, toastError]);

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
    })
    .catch((err: any) => {
      toastError("Failed to import bots", err);
    });
  }, [toastError]);

  // >>> INITIAL SETUP

  React.useEffect(() => {
    fetchBotList();
  }, []);

  const value = React.useMemo(() => ({
    bots,
    fetchBotList,
    handleImportBots,
  } satisfies UseBotsValue), [
    bots, 
    fetchBotList, 
    handleImportBots
  ]);

  return (
    <BotsContext.Provider value={value}>
      {children}
    </BotsContext.Provider>
  );
};

export function useBots(): UseBotsValue {
  const context = React.useContext(BotsContext);
  if (context === undefined) {
    throw new Error('useBots must be used within a BotsProvider');
  }
  return context;
}
