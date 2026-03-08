"use client";

import React from 'react';
import { useToast } from '@/hooks/useToast';
import { useLoadings } from './useLoadings';
import { GameResult, MatchMetadata, Team_t } from '../../common/types';
import { useMatches } from './useMatches';
import { generateMatchId, word } from '../../common/utils';
import { useVisualizer } from '@/gamerenderer/useVisualizer';

// TODO - clean this up somehow 
import _EMPTY_GAME_PGN from '@/gamerenderer/defaults/EMPTY_GAME_PGN.json'
const EMPTY_GAME_PGN = _EMPTY_GAME_PGN as GamePGN;
import { GamePGN } from '../../common/types';
import { Button } from '@/components';

type QueueNewMatchParams = {
  selectedGreenTeam: string;
  selectedBlueTeam: string;
  selectedMaps: string[];
};

export type UseRunnerValue = {
  currentlyRunningMatch: MatchMetadata | null;
  queuedMatches: MatchMetadata[];
  stdOutChunksRef: React.RefObject<string[]>;
  TEMP_gameDataPacketsReceived: number; // TEMP for causing game info and game nav to rerender on new game data
  recentBots: {
    green: string[];
    blue: string[];
  }
  lastRunnerSetup: QueueNewMatchParams | null;
  debugIPCEventLog: string[]; // for debugging - logs the ipc events received from electron
  setTEMP_gameDataPacketsReceived: React.Dispatch<React.SetStateAction<number>>;
  setDebugIPCEventLog: React.Dispatch<React.SetStateAction<string[]>>;
  queueNewMatch: (params: QueueNewMatchParams) => void;
  dequeueMatch: (index: number) => void;
  moveWithinQueue: (index1: number, index2: number) => void;
  clearAllQueued: () => void;
  startMatch: (matchData: MatchMetadata) => Promise<boolean>;
	startNextInQueue: () => void;
  terminateRunningMatch: () => void;
  handleMatchEnd: (data: {
    exitCode: number, 
    finishTimestamp: number, 
    result: GameResult,
    outputDir: string
  }) => void;
  updateRecentBots: (greenBot: string, blueBot: string) => void;
  saveLastRunnerSetup: (setup: QueueNewMatchParams) => void;
  loadGameIntoPlayer: (matchData: MatchMetadata, mapName: string) => Promise<boolean>;
};

const RunnerContext = React.createContext<UseRunnerValue | undefined>(undefined);

/**
 * Handles logic relating to running games and communicating with the python process thru electron
 */
export const RunnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {toast, toastError} = useToast();
  const {loadings, toggleLoading} = useLoadings();
  const {addMatchToCompletedHistory} = useMatches();
  const {setVisualizerState, setAutoAdvance} = useVisualizer();

  const [currentlyRunningMatch, setCurrentlyRunningMatch] = React.useState<MatchMetadata | null>(null);

  /** 
   * queued matches. These will NOT be saved when the app is closed. 
   * FRONT OF QUEUE IS AT INDEX 0!!
   */
  const [queuedMatches, setQueuedMatches] = React.useState<MatchMetadata[]>([]);

  const stdOutChunksRef = React.useRef<string[]>([]);

  // maybe TEMP: used for causing things like game info and game nav to rerender upon new game data
  const [TEMP_gameDataPacketsReceived, setTEMP_gameDataPacketsReceived] = React.useState(0);

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

    //setDebugIPCEventLog(prev => [...prev, `--- starting match ${matchData.matchId} ---`]);

    try {
      const res = await window.electron.invoke('runner:start-match', matchData);
      if (res.success) {

        // yay!!!
        const startedMatchData = {
          ...matchData,
          startTimestamp: res.startTimestamp,
          status: 'in-progress'
        } satisfies MatchMetadata;
              
        stdOutChunksRef.current.length = 0; // clear terminal buffers
        setCurrentlyRunningMatch(startedMatchData);
        setVisualizerState(startedMatchData, EMPTY_GAME_PGN, res.TEMP_mapData0);
        setAutoAdvance(false); // TEMP: we want autoadvance during games, but useGame currently handles it differently SPECIFICALLY for live games 
        setTEMP_gameDataPacketsReceived(0);

        toast({
					toastTitle: "Match started",
					toastDescription: (
            <p>
              Started <span className='text-[hsl(var(--team-green-color))]'>{matchData.teamGreen}</span>
              {' '}vs.{' '}
              <span className='text-[hsl(var(--team-blue-color))]'>{matchData.teamBlue}</span>
              {' '}on{' '}
              <span className='text-foreground'>
                {startedMatchData.maps.join(', ')}
              </span>!
            </p>
          )
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
      outputDir: null,
      teamGreen: params.selectedGreenTeam,
      teamBlue: params.selectedBlueTeam,
      greenWins: {},
      blueWins: {},
      draws: {},
      status: 'queued',
    } as MatchMetadata;

    if (!currentlyRunningMatch) {
      startMatch(matchData);
    } else {
      // no error, there just happens to be another match running. just add to queue
      setQueuedMatches(prev => [...prev, matchData]);
      toast({
        toastTitle: "Match queued",
        toastDescription: (
          <p>
            Queued <span className='text-[hsl(var(--team-green-color))]'>{matchData.teamGreen}</span>
            {' '}vs.{' '}
            <span className='text-[hsl(var(--team-blue-color))]'>{matchData.teamBlue}</span>
            {' '}on{' '}
            <span className='text-foreground'>
              {matchData.maps.join(', ')}
            </span>!
            <br />
            Queue Position: <span className='text-primary'>{queuedMatches.length + 1}</span>
          </p>
        )
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
    .catch((err: any) => {
      toastError("Failed to stop match", err);
    })
    .finally(() => {
      toggleLoading("terminateMatch", false);
    });
  }, [currentlyRunningMatch, loadings.terminateMatch]);

  /** handles cleanup/takedown when a match completes for any reason (finished/termination),
   * and checks if we can move on to the next match in the queue.
   */
  const handleMatchEnd = React.useCallback(async (data: {
    exitCode: number, 
    finishTimestamp: number,
    result: GameResult,
    outputDir: string
  }) => {
    console.log(`[handleMatchEnd] handling end of match ${currentlyRunningMatch?.matchId}, data=`, data);
    if (!currentlyRunningMatch) {
      console.warn("[handleMatchEnd] Received match end event but no match was running?");
      return;
    }

    const updatedMatchData = {
      ...currentlyRunningMatch,
      finishTimestamp: data.finishTimestamp,
      outputDir: data.outputDir,
      status: data.exitCode === 0? 'completed' : 'errored'
    } satisfies MatchMetadata;

    // TEMP - apply results
    if (data.result.winner === 'green') {
      updatedMatchData.greenWins[updatedMatchData.maps[0]] = {
        reason: data.result.reason || "unknown",
        numRounds: data.result.numRounds || 0
      }
    } else if (data.result.winner === 'blue') {
      updatedMatchData.blueWins[updatedMatchData.maps[0]] = {
        reason: data.result.reason || "unknown",
        numRounds: data.result.numRounds || 0
      }
    } else if (data.result.winner === 'draw') {
      updatedMatchData.draws[updatedMatchData.maps[0]] = {
        reason: data.result.reason || "unknown",
        numRounds: data.result.numRounds || 0
      }
    }

    let matchWriteRes;
    try {
      matchWriteRes = await window.electron.invoke('matches:write', updatedMatchData);
    } catch (error) {
      matchWriteRes = {success: false, error};
    }

    // TEMP - only need to write logs for first map rn since we only have 1 game per
    const compiledLogs = stdOutChunksRef.current.join('');
    let logWriteRes;
    try {
      logWriteRes = await window.electron.invoke('logs:write', updatedMatchData.matchId, updatedMatchData.maps[0], compiledLogs);
    } catch (error) {
      logWriteRes = {success: false, error};
    }

    if (matchWriteRes.success) {
      addMatchToCompletedHistory(updatedMatchData);     
      toast({
        toastTitle: `Match finished!`,
        toastDescription: `Match between ${updatedMatchData.teamGreen} and ${updatedMatchData.teamBlue} finished ${data.exitCode === 0? 'successfully' : 'with exit code ' + data.exitCode}!`
      });
		} else {
      toastError(
        "Failed to save match data",
        <p>
          An error occured while saving match to storage. Please report this!
          <Button onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(updatedMatchData, null, 2))
            .then(() => {
              toast({
                toastTitle: "Match data copied",
                toastDescription: "Match data copied to clipboard. Please share this with the developers to help debug this issue. Thanks!"
              });
            })
            .catch((err) => {
              toastError("Failed to copy match data!", err);
            });
          }}>Copy match data</Button>
        </p>
      )
    }

    if (!logWriteRes.success) {
      toastError(
        "Failed to save match logs",
        <p>
          An error occured while saving match logs to storage. Please report this!
          <Button onClick={() => {
            navigator.clipboard.writeText(compiledLogs)
            .then(() => {
              toast({
                toastTitle: "Match logs copied",
                toastDescription: "Logs copied to clipboard. Please share this with the developers to help debug this issue. Thanks!"
              });
            }).catch((err) => {
              toastError("Failed to copy match logs!", err);
            });
          }}>Copy logs</Button>
        </p>
      )
    }

    setAutoAdvance(false);
    setCurrentlyRunningMatch(null);

  }, [currentlyRunningMatch, toggleLoading, toastError]);

  const updateRecentBots = React.useCallback((greenBot: string, blueBot: string) => {
    setRecentBots(prev => ({
      green: [greenBot, ...prev.green.filter(bot => bot !== greenBot)].slice(0, 2),
      blue: [blueBot, ...prev.blue.filter(bot => bot !== blueBot)].slice(0, 2)
    }));
  }, []);

  const saveLastRunnerSetup = React.useCallback((setup: QueueNewMatchParams) => {
    setLastRunnerSetup(setup);
  }, []);

  const loadGameIntoPlayer = React.useCallback(async (matchData: MatchMetadata, mapName: string) => {
    if (loadings.loadGameIntoPlayer) return false;
    toggleLoading("loadGameIntoPlayer", true);

    try {
      const res = await window.electron.invoke('matches:readgame', matchData, mapName);
      if (res.success) {
        const {mapData, gameData} = res;
        setVisualizerState(matchData, gameData, mapData);
        return true;
      } else {
        toastError("Failed to load game replay", res.error);
        return false;
      }
    } catch (err: any) {
      toastError("Failed to load game replay", err);
      return false;
    } finally {
      toggleLoading("loadGameIntoPlayer", false);
    }
  }, [toastError]);


	// EFFECTS

	// start next in queue when current match is gone (is null)
	React.useEffect(() => {
		if (!currentlyRunningMatch && queuedMatches.length > 0) {
			startNextInQueue();
		}
	}, [currentlyRunningMatch, queuedMatches, startNextInQueue]);

  // on init, check electron to see if theres anythign running
  // this fixes things breaking if they somehow refresh the frontend lol
  React.useEffect(() => {
    window.electron.invoke('runner:getcurrent')
    .then((res) => {
      if (res) {
        const matchData = res.matchData as MatchMetadata;
        setCurrentlyRunningMatch(matchData);
        // TODO - see runner.ts: need some way to get full pgn. altho this is an edge case so low prio
        setVisualizerState(matchData, EMPTY_GAME_PGN, res.TEMP_mapData0);
      }
    })
    .catch((err) => {
      console.error("Failed to get current match data from electron on init", err);
    });
  }, [setVisualizerState, setAutoAdvance]);


  const value = React.useMemo(() => ({
    currentlyRunningMatch,
    queuedMatches,
    stdOutChunksRef,
    TEMP_gameDataPacketsReceived,
    recentBots,
    lastRunnerSetup,
    debugIPCEventLog,
    setTEMP_gameDataPacketsReceived,
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
    loadGameIntoPlayer,
  } satisfies UseRunnerValue), [
    currentlyRunningMatch,
    queuedMatches,
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
    loadGameIntoPlayer,
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
