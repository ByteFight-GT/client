"use client";

import React from 'react';
import { useToast } from '@/hooks/useToast';
import { useLoadings } from './useLoadings';
import { MatchMetadata } from '../../common/types';
import { useMatches } from './useMatches';
import { generateMatchId } from '../../common/utils';

type QueueNewMatchParams = {
  selectedGreenTeam: string;
  selectedBlueTeam: string;
  selectedMaps: string[];
};

export type UseRunnerValue = {
  currentlyRunningMatch: MatchMetadata | null;
  queuedMatches: MatchMetadata[];
  stdOutChunksRef: React.RefObject<string[]>;
  stdErrChunksRef: React.RefObject<string[]>;
  latestGameDiff: any; // TODO: type
  recentBots: {
    green: string[];
    blue: string[];
  }
  lastRunnerSetup: QueueNewMatchParams | null;
  debugIPCEventLog: string[]; // for debugging - logs the ipc events received from electron
  setLatestGameDiff: React.Dispatch<React.SetStateAction<any>>;
  setDebugIPCEventLog: React.Dispatch<React.SetStateAction<string[]>>;
  queueNewMatch: (params: QueueNewMatchParams) => void;
  dequeueMatch: (index: number) => void;
  moveWithinQueue: (index1: number, index2: number) => void;
  clearAllQueued: () => void;
  startMatch: (matchData: MatchMetadata) => Promise<boolean>;
	startNextInQueue: () => void;
  terminateRunningMatch: (matchData: MatchMetadata) => void;
  handleMatchEnd: (exitCode: number, finishTimestamp: number) => void;
  updateRecentBots: (greenBot: string, blueBot: string) => void;
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

  /** the most recently obtained diff (move/board update) from the engine */
  const [latestGameDiff, setLatestGameDiff] = React.useState<any>(null); // TODO: type

  /** recent bots: stores the last 2 unique bots used */
  const [recentBots, setRecentBots] = React.useState<UseRunnerValue['recentBots']>({
    green: [],
    blue: []
  });

  /** stores the previous bots and maps used */
  const [lastRunnerSetup, setLastRunnerSetup] = React.useState<QueueNewMatchParams | null>(null);

  const [debugIPCEventLog, setDebugIPCEventLog] = React.useState<string[]>([]);

  // >>> HANDLERS

  /** handles calling electron to begin match/game loops and listeners. */
  const startMatch = React.useCallback(async (matchData: MatchMetadata) => {
    if (loadings.startMatch) {
      return false;
    }
    toggleLoading("startMatch", true);

    if (currentlyRunningMatch) {
			console.log(`[startMatch] Attempted to start match ${matchData.matchId} while ${currentlyRunningMatch.matchId} is running.`);
      toastError(
        "Failed to start match", 
        `A match is already running (between ${currentlyRunningMatch.teamGreen} and ${currentlyRunningMatch.teamBlue}). Please wait for it to finish or terminate it before starting a new one.`
      );
      toggleLoading("startMatch", false);
      return false;
    }

    setDebugIPCEventLog(prev => [...prev, `--- starting match ${matchData.matchId} ---`]);

    try {
      const res = await window.electron.invoke('runner:start-match', matchData);
      if (res.success) {

        // yay!!!
        const startedMatchData = {
          ...matchData,
          startTimestamp: res.startTimestamp,
          status: 'in-progress'
        } satisfies MatchMetadata;

        // clear terminal buffers
        stdOutChunksRef.current.length = 0;
        stdErrChunksRef.current.length = 0;

        setCurrentlyRunningMatch(startedMatchData);

				toast({
					title: "Match started",
					description: `\
						Started match between ${matchData.teamGreen} and ${matchData.teamBlue}\
						on ${matchData.maps.length} map(s)!`
				});

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
      greenWins: {},
      blueWins: {},
      status: 'queued',
    } as MatchMetadata;

    if (!currentlyRunningMatch) {
      startMatch(matchData);
    } else {
      // no error, there just happens to be another match running. just add to queue
      setQueuedMatches(prev => [...prev, matchData]);
      toast({
        title: "Match queued",
        description: `Queued ${matchData.teamGreen} v. ${matchData.teamBlue} on ${matchData.maps.length} map(s) at position ${queuedMatches.length + 1}. It will be started automatically if you leave the client open.`
      });
    }
  }, [currentlyRunningMatch, queuedMatches, startMatch]);

  /** Remove a match from queue, for any reason, like cancelling or it getting started */
  const dequeueMatch = React.useCallback((index: number) => {
		console.log(`[dequeueMatch] Dequeuing match at index ${index}`);
    setQueuedMatches(prev => {
      const newQueue = [...prev];
      newQueue.splice(index, 1);
      return newQueue;
    });
  }, []);

	/** 
	 * handles propagating the queue forward when the current match ends.
	 * DOES NOT PERFORM CHECKS (whether queue is nonempty), caller must handle
	 */
	const startNextInQueue = React.useCallback(() => {
		const nextMatch = queuedMatches[0];
		startMatch(nextMatch).then(success => {
			if (success) {
				dequeueMatch(0);
			}
		});
	}, [queuedMatches, startMatch, dequeueMatch]);

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
  const handleMatchEnd = React.useCallback(async (exitCode: number, finishTimestamp: number) => {    
    if (!currentlyRunningMatch) {
      console.warn("[handleMatchEnd] Received match end event but no match was running?");
      return;
    }

    const updatedMatchData = {
      ...currentlyRunningMatch,
      finishTimestamp,
      status: exitCode === 0? 'completed' : 'errored'
    } satisfies MatchMetadata;

    console.log("[handleMatchEnd] handling end of match:", updatedMatchData);
    const writeSuccess = await writeMatchData(updatedMatchData);
    
    if (writeSuccess) {
      addMatchToCompletedHistory(updatedMatchData);

      // cleanup state
      setCurrentlyRunningMatch(null);
      setLatestGameDiff(null);

      toast({
        title: `Match ${exitCode === 0? 'completed' : 'errored'}`,
        description: `Match between ${updatedMatchData.teamGreen} and ${updatedMatchData.teamBlue} finished ${exitCode === 0? 'successfully' : 'with exit code ' + exitCode}!`
      });

      setDebugIPCEventLog(prev => [...prev, `--- match ${updatedMatchData.matchId} ended with code ${exitCode} ---`]);
    
			// cant start next in queue immediately since setCurrentlyRunningMatch wont update immediately BRUH
			// we will use an effect for that
		} else {
      console.log("[handleMatchEnd] failed to write match data!");
      // TODO - enable "try again" action (popup or smth)
    }
  }, [currentlyRunningMatch, writeMatchData, toggleLoading, toastError]);

  const updateRecentBots = React.useCallback((greenBot: string, blueBot: string) => {
    setRecentBots(prev => ({
      green: [greenBot, ...prev.green.filter(bot => bot !== greenBot)].slice(0, 2),
      blue: [blueBot, ...prev.blue.filter(bot => bot !== blueBot)].slice(0, 2)
    }));
  }, []);

  const saveLastRunnerSetup = React.useCallback((setup: QueueNewMatchParams) => {
    setLastRunnerSetup(setup);
  }, []);

	// EFFECTS

	// start next in queue when current match is gone (is null)
	React.useEffect(() => {
		if (!currentlyRunningMatch && queuedMatches.length > 0) {
			startNextInQueue();
		}
	}, [currentlyRunningMatch, queuedMatches, startNextInQueue]);


  const value = React.useMemo(() => ({
    currentlyRunningMatch,
    queuedMatches,
    stdOutChunksRef,
    stdErrChunksRef,
    latestGameDiff,
    recentBots,
    lastRunnerSetup,
    debugIPCEventLog,
    setLatestGameDiff,
    queueNewMatch,
    dequeueMatch,
    moveWithinQueue,
    clearAllQueued,
    startMatch,
		startNextInQueue,
    terminateRunningMatch,
    handleMatchEnd,
    updateRecentBots,
    saveLastRunnerSetup,
    setDebugIPCEventLog,
  } satisfies UseRunnerValue), [
    currentlyRunningMatch,
    queuedMatches,
    latestGameDiff,
    recentBots,
    lastRunnerSetup,
    debugIPCEventLog,
    queueNewMatch,
    dequeueMatch,
    moveWithinQueue,
    clearAllQueued,
    startMatch,
		startNextInQueue,
    terminateRunningMatch,
    handleMatchEnd,
    updateRecentBots,
    saveLastRunnerSetup,
    setDebugIPCEventLog,
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
