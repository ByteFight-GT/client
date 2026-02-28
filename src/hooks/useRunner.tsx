"use client";

import React from 'react';
import { useToast } from '@/hooks/useToast';
import { useLoadings } from './loadingsContext';
import { MatchMetadata } from '../../common/types';
import { useMatches } from './useMatches';
import { generateMatchId } from '../../common/utils';

const LOCALSTORAGE_RECENT_GREEN_BOTS_KEY = "__bytefight__recentGreenBots";
const LOCALSTORAGE_RECENT_BLUE_BOTS_KEY = "__bytefight__recentBlueBots";
const LOCALSTORAGE_LAST_RUNNER_SETUP_KEY = "__bytefight__lastRunnerSetup";

type QueueNewMatchParams = {
  selectedGreenTeam: string;
  selectedBlueTeam: string;
  selectedMaps: string[];
};

export type UseRunnerValue = {
  currentlyRunningMatch: MatchMetadata | null;
  queuedMatches: MatchMetadata[];
  stdOutChunksBuffered: string[];
  stdErrChunksBuffered: string[];
  currentGameState: any; // TODO: type
  latestGameDiff: any; // TODO: type
  queueNewMatch: (params: QueueNewMatchParams) => void;
  dequeueMatch: (index: number) => void;
  moveWithinQueue: (index1: number, index2: number) => void;
  clearAllQueued: () => void;
  startMatch: (matchData: MatchMetadata) => Promise<boolean>;
  terminateRunningMatch: (matchData: MatchMetadata) => void;
  handleMatchEnd: (matchData: MatchMetadata) => void;
  recentGreenBots: string[];
  recentBlueBots: string[];
  updateRecentBots: (greenBot: string, blueBot: string) => void;
  lastRunnerSetup: QueueNewMatchParams | null;
  saveLastRunnerSetup: (setup: QueueNewMatchParams) => void;
};

const RunnerContext = React.createContext<UseRunnerValue | undefined>(undefined);

/**
 * Handles logic relating to running games and communicating with the python process thru electron
 */
export const RunnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {toast, toastError} = useToast();
  const {loadings, toggleLoading} = useLoadings();
  const {writeMatchData, addMatchToCompletedHistory} = useMatches();
 
  const [currentlyRunningMatch, setCurrentlyRunningMatch] = React.useState<MatchMetadata | null>(null);

  /** 
   * queued matches. These will NOT be saved when the app is closed. 
   * FRONT OF QUEUE IS AT INDEX 0!!
   */
  const [queuedMatches, setQueuedMatches] = React.useState<MatchMetadata[]>([]);

  const stdOutChunksRef = React.useRef<string[]>([]);
  const stdErrChunksRef = React.useRef<string[]>([]);
  
  // these are only updated once in a while
  const [stdOutChunksBuffered, setStdOutChunksBuffered] = React.useState<string[]>([]);
  const [stdErrChunksBuffered, setStdErrChunksBuffered] = React.useState<string[]>([]);

  /** The current full state of the current game being played */
  const [currentGameState, setGameState] = React.useState<any>(null); // TODO: type

  /** the most recently obtained diff (move/board update) from the engine */
  const [latestGameDiff, setLatestGameDiff] = React.useState<any>(null); // TODO: type

  /** recent bots: stores the last 2 unique bots used */
  const [recentGreenBots, setRecentGreenBots] = React.useState<string[]>([]);
  const [recentBlueBots, setRecentBlueBots] = React.useState<string[]>([]);

  /** stores the previous bots and maps used */
  const [lastRunnerSetup, setLastRunnerSetup] = React.useState<QueueNewMatchParams | null>(null);

  // >>> HANDLERS

  /** mapping of { eventnames -> handlers } for ipc connection w/ python */
  const ipcConnectionHandlers = React.useMemo(() => ({

    /** mostly user-generated, like print statements */
    'game-usr:stdout': 
    function handleStdOut(chunk: string) {
      stdOutChunksRef.current.push(chunk);
    },

    /** in a perfect world, also user-only data */
    'game-usr:stderr': 
    function handleStdErr(chunk: string) {
      stdErrChunksRef.current.push(chunk);
    },

    /** game data from the runner, like moves and events */
    'game-sys:data': 
    function handleSystemData(data: any) {
      setLatestGameDiff(data);
      // TODO - update game state
    },

    /** errors from the runner, like crashes and stuff. just tell user */
    'game-sys:error':
    function handleSystemError(err: any) {
      toastError("Error while running game", err);
    },

    /** process closed for whatever reason - consider the current game as "ended" */
    'game-sys:process-closed':
    function handleProcessClosed(res: {code: number, finishTimestamp: number}) {
      if (currentlyRunningMatch) {
        const endedMatchData = {
          ...currentlyRunningMatch,
          finishTimestamp: res.finishTimestamp,

          // TODO - have python send us a message for what status to use
          // it should be able to tell us if success, termination, or errored
          // if no status, we can assume crash/unintended failure (check status code)
          // exit code nonzero = error, no code probably means killed?
          status: res.code === 0? 'completed' : 'errored'
        } satisfies MatchMetadata;

        handleMatchEnd(endedMatchData);
      } else {
        console.warn("Received process closed event but no match was running??");
      }
    }

  }), []);

  const refreshStdioBuffers = React.useCallback(() => {
    setStdOutChunksBuffered([...stdOutChunksRef.current]);
    setStdErrChunksBuffered([...stdErrChunksRef.current]);
  }, []);

  /** handles calling electron to begin match/game loops and listeners. */
  const startMatch = React.useCallback(async (matchData: MatchMetadata) => {
    if (loadings.startMatch) return false;
    toggleLoading("startMatch", true);

    if (currentlyRunningMatch) {
      toastError(
        "Failed to start match", 
        `A match is already running (between ${currentlyRunningMatch.teamGreen} and ${currentlyRunningMatch.teamBlue}). Please wait for it to finish or terminate it before starting a new one.`
      );
      toggleLoading("startMatch", false);
      return false;
    }

    try {
      const res = await window.electron.invoke('runner:start-match', matchData);
      if (res.success) {

        // yay!!!
        const startedMatchData = {
          ...matchData,
          startTimestamp: res.startTimestamp,
          status: 'in-progress'
        } satisfies MatchMetadata;

        setCurrentlyRunningMatch(startedMatchData);
        return true;

      } else {
        toastError("Failed to start match", res.error);
      }
    } catch (err: any) {
      toastError("Failed to start match", err);
    } finally {
      toggleLoading("startMatch", false);
    }

    return false;
  }, [currentlyRunningMatch, loadings.startMatch]);

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

    if (!currentlyRunningMatch) {
      startMatch(matchData).then(success => {
        if (success) {
          toast({
            title: "Match started",
            description: `Started match between ${matchData.teamGreen} and ${matchData.teamBlue} on ${matchData.maps.length} map(s)!`
          });
        } // else: startMatch will handle error
      });
    } else {
      // no error, there just happens to be another match running. just add to queue
      setQueuedMatches(prev => [...prev, matchData]);
      toast({
        title: "Match queued",
        description: `Queued ${matchData.teamGreen} v. ${matchData.teamBlue} on ${matchData.maps.length} map(s) at position ${queuedMatches.length + 1}. It will be started automatically if you leave the client open.`
      })
    }
  }, [currentlyRunningMatch, queuedMatches, startMatch]);

  /** Remove a match from queue, for any reason, like cancelling or it getting started */
  const dequeueMatch = React.useCallback((index: number) => {
    setQueuedMatches(prev => {
      const newQueue = [...prev];
      newQueue.splice(index, 1);
      return newQueue;
    });
  }, []);

  /** inserts the match at `srcIdx` -> `dstIdx`, shifting matches backward */
  const moveWithinQueue = React.useCallback((srcIdx: number, dstIdx: number) => {
    setQueuedMatches(prev => {
      const newQueue = [...prev];
      const temp = newQueue[srcIdx];
      newQueue.splice(srcIdx, 1);
      newQueue.splice(dstIdx, 0, temp);
      return newQueue;
    });
  }, []);

  const clearAllQueued = React.useCallback(() => {
    setQueuedMatches([]);
  }, []);

  /** used for *intentionally and manually* stopping the running match before completion. */
  const terminateRunningMatch = React.useCallback(() => {
    if (loadings.terminateMatch) return;
    if (!currentlyRunningMatch) {
      toastError("No match running", "No request was sent - no match to terminate");
      return;
    }
    toggleLoading("terminateMatch", true);

    window.electron.invoke('runner:terminate')
    .then(res => {
      if (!res.success) {
        toastError("No stop command sent", "No match is currently running");
      }
      toast({
        title: "Stopping match...",
        description: "Sent command for the python process to gracefully shutdown. Please wait..."
      });
    })
    .catch((err: any) => {
      toastError("Failed to stop match", err);
    })
    .finally(() => {
      toggleLoading("terminateMatch", false);
    });
  }, []);

  /** handles cleanup/takedown when a match completes for any reason (finished/termination),
   * and checks if we can move on to the next match in the queue.
   */
  const handleMatchEnd = React.useCallback(async (matchData: MatchMetadata) => {
    // allow these to run in parallel since they arent user-triggered.
    // although this shouldnt ever need to run more than once at a time...
    // since we dont support having multiple matches running at the same time anyway
    
    const writeSuccess = await writeMatchData(matchData);
    
    if (writeSuccess) {
      addMatchToCompletedHistory(matchData);

      // cleanup state
      setCurrentlyRunningMatch(null);
      setGameState(null);
      setLatestGameDiff(null);
      stdOutChunksRef.current = [];
      stdErrChunksRef.current = [];
      refreshStdioBuffers();
    } else {
      // TODO - enable "try again" action (popup or smth)
    }
  }, [toggleLoading, toastError]);

  const updateRecentBots = React.useCallback((greenBot: string, blueBot: string) => {
    setRecentGreenBots(prev => [greenBot, ...prev.filter(bot => bot !== greenBot)].slice(0, 2));
    setRecentBlueBots(prev => [blueBot, ...prev.filter(bot => bot !== blueBot)].slice(0, 2));
  }, []);

  const saveLastRunnerSetup = React.useCallback((setup: QueueNewMatchParams) => {
    setLastRunnerSetup(setup);
  }, []);

  // >>> INITIAL SETUP

  React.useEffect(() => {
    // register all handlers
    const cleanupFns = Object.entries(ipcConnectionHandlers).map(
      ([channel, handler]) => 
      window.electron.registerTcpListener(channel, handler)
    );
    
    return () => {
      cleanupFns.forEach(cleanup => cleanup());
    };
  }, []);

  const value = React.useMemo(() => ({
    currentlyRunningMatch,
    queuedMatches,
    stdOutChunksBuffered,
    stdErrChunksBuffered,
    currentGameState,
    latestGameDiff,
    queueNewMatch,
    dequeueMatch,
    moveWithinQueue,
    clearAllQueued,
    startMatch,
    terminateRunningMatch,
    handleMatchEnd,
    recentGreenBots,
    recentBlueBots,
    updateRecentBots,
    lastRunnerSetup,
    saveLastRunnerSetup,
  } satisfies UseRunnerValue), [
    currentlyRunningMatch,
    queuedMatches,
    stdOutChunksBuffered,
    stdErrChunksBuffered,
    currentGameState,
    latestGameDiff,
    queueNewMatch,
    dequeueMatch,
    moveWithinQueue,
    clearAllQueued,
    startMatch,
    terminateRunningMatch,
    handleMatchEnd,
    recentGreenBots,
    recentBlueBots,
    updateRecentBots,
    lastRunnerSetup,
    saveLastRunnerSetup,
  ]);

  return (
    <RunnerContext.Provider value={value}>
      {children}
    </RunnerContext.Provider>
  );
};

export function useRunner(): UseRunnerValue {
  const context = React.useContext(RunnerContext);
  if (context === undefined) {
    throw new Error('useRunner must be used within a RunnerProvider');
  }
  return context;
}
