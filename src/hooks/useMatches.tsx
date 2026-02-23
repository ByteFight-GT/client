"use client";

import React from 'react';
import { MatchMetadata } from '../../common/types';
import { generateMatchId } from '../../common/utils';
import { useToast } from '@/hooks/use-toast';
import { useLoadings } from './loadingsContext';

type QueueNewMatchParams = {
  selectedGreenTeam: string;
  selectedBlueTeam: string;
  selectedMaps: string[];
};

export type UseMatchesValue = {
  completedMatchHistory: MatchMetadata[];
  queuedMatches: MatchMetadata[];
  currentlyRunningMatch: MatchMetadata | null;

  fetchMatchHistoryNextPage: (count: number) => void;
  queueNewMatch: (params: QueueNewMatchParams) => void;
  handleStartMatch: (matchData: MatchMetadata) => void;
  terminateRunningMatch: (matchData: MatchMetadata) => void;
  handleMatchEnd: (matchData: MatchMetadata) => void;
  updateExistingMatch: (matchData: MatchMetadata) => void;
};

const MatchesContext = React.createContext<UseMatchesValue | undefined>(undefined);

export const MatchesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /** should be sorted in ascending queued order. these are COMPLETED matches. */
  const [completedMatchHistory, setCompletedMatchHistory] = React.useState<MatchMetadata[]>([]);

  /** queued matches. These will NOT be saved when the app is closed. */
  const [queuedMatches, setQueuedMatches] = React.useState<MatchMetadata[]>([]);

  /** 
   * stores the match thats currently running on the backend. In theory this should never
   * be null as long as queuedMatches isnt empty.
   */
  const [currentlyRunningMatch, setCurrentlyRunningMatch] = React.useState<MatchMetadata | null>(null);

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
   * Create a new match object and updates state/storage so it shows up
   * in history/queue. used by the run match flow when starting a new match.
   * 
   * Does NOT handle actually starting the processes to run the games - this
   * solely handles creating and saving metadata.
   */
  const queueNewMatch = React.useCallback((params: QueueNewMatchParams) => {
    const queuedTime = new Date();
    const matchId = generateMatchId(queuedTime.getTime());
    const matchData = {
      matchId: matchId,
      queuedTimestamp: queuedTime.getTime(),
      startTimestamp: null,
      finishTimestamp: null,
      notes: "",
      maps: params.selectedMaps,
      resultFiles: [],
      teamGreen: params.selectedGreenTeam,
      teamBlue: params.selectedBlueTeam,
      greenWins: [],
      blueWins: [],
      status: 'queued',
    } as MatchMetadata;

    setQueuedMatches(prev => [...prev, matchData]);

    // check if we should start the match immediately (if no other match is running)
    if (!currentlyRunningMatch) {
      setCurrentlyRunningMatch(matchData);
    }
  }, [currentlyRunningMatch]);

  /** handles calling electron to begin match/game loops and listeners. */
  const handleStartMatch = React.useCallback((matchData: MatchMetadata) => {

    if (loadings.handleStartMatch) return;

    toggleLoading("handleStartMatch", true);
    
    // runner will check if theres already a match running
    window.electron.invoke('runner:start-match', matchData.matchId, matchData)
    .then(res => {
      if (res.success) {
        // add to end of state arr
        setCompletedMatchHistory(prev => [...prev, matchData]);
      } else {
        toastError("Failed to start match", res.error);
      }
    })
    .catch((err: any) => {
      toastError("Failed to start match", err);
    })
    .finally(() => {
      toggleLoading("handleStartMatch", false);
    });
  }, [toggleLoading, toastError]);

  /** used for *intentionally and manually* stopping the running match before completion. */
  const terminateRunningMatch = React.useCallback((matchData: MatchMetadata) => {
    // TODO: implement
  }, []);

  /** handles cleanup/takedown when a match completes for any reason (finished/termination),
   * and checks if we can move on to the next match in the queue.
   */
  const handleMatchEnd = React.useCallback((matchData: MatchMetadata) => {
    // allow these to run in parallel since they arent user-triggered.
    // although this shouldnt ever need to run more than once at a time...
    // since we dont support having multiple matches running at the same time anyway
    toggleLoading("handleMatchEnd", true);
    
    window.electron.invoke('TODO', matchData.matchId, matchData)
    .then(res => {
      if (res.success) {
        // add to end of state arr
        setCompletedMatchHistory(prev => [...prev, matchData]);
      } else {
        toastError("Error while handling match end", res.error);
      }
    })
    .catch((err: any) => {
      toastError("Error while handling match end", err);
    })
    .finally(() => {
      toggleLoading("handleMatchEnd", false);
    });
  }, [toggleLoading, toastError]);

  /**
   * Use solely for updating existing matches in state/files.
   * use queueNewMatch for new ones!
   */
  const updateExistingMatch = React.useCallback((matchData: MatchMetadata) => {
    if (loadings["updateExistingMatch"]) return;

    toggleLoading("updateExistingMatch", true);

    window.electron.invoke('matches:write', matchData.matchId, matchData)
    .then(res => {
      if (res.success) {
        // update state as well
        setCompletedMatchHistory(prev => prev.map(m => m.matchId === matchData.matchId ? matchData : m));
      } else {
        toastError("Failed to update match", res.error);
      }
    })
    .catch((err: any) => {
      toastError("Failed to update match", err);
    })
    .finally(() => {
      toggleLoading("updateExistingMatch", false);
    });
  }, [loadings, toggleLoading, toastError]);

  // >>> INITIAL SETUP

  React.useEffect(() => {
    fetchMatchHistoryNextPage(30);
  }, []);

  const value = React.useMemo(() => ({
    completedMatchHistory,
    queuedMatches,
    currentlyRunningMatch,
    fetchMatchHistoryNextPage,
    queueNewMatch,
    handleStartMatch,
    terminateRunningMatch,
    handleMatchEnd,
    updateExistingMatch,
  } satisfies UseMatchesValue), [
    completedMatchHistory,
    queuedMatches,
    currentlyRunningMatch,
    fetchMatchHistoryNextPage,
    queueNewMatch,
    handleStartMatch,
    terminateRunningMatch,
    handleMatchEnd,
    updateExistingMatch,
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
