"use client";

import React from 'react';

import { useToast } from '@/hooks/useToast';
import { useRunner } from '@/hooks/useRunner';

import { useGame } from '@/gamerenderer/useGame';
import { GameResult, Team_t } from '../../common/types';

/**
 * Handles state/logic for ipc communication with electron.
 * Mostly correlated with useRunner, just moved it here cuz we need refs and stuff that gets messy
 */
export function useIPC() {
  const {toastError} = useToast();

  const {
    currentlyRunningMatch, 
    stdOutChunksRef,
    setDebugIPCEventLog, 
    setTEMP_gameDataPacketsReceived,
    handleMatchEnd,
  } = useRunner();

  const {updateGamePGN} = useGame();

  // REFS
  // only for the unstable stuff from useRunner so we dont need to reregister all the time

  const currentlyRunningMatchRef = React.useRef(currentlyRunningMatch);
  React.useEffect(() => {currentlyRunningMatchRef.current = currentlyRunningMatch}, [currentlyRunningMatch]);

  const handleMatchEndRef = React.useRef(handleMatchEnd);
  React.useEffect(() => {handleMatchEndRef.current = handleMatchEnd}, [handleMatchEnd]);

  // HANDLERS

  const ipcConnectionHandlers = React.useMemo(() => ({

    /** mostly user-generated, like print statements */
    'game-usr:stdout': 
    function handleStdOut(chunk: string) {
      //setDebugIPCEventLog(prev => [...prev, 'game-usr:stdout']);
      stdOutChunksRef.current.push(chunk);
    },

    /** game data from the runner, like moves and events */
    'game-sys:data': 
    function handleSystemData(data: any) {
      //setDebugIPCEventLog(prev => [...prev, 'game-sys:data']);
      setTEMP_gameDataPacketsReceived(prev => prev + 1);

      switch (data.type) {

        // TODO - clean up this mess on the engine

        case 'init_game': {
          //updateGamePGN(data.data);
        } break;

        case 'update': {
          updateGamePGN(data);
          setTEMP_gameDataPacketsReceived(prev => prev + 1);
        } break;

        case 'game_complete': {
          // TODO
          // idt we actually need much here IN THE CURRENT (MESSY) SYSTEM.
          // since handleMatchEnd can handle most of what we need for now.
        }
      }
    },

    'game-sys:process-error':
    function handleProcessError(err: any) {
      //setDebugIPCEventLog(prev => [...prev, 'game-sys:process-error']);
      toastError("Python process error", err);
    },

    /** process closed for whatever reason - consider the current game as "ended" */
    'game-sys:process-closed':
    function handleProcessClosed(data: {
      exitCode: number, 
      finishTimestamp: number, 
      result: GameResult, 
      outputDir: string
    }) {
      //setDebugIPCEventLog(prev => [...prev, 'game-sys:process-closed']);
      handleMatchEndRef.current(data);
    },

    'game-sys:socket-error':
    function handleSocketError(err: any) {
      //setDebugIPCEventLog(prev => [...prev, 'game-sys:socket-error']);
    },

    /** socket closed on server side (most likely python exiting) */
    'game-sys:socket-close':
    function handleSocketClose() {
      //setDebugIPCEventLog(prev => [...prev, 'game-sys:socket-close']);
    },

    /** socket fully closed */
    'game-sys:socket-end':
    function handleSocketEnd() {
      //setDebugIPCEventLog(prev => [...prev, 'game-sys:socket-end']);
    }

  }), []);

  // >>> INITIAL SETUP

  React.useEffect(() => {
    // register all handlers
    console.log("[useIPC] >>> registering ipc handlers");
    const cleanupFns = Object.entries(ipcConnectionHandlers).map(
      ([channel, handler]) => 
      window.electron.registerTcpListener(channel, handler)
    );
    
    // unregisterereer
    return () => {
      console.log("[useIPC] <<< unregistering ipc handlers");
      cleanupFns.forEach(cleanup => cleanup());
    };
  }, []);
}
