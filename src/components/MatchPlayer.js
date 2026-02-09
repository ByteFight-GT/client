"use client";
import { useEffect } from 'react'
import Game from './Game'
import Navigation from './Navigation';
import LocalSelector from './LocalSelector';
import MapSelector from './MapSelector';
import { useState } from 'react';
import { getMap, processData } from "../replay/process_replay"
import GameOutputs from './GameOutputs';
import PlayerStats from './PlayerStats';
import { Button } from '@/components';
import { Bot } from 'lucide-react';

import path from 'path';

function MatchPlayer() {
  const [currentMatchStateIndex, setCurrentMatchStateIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(50);
  const [matchStates, setMatchStates] = useState(null);
  const [bot1File, setBot1File] = useState(null);
  const [bot2File, setBot2File] = useState(null);
  const [shouldPlayMatch, setShouldPlayMatch] = useState(false);
  const [engineOutput, setEngineOutput] = useState(null);
  const [map, setMap] = useState(null);
  const [matchInfo, setMatchInfo] = useState(null)
  const [isMatchRunning, setIsMatchRunning] = useState(false);

  const botCount = (bot1File && bot2File ? 2 : bot1File || bot2File ? 1 : 0);
  const canStart = bot1File && bot2File && map;

  const handleBack = () => {
    setCurrentMatchStateIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  const handleForward = () => {
    setCurrentMatchStateIndex((prevIndex) => Math.min(prevIndex + 1, matchStates.length - 1));
  };

  const handleInputChange = (value) => {
    if (!isNaN(value[0]) && value[0] >= 0 && value[0] < matchStates.length) {
      setCurrentMatchStateIndex(value[0]);
    } else {
      setCurrentMatchStateIndex(0);
    }
  };

  const handleSetMap = (value) => {
    setMap(value)
    console.log(value)

    // let match_states = new Array(1).fill(null);
    // match_states[0] = getMap(value)
    // setMatchStates(match_states);
    // setCurrentMatchStateIndex(0);
    setMatchInfo(null)

  }

  const togglePlay = () => {
    setIsPlaying((prevIsPlaying) => !prevIsPlaying);
  };

  const handleSpeedChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      setPlaySpeed(value);
    }
  };

  const handleBattleStart = () => {
  if (isMatchRunning) {
    // Stop the match
    window.electron.sendTCPInterrupt();
  } else {
    // Start the match
    setBot1File(bot1File);
    setBot2File(bot2File);
    setShouldPlayMatch(true);
    setIsMatchRunning(true);
  }
}

  const handleStdOutData = (chunk) => {
    console.log("stdout");
    console.log(chunk);
  }

  const handleStdOutDataFull = (fullOutput) => {
    console.log("stdoutfull");
    console.log(fullOutput);
  }

  const handleErrOutData = (chunk) => {
    console.log("errout");
    console.log(chunk);
  }

  const handleErrOutDataFull = (fullOutput) => {
    console.log("erroutfull");
    console.log(fullOutput);
  }

  const handleTcpData = (data) => {
    console.log("tcpdata");
    console.log(data);
  }

  const handleTcpMessage = (json) => {
    console.log("tcpmessage");
    console.log(json);
  }

  const handleTcpStatus = (status) => {
    console.log("tcpstatus");
    console.log(status);
  }


  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentMatchStateIndex((prevIndex) => {
          if (matchStates && prevIndex < matchStates.length - 1) {
            return prevIndex + 1;
          }
          setIsPlaying(false);
          return prevIndex;
        });
      }, playSpeed);
    } else if (!isPlaying && interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const runMatch = async () => {
      if (!shouldPlayMatch || !canStart) {
        return;
      }
      setEngineOutput("Playing match...");
      try {
        let num = await window.electron.storeGet("numMatches")
        let outdir = await window.electron.storeGet("matchDir")
        handleSetMap(map)
        setIsPlaying(false);
        console.log("Running match with ", bot1File, bot2File, map, 1);

        const resultFilePath = path.join(outdir, `${num}.json`);
        const scriptArgs = [
          '--a_dir', `"${bot1File}"`,
          '--b_dir', `"${bot2File}"`,
          '--map_string', `"${map}"`,
          '--output_dir', `"${resultFilePath}"`
        ];


        // register handlers
        // Register handlers and get cleanup functions
        const cleanupTcpData = window.electron.onTcpData(handleTcpData);
        const cleanupTcpJson = window.electron.onTcpJson(handleTcpMessage);
        const cleanupTcpStatus = window.electron.onTcpStatus(handleTcpStatus);
        const cleanupOutput = window.electron.onStreamOutput(handleStdOutData);
        const cleanupOutputFull = window.electron.onStreamOutputFull(handleStdOutDataFull);
        const cleanupError = window.electron.onStreamError(handleErrOutData);
        const cleanupErrorFull = window.electron.onStreamErrorFull(handleErrOutDataFull);

        try {
          setEngineOutput(await window.electron.runPythonScript(scriptArgs));
          setIsMatchRunning(false);

        } finally {
          setIsMatchRunning(false);
          cleanupTcpData();
          cleanupTcpJson();
          cleanupTcpStatus();
          cleanupOutput();
          cleanupOutputFull();
          cleanupError();
          cleanupErrorFull();
        }

        try {
          const resultFileContent = await window.electron.readFile(resultFilePath);
          const matchLog = JSON.parse(resultFileContent);
          await window.electron.importMatch(resultFilePath, num);
          await window.electron.storeSet("numMatches", (num + 1) % 1000000)

          const m = await processData(matchLog);
          setMatchStates(m.match_states);
          setMatchInfo([m.bid_a, m.bid_b, m.win_reason, m.result])

          setIsPlaying(false)
          setCurrentMatchStateIndex(0);
          setCurrentMatchStateIndex(0);
        } catch {
          console.error("match not found")
        }

      }
      catch (error) {
        console.error("Error running match ", error);
      }
      setShouldPlayMatch(false);
    };
    runMatch();
  }, [shouldPlayMatch]);

  return (
    <div className="flex-grow flex flex-col items-center justify-center bg-zinc-900 relative gap-2 p-4 w-full">
      <div className='flex flex-col lg:flex-row items-center lg:items-stretch gap-8 w-full justify-center'>
        <div className='flex flex-col gap-4 items-center'>
          <LocalSelector bot1File={bot1File} bot2File={bot2File} setBot1File={setBot1File} setBot2File={setBot2File} />
          <div className="flex flex-col justify-center items-center text-center w-full gap-4 mt-4 mb-4 lg:mb-0">
            <div className="flex p-2 rounded-md bg-zinc-800 w-full text-sm justify-center items-center text-zinc-300">
              Turn #:<span className="text-zinc-50 font-bold ml-1">{currentMatchStateIndex}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="w-full flex gap-3 items-stretch">
            <div className={`${botCount == 2 ? "border border-green-700" : ""} bg-zinc-800 flex-grow rounded-lg flex items-center justify-center gap-2`}>
              <Bot size={24} />
              <p className="text-sm text-zinc-300">
                <span className="font-bold text-white">{botCount}/2</span> Robots Selected
              </p>
            </div>
            <MapSelector onSelectMap={handleSetMap} />
            <Button
            className={`px-4 py-2 rounded text-sm text-white
              ${isMatchRunning
                ? 'bg-red-500 hover:bg-red-600'
                : (bot1File && bot2File && map != null)
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-zinc-600 cursor-not-allowed'}`}
            disabled={!canStart && !isMatchRunning}
            onClick={handleBattleStart}
          >
            {isMatchRunning ? 'Stop Match' : 'Start Battle'}
          </Button>
          </div>
          <Game
            currentMatchStateIndex={currentMatchStateIndex}
            setCurrentMatchStateIndex={setCurrentMatchStateIndex}
            matchStates={matchStates}
          />
          <Navigation
            onBack={handleBack}
            onForward={handleForward}
            onInputChange={handleInputChange}
            togglePlay={togglePlay}
            inputValue={currentMatchStateIndex}
            isPlaying={isPlaying}
            onSpeedChange={handleSpeedChange}
            matchStates={matchStates}
          />
        </div>


        <div className="flex flex-col gap-4 items-stretch max-w-lg w-full">
          <GameOutputs engineOutput={engineOutput} />
          <PlayerStats currentMatchStateIndex={currentMatchStateIndex} matchStates={matchStates} matchInfo={matchInfo}></PlayerStats>
        </div>
      </div>
    </div>
  );
}
export default MatchPlayer