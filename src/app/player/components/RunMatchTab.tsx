"use client";

import { SidebarItem } from '@/components/SidebarItem';
import React from 'react';
import { MapList } from './MapList';
import { BotSelector } from './BotSelector';
import Image from 'next/image';
import { Button } from '@/components';
import { ArrowLeftRightIcon, ImportIcon, PlayIcon, RefreshCwIcon, SwordsIcon } from 'lucide-react';

export const RunMatchTab = () => {

  const [selectedMaps, setSelectedMaps] = React.useState<Set<string>>(new Set());

  return (
    <div className='flex flex-col gap-4 p-4'>
      <h2>Run Match</h2>

      <div className='flex gap-2'>
        <button className='matchplayer-run-again-button'>
          <ImportIcon className='mx-auto text-2xl text-secondary-foreground' />
          Use Last Setup
        </button>
        <button className='matchplayer-start-button'>
          <PlayIcon className='mx-auto text-2xl text-primary' />
          Start!
        </button>
      </div>

      <SidebarItem label="Select Maps">
        <MapList
        selectedMaps={selectedMaps}
        setSelectedMaps={setSelectedMaps} />
      </SidebarItem>

      <SidebarItem label={
        <span className='text-[hsl(var(--team-green-color))]'>
          <Image src="/green_team_icon.svg" alt="*" width={16} height={16} className='inline align-text-top' />
          &nbsp;Green Team
        </span>
      }>
        <BotSelector 
        botNames={["test", "test2", "hi", "recent1", "recent2", ...Array.from({length: 20}, (_, i) => `bot${i}`)]}
        recents={["recent1", "recent2dfdsafsafsXX*X*X***XYUYZUYZ*&28372183789000423-4-234-"]} 
        onChange={() => {}} />
      </SidebarItem>

      <div className='flex gap-2'>
        <Button variant="secondary" className='w-1/2'> 
          <ArrowLeftRightIcon className='inline align-sub text-primary' />
          Switch Sides
        </Button>
        <Button variant="secondary" className='w-1/2'>
          <RefreshCwIcon className='inline align-sub text-primary' />
          Refresh Bots
        </Button>
      </div>

      <SidebarItem label={
        <span className='text-[hsl(var(--team-blue-color))]'>
          <Image src="/blue_team_icon.svg" alt="*" width={16} height={16} className='inline align-text-top' />
          &nbsp;Blue Team
        </span>
      }>
        <BotSelector 
        botNames={["test", "test2", "hi", "recent1", "recent2"]} 
        recents={["recent1", "recent2"]} 
        onChange={() => {}} />
      </SidebarItem>
      
    </div>
  );
};
