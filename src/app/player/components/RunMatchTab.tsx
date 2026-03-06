"use client";

import { SidebarItem } from '@/components/SidebarItem';
import React from 'react';
import { MapList } from './MapList';
import { BotSelector } from './BotSelector';
import { Button } from '@/components';
import { ArrowLeftRightIcon, ClockIcon, ImportIcon, PlayIcon, RefreshCwIcon } from 'lucide-react';
import { useMaps } from '@/hooks/useMaps';
import { useLoadings } from '@/hooks/useLoadings';
import { useBots } from '@/hooks/useBots';
import { useRunner } from '@/hooks/useRunner';

export const RunMatchTab = () => {
  const {maps, fetchMapList} = useMaps();
  const {bots, fetchBotList} = useBots();
  const {queueNewMatch, currentlyRunningMatch, recentBots, updateRecentBots, lastRunnerSetup, saveLastRunnerSetup} = useRunner();
  const {loadings} = useLoadings()

  // 1. Changed from a Set to a single string (or null)
  const [selectedMap, setSelectedMap] = React.useState<string | null>(null);  
  // const [selectedMaps, setSelectedMaps] = React.useState<Set<string>>(new Set());
  const [selectedGreenTeam, setSelectedGreenTeam] = React.useState<string | null>(null);
  const [selectedBlueTeam, setSelectedBlueTeam] = React.useState<string | null>(null);

  const handleSwapTeams = React.useCallback(() => {
    const currGreen = selectedGreenTeam;
    const currBlue = selectedBlueTeam;
    setSelectedGreenTeam(currBlue);
    setSelectedBlueTeam(currGreen);
  }, [selectedGreenTeam, selectedBlueTeam]);

  const handleRefreshBots = React.useCallback(() => {
    fetchBotList();
    setSelectedGreenTeam(null);
    setSelectedBlueTeam(null);
  }, [fetchBotList]);

  const handleRefreshMaps = React.useCallback(() => {
    fetchMapList();
    // setSelectedMaps(new Set());
    setSelectedMap(null);
  }, [fetchMapList]);

  const handleStartMatch = React.useCallback(() => {
    if (selectedMap && selectedGreenTeam && selectedBlueTeam) {
      queueNewMatch({
        selectedMaps: [selectedMap], // change to selectedMaps when we support multiple
        selectedGreenTeam,
        selectedBlueTeam,
      });
      saveLastRunnerSetup({
        selectedMaps: [selectedMap],
        selectedGreenTeam,
        selectedBlueTeam,
      });
      updateRecentBots(selectedGreenTeam, selectedBlueTeam);
      setSelectedMap(null);
      setSelectedGreenTeam(null);
      setSelectedBlueTeam(null);
    }
  }, [selectedMap, selectedGreenTeam, selectedBlueTeam, queueNewMatch, updateRecentBots]);

  return (
    <div className='flex flex-col gap-4 p-4'>
      <h2>Run Match</h2>

      <div className='flex gap-2'>

        <button 
        className='matchplayer-run-again-button'
        disabled={!lastRunnerSetup}
        onClick={() => {
          if (lastRunnerSetup) {
            setSelectedMap(lastRunnerSetup.selectedMaps[0]); // TODO: change when we support multiple maps
            setSelectedGreenTeam(lastRunnerSetup.selectedGreenTeam);
            setSelectedBlueTeam(lastRunnerSetup.selectedBlueTeam);
          }
        }}>
          <ImportIcon className='mx-auto text-2xl text-secondary-foreground' />
          Use Last Setup
        </button>

        <button 
        className='matchplayer-start-button'
        disabled={!(selectedMap && selectedGreenTeam && selectedBlueTeam)}
        onClick={handleStartMatch}>
          {currentlyRunningMatch? 
            <><ClockIcon className='mx-auto text-2xl text-secondary-foreground' />Queue</>
          :
            <><PlayIcon className='mx-auto text-2xl text-primary' />Start</>
          }
        </button>

      </div>

      <SidebarItem label="Select Teams">
        <div className='grid grid-cols-2 gap-2'>
          <BotSelector 
          team="green"
          botNames={bots}
          value={selectedGreenTeam}
          recents={recentBots.green} 
          onChange={(name) => setSelectedGreenTeam(name)} />

          <BotSelector 
          team="blue"
          botNames={bots}
          value={selectedBlueTeam}
          recents={recentBots.blue} 
          onChange={(name) => setSelectedBlueTeam(name)} />
        </div>
        
        <hr />

        <Button variant="outline" onClick={handleSwapTeams}>
          <ArrowLeftRightIcon className='inline align-sub text-primary' />
          Swap Sides
        </Button>
      </SidebarItem>

      <SidebarItem label="Select Map">
        <div className="w-full max-h-48 overflow-y-auto rounded-md border border-input bg-background p-1 text-sm shadow-sm">
          {maps.length === 0 ? (
            <p className="p-2 text-muted-foreground text-center italic">
              No maps available
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {maps.map((map) => {
                const isSelected = selectedMap === map;
                return (
                  <button
                    key={map}
                    onClick={() => setSelectedMap(map)}
                    className={`w-full border border-transparent text-left px-2 py-1 rounded-sm ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-medium" // Selected state (no hover bg here)
                        : "text-foreground hover:border-complementary hover:bg-secondary" // Only hover if NOT selected
                    }`}
                  >
                    {map}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SidebarItem>

      <div className='flex flex-col gap-2 w-full'>
        <Button variant="secondary" loading={loadings.fetchBotList} onClick={handleRefreshBots}>
          <RefreshCwIcon className='inline align-sub text-primary' />
          Refresh Bots
        </Button>
        <Button variant="secondary" loading={loadings.fetchMapList} onClick={handleRefreshMaps}>
          <RefreshCwIcon className='inline align-sub text-primary' />
          Refresh Maps
        </Button>
      </div>
      
    </div>
  );
};
