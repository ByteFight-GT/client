"use client";

import React from 'react';
import { GameInfo } from '../match/GameInfo';
import { Console } from '../match/Console';
import { CurrentMatchCard } from '../match/CurrentMatchCard';

export const CurrentMatchTab = () => {
  return (
    <>
      <div className='flex flex-col gap-4 p-4'>
        <h2>Current Match</h2>
        <CurrentMatchCard />
        <GameInfo />
      </div>
      <Console />
    </>
  );
};
