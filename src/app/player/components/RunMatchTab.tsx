"use client";

import { SidebarItem } from '@/components/SidebarItem';
import React from 'react';
import { MapList } from './MapList';
import { BotSelector } from './BotSelector';
import Image from 'next/image';
import { Button } from '@/components';
import { ArrowLeftRightIcon, ImportIcon, PlayIcon, RefreshCwIcon, SwordsIcon } from 'lucide-react';
import { useAppState } from '@/app/useAppState';

export const RunMatchTab = () => {

  const { maps, bots, fetchBotList, fetchMapList, loadings } = useAppState();
  const [selectedMaps, setSelectedMaps] = React.useState<Set<string>>(new Set());

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
    setSelectedMaps(new Set());
  }, [fetchMapList]);
  
  return (
    <div className='flex flex-col gap-4 p-4'>
      <h2>Run Match</h2>

      <div className='flex gap-2'>
        <button className='matchplayer-run-again-button'>
          <ImportIcon className='mx-auto text-2xl text-secondary-foreground' />
          Use Last Setup
        </button>
        <button 
        disabled={
          selectedMaps.size === 0 
          || selectedGreenTeam === null 
          || selectedBlueTeam === null
        }
        className='matchplayer-start-button'>
          <PlayIcon className='mx-auto text-2xl text-primary' />
          Start!
        </button>
      </div>

      <SidebarItem label="Select Teams">
        <div className='grid grid-cols-2 gap-2'>
          <BotSelector 
          team="green"
          botNames={bots}
          value={selectedGreenTeam}
          recents={["test1"]} 
          onChange={(name) => setSelectedGreenTeam(name)} />

          <BotSelector 
          team="blue"
          botNames={bots}
          value={selectedBlueTeam}
          recents={["test3", "test4"]} 
          onChange={(name) => setSelectedBlueTeam(name)} />
        </div>
        
        <hr />

        <Button variant="outline" onClick={handleSwapTeams}>
          <ArrowLeftRightIcon className='inline align-sub text-primary' />
          Swap Sides
        </Button>
      </SidebarItem>

      <SidebarItem label={`Select Maps • ${selectedMaps.size}/${maps.length}`}>
        <MapList
        selectedMaps={selectedMaps}
        setSelectedMaps={setSelectedMaps} />
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
