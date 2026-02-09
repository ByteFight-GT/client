import { useEffect } from 'react'
import Game from './Game'
import Navigation from './Navigation';

import { useState } from 'react';
import { processData } from "../replay/process_replay"


import MatchSelector from './MatchSelector'
import PlayerStats from './PlayerStats'
import { Button } from '@/components';
import { useToast } from '@/hooks/use-toast'


function Replayer() {
  const [currentMatchStateIndex, setCurrentMatchStateIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(200);
  const [matchStates, setMatchStates] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [updateOptions, setUpdateOptions] = useState(true);
  const [matchInfo, setMatchInfo] = useState(null)

  const { toast } = useToast();

  const clearAllUseStates = () => {
    setCurrentMatchStateIndex(0);
    setIsPlaying(false);
    setMatchStates(null);
    setMatchId(null);
    setMatches([]);
    setUpdateOptions(false);
  }


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

  const togglePlay = () => {
    setIsPlaying((prevIsPlaying) => !prevIsPlaying);
  };

  const handleSpeedChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      setPlaySpeed(value);
    }
  };

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentMatchStateIndex((prevIndex) => {
          if (matchStates && prevIndex < matchStates.length - 1) {
            return prevIndex + 1;
          }
          setIsPlaying(false)
          return prevIndex;
        });
      }, playSpeed);
    } else if (!isPlaying) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playSpeed]);


  useEffect(() => {

    const fetchMatch = async () => {
      if (matchId != null && matchId.substring(0, matchId.length - 5) >= 0) {
        const matchFile = await window.electron.readMatch(matchId);
        const matchLog = JSON.parse(matchFile);
        const m = await processData(matchLog);
        setMatchStates(m.match_states);

        setMatchInfo([m.bid_a, m.bid_b, m.win_reason, m.result])

        setIsPlaying(false)
        setCurrentMatchStateIndex(0);

      } else {
        clearAllUseStates()
      }
    }
    fetchMatch()


  }, [matchId]);

  const handleDeleteMatch = async () => {
    const updatedMatches = matches.filter(m => m !== matchId.substring(0, matchId.length - 5));
    setMatches(updatedMatches)
    setMatchId(null)
    await window.electron.deleteMatch(matchId);
    setUpdateOptions(true);
    toast({
      title: "Success",
      description: "Match deleted!",
    })


  }

  const handleDeleteMatches = async () => {
    setMatches([]);
    setMatchId(null);
    await window.electron.deleteMatches();
    setUpdateOptions(true);
    toast({
      title: "Success",
      description: "All matches deleted!",
    })

  }

  useEffect(() => {
    if (!updateOptions) {
      return;
    }
    const start = async () => {

      const matchJSONS = await window.electron.getMatches();
      matchJSONS.filter((m) => m.length > 5);
      matchJSONS.sort((a, b) => parseInt(a.substring(0, a.length - 5)) - parseInt(b.substring(0, b.length - 5)));
      setMatches(matchJSONS);
      setUpdateOptions(false);
    }
    start();
  }, [updateOptions]);

  return (
    <div className="flex-grow flex flex-col items-center justify-center bg-zinc-900 relative gap-6 w-full">
      <div className='flex flex-col lg:flex-row items-center gap-8 justify-center w-full p-6'>

        <div className="flex flex-col items-center gap-4">
          <div className="w-full flex gap-3 items-center justify-center">
            <p className="text-sm text-zinc-300">Match ID: </p>
            <MatchSelector matchId={matchId} setMatchId={setMatchId} matches={matches} />

            <Button
              onClick={handleDeleteMatch}
              disabled={!matchId}
              variant="destructive"
              className="px-4 py-2 rounded">
              Delete Match
            </Button>

            <Button
              onClick={handleDeleteMatches}
              disabled={matches.length === 0}
              variant="destructive"
              className="px-4 py-2 rounded">
              Delete All
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

        <div className="flex-grow w-full max-w-md">
          <PlayerStats currentMatchStateIndex={currentMatchStateIndex} matchStates={matchStates} matchInfo={matchInfo} />
        </div>
      </div>
    </div>
  );
}
export default Replayer