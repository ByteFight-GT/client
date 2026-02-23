'use client';

import React from 'react';
import { Settings, MatchMetadata } from '../../common/types';
import { generateMatchId } from '../../common/utils';
import { useToast } from '@/hooks/use-toast';

export type AppStateValue = {
  maps: string[];
  bots: string[];
  settings: Settings;
  matchHistory: MatchMetadata[];

  setMaps: React.Dispatch<React.SetStateAction<string[]>>;
  setBots: React.Dispatch<React.SetStateAction<string[]>>;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  setMatchHistory: React.Dispatch<React.SetStateAction<MatchMetadata[]>>;

  fetchMapList: () => void;
  fetchBotList: () => void;
  fetchSettings: () => void;
  fetchMatchHistoryNextPage: () => void;

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

  /** should be sorted in ascending queued order. these are COMPLETED matches. */
  const [completedMatchHistory, setCompletedMatchHistory] = React.useState<MatchMetadata[]>([]);

  /** queued matches. These will NOT be saved when the app is closed. */
  const [queuedMatches, setQueuedMatches] = React.useState<MatchMetadata[]>([]);

  /** stores the match thats currently running on the backend. In the best case this should never
   * be null as long as queuedMatches isnt empty.
   */
  const [currentlyRunningMatch, setCurrentlyRunningMatch] = React.useState<MatchMetadata | null>(null);

  const [loadings, setLoadings] = React.useState<Record<string, boolean>>({});

  const { toast } = useToast();

  function toastError(title: string, error: string | Error) {
    toast({
      title,
      description: error instanceof Error? error.message : String(error),
    });
  }
  function toggleLoading(key: string, value?: boolean) {
    setLoadings(prev => ({
      ...prev,
      [key]: value !== undefined? value : !prev[key],
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
      toastError("fetchSettings", err);
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
        toastError("Failed to fetch map list", res.error);
      }
    }).finally(() => {
      toggleLoading("fetchMapList", false);
    });
  }, [loadings]);

  const fetchBotList = React.useCallback(() => {
    if (loadings["fetchBotList"]) return;

    toggleLoading("fetchBotList", true);

    window.electron.invoke('bots:list')
    .then(res => {
      if (res.success) {
        setBots(res.bots);
      } else {
        toastError("Failed to fetch bot list", res.error);
      }
    }).finally(() => {
      toggleLoading("fetchBotList", false);
    });
  }, [loadings]);

  /**
   * Get the next page of *UNLOADED* matches from electron. This should be 
   * robust against changes in match history while the app is open; we assume 
   * that the index kept on the backend is always synced with our state here, 
   * so we can just request starting at the length of our current matchHistory.
   */
  const fetchMatchHistoryNextPage = React.useCallback(() => {
    if (loadings["fetchMatchHistoryNextPage"]) return;

    toggleLoading("fetchMatchHistoryNextPage", true);

    window.electron.invoke('matchHistory:readmany', completedMatchHistory.length, 100)
    .then(res => {
      if (res.success) {
        setCompletedMatchHistory(prev => [
          ...prev,
          ...res.matches
        ]);
      } else {
        toastError("Failed to fetch match history", res.error);
      }
    }).finally(() => {
      toggleLoading("fetchMatchHistoryNextPage", false);
    });
  }, [loadings]);

  /**
   * Create a new match object and updates state/storage so it shows up
   * in history/queue. used by the run match flow when starting a new match.
   * 
   * Does NOT handle actually starting the processes to run the games - this
   * solely handles creating and saving metadata.
   */
  const queueNewMatch = React.useCallback(({
    selectedGreenTeam,
    selectedBlueTeam,
    selectedMaps,
  }) => {
    const queuedTime = new Date();
    const matchId = generateMatchId(queuedTime.getTime())
    const matchData = {
      matchId: matchId,
      queuedTimestamp: queuedTime.getTime(),
      startTimestamp: null,
      finishTimestamp: null,
      notes: "",
      maps: selectedMaps,
      resultFiles: [],
      teamGreen: selectedGreenTeam,
      teamBlue: selectedBlueTeam,
      greenWins: [],
      blueWins: [],
      status: 'queued',
    } as MatchMetadata;

    setQueuedMatches(prev => [...prev, matchData]);

    // check if we should start the match immediately (if no other match is running)
    if (!currentlyRunningMatch) {
      setCurrentlyRunningMatch(matchData);
    }
  }, [loadings]);

  /** handles calling electron to begin match/game loops and listeners. */
  const handleStartMatch = React.useCallback((matchData: MatchMetadata) => {
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
  }, []);

  /** used for *intentionally and manually* stopping the running match before completion. */
  const terminateRunningMatch = React.useCallback((matchData: MatchMetadata) => {

  }, []);

  /** handles cleanup/takedown when a match completes for any reason (finished/termination),
   * and checks if we can move on to the next match in the queue.
   */
  const handleMatchEnd = React.useCallback((matchData: MatchMetadata) => {
    // allow these to run in parallel since they arent user-triggered.
    // although this shouldnt ever need to run more than once at a time...
    // since we dont support having multiple matches running at the same time anyway
    toggleLoading("handleMatchEnd", true);
    window.electron.invoke('-', matchData.matchId, matchData)
    .then(res => {
      if (res.success) {
        // add to end of state arr
        setCompletedMatchHistory(prev => [...prev, matchData]);
      } else {
        toastError("Error while handling match end", res.error);
      }
    }).finally(() => {
      toggleLoading("handleMatchEnd", false);
    });
  }, []);

  /**
   * Use solely for updating existing matches in state/files.
   * use queueNewMatch for new ones!
   */
  const updateExistingMatch = React.useCallback((matchData: MatchMetadata) => {
    if (loadings["updateExistingMatch"]) return;

    toggleLoading("updateExistingMatch", true);

    window.electron.invoke('matchHistory:write', matchData.matchId, matchData)
    .then(res => {
      if (res.success) {
        // update state as well
        setCompletedMatchHistory(prev => prev.map(m => m.matchId === matchData.matchId? matchData : m));
      } else {
        toastError("Failed to update match", res.error);
      }
    }).finally(() => {
      toggleLoading("updateExistingMatch", false);
    });
  }, [loadings]);

  // <<< END FETCHERS

  // INITIAL SETUP
  React.useEffect(() => {
    fetchSettings();
    fetchMapList();
    fetchBotList();
    fetchMatchHistoryNextPage();
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
      toastError("Failed to import maps", err);
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
      toastError("Failed to import bots", err);
    });
  }, [toast]);

  // <<< END HANDLERS

  const value = React.useMemo(() => ({
    maps,
    bots,
    matchHistory: completedMatchHistory,
    settings,

    setMaps,
    setBots,
    setSettings,
    setMatchHistory: setCompletedMatchHistory,
    
    fetchMapList,
    fetchBotList,
    fetchSettings,
    fetchMatchHistoryNextPage,

    loadings,
    handleImportMaps,
    handleImportBots,
  }), [
    maps,
    bots,
    completedMatchHistory,
    settings,
    fetchMapList,
    fetchBotList,
    fetchSettings,
    fetchMatchHistoryNextPage,
    loadings,
    handleImportMaps,
    handleImportBots,
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
