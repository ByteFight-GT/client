"use client";

import React from 'react';
import { GameInfo } from './GameInfo';
import { Console } from './Console';
import { useRunner } from '@/hooks/useRunner';
import { Button } from '@/components';
import Image from 'next/image';
import { RunningMatchCard } from './RunningMatchCard';
import { SidebarItem } from '@/components/SidebarItem';

export const MatchInfoTab = () => {

  const {currentlyRunningMatch} = useRunner();

  return (
    <>
      <div className='flex flex-col gap-4 p-4'>
        <h2>Current Match</h2>

        {currentlyRunningMatch? (
          <RunningMatchCard matchData={currentlyRunningMatch} />
        ) : (
          <SidebarItem disableDefaultHeader>
            <span className="text-center text-sm text-muted-foreground">
              No match is currently running.
            </span>
          </SidebarItem>
        )}

        <hr />

        <GameInfo />

      </div>
      <Console />
    </>
  );
};
