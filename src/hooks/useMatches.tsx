"use client";

import React from 'react';
import { MatchMetadata } from '../../common/types';

import { useToast } from '@/hooks/useToast';
import { useLoadings } from './useLoadings';
import { useGame } from '@/gamerenderer/useGame';

export type UseMatchesValue = {
  completedMatchHistory: MatchMetadata[];
  totalMatchesIndexed: number;
  fetchMatchHistoryNextPage: (count: number) => void;
  addMatchToCompletedHistory: (matchData: MatchMetadata) => void;
};

const MatchesContext = React.createContext<UseMatchesValue | undefined>(undefined);

export const MatchesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  /** should be sorted in ascending queued order. these are COMPLETED matches. */
  const [completedMatchHistory, setCompletedMatchHistory] = React.useState<MatchMetadata[]>([]);

  /** returned from electron, for pagination */
  const [totalMatchesIndexed, setTotalMatchesIndexed] = React.useState(0);

  const {toastError} = useToast();
  const {loadings, toggleLoading} = useLoadings();
  const {reset} = useGame();

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
    console.log(`[fetchMatchHistoryNextPage] requesting matches starting at index ${completedMatchHistory.length} with count ${count}`);

    window.electron.invoke('matches:readmany', completedMatchHistory.length, count)
      .then(res => {
        if (res.success) {
          setTotalMatchesIndexed(res.total);
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
        console.log(`[fetchMatchHistoryNextPage] finished fetching matches, total indexed matches: ${totalMatchesIndexed}, current loaded matches: ${completedMatchHistory.length}`);
      });
  }, [loadings.fetchMatchHistoryNextPage, completedMatchHistory.length, toggleLoading, toastError]);

  const addMatchToCompletedHistory = React.useCallback((matchData: MatchMetadata) => {
    setCompletedMatchHistory(prev => [matchData, ...prev]);
    setTotalMatchesIndexed(prev => prev + 1);
  }, []);

  // >>> INITIAL SETUP

  React.useEffect(() => {
    fetchMatchHistoryNextPage(30);
  }, []);

  const value = React.useMemo(() => ({
    completedMatchHistory,
    totalMatchesIndexed,
    fetchMatchHistoryNextPage,
    addMatchToCompletedHistory,
  } satisfies UseMatchesValue), [
    completedMatchHistory,
    totalMatchesIndexed,
    fetchMatchHistoryNextPage,
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
