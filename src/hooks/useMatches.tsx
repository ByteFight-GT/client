"use client";

import React from 'react';
import { MatchMetadata } from '../../common/types';

import { useToast } from '@/hooks/use-toast';
import { useLoadings } from './loadingsContext';

export type UseMatchesValue = {
  completedMatchHistory: MatchMetadata[];
  fetchMatchHistoryNextPage: (count: number) => void;
  writeMatchData: (matchData: MatchMetadata) => Promise<boolean>;
  addMatchToCompletedHistory: (matchData: MatchMetadata) => void;
};

const MatchesContext = React.createContext<UseMatchesValue | undefined>(undefined);

export const MatchesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  /** should be sorted in ascending queued order. these are COMPLETED matches. */
  const [completedMatchHistory, setCompletedMatchHistory] = React.useState<MatchMetadata[]>([]);

  const {toastError} = useToast();
  const {loadings, toggleLoading} = useLoadings();

  // >>> HANDLERS

  /**
   * Get the next page of *UNLOADED* completed matches from electron. This should be 
   * robust against changes in match history while the app is open; we assume that 
   * the index kept on the backend is always synced with our state here, so we can 
   * just request starting at the length of our current matchHistory.
   */
  const fetchMatchHistoryNextPage = React.useCallback((count: number) => {
    if (loadings.fetchMatchHistoryNextPage) return;

    toggleLoading("fetchMatchHistoryNextPage", true);

    window.electron.invoke('matches:readmany', completedMatchHistory.length, count)
      .then(res => {
        if (res.success) {
          setCompletedMatchHistory(prev => [
            ...prev,
            ...res.matches
          ]);
        } else {
          toastError("Failed to fetch match history", res.error);
        }
      })
      .catch((err: any) => {
        toastError("Failed to fetch match history", err);
      })
      .finally(() => {
        toggleLoading("fetchMatchHistoryNextPage", false);
      });
  }, [loadings.fetchMatchHistoryNextPage, completedMatchHistory.length, toggleLoading, toastError]);

  /**
   * Use solely for updating existing matches in state/files.
   * Writes `matchData` directly, doesnt update it or anything (e.g. if a match completed,
   * update it first before passing it into this)
   * use queueNewMatch for new ones!
   * 
   * Returns bool specifying whether write was successful
   */
  const writeMatchData = React.useCallback(async (matchData: MatchMetadata) => {
    try {
      const res = await window.electron.invoke('matches:write', matchData.matchId, matchData)
      if (res.success) {
        return true;
      } else {
        toastError("Failed to update match", res.error);
      }
    } catch (err: any) {
      toastError("Failed to update match", err);
    }

    return false;
  }, [toastError]);

  const addMatchToCompletedHistory = React.useCallback((matchData: MatchMetadata) => {
    setCompletedMatchHistory(prev => [...prev, matchData]);
  }, []);

  // >>> INITIAL SETUP

  React.useEffect(() => {
    fetchMatchHistoryNextPage(30);
  }, []);

  const value = React.useMemo(() => ({
    completedMatchHistory,
    fetchMatchHistoryNextPage,
    writeMatchData,
    addMatchToCompletedHistory,
  } satisfies UseMatchesValue), [
    completedMatchHistory,
    fetchMatchHistoryNextPage,
    writeMatchData,
    addMatchToCompletedHistory,
  ]);

  return (
    <MatchesContext.Provider value={value}>
      {children}
    </MatchesContext.Provider>
  );
};

export function useMatches(): UseMatchesValue {
  const context = React.useContext(MatchesContext);
  if (context === undefined) {
    throw new Error('useMatches must be used within a MatchesProvider');
  }
  return context;
}
