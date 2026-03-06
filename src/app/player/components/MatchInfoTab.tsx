"use client";

import React from 'react';
import { GameInfo } from './GameInfo';
import { Console } from './Console';
import { RunningMatchCard } from './RunningMatchCard';

export const MatchInfoTab = () => {

  return (
    <>
      <div className='flex flex-col gap-4 p-4'>
        <h2>Current Match</h2>
        <RunningMatchCard />
        <GameInfo />
      </div>
      <Console />
    </>
  );
};
