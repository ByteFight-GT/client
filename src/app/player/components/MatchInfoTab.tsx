"use client";

import React from 'react';
import { GameInfo } from './GameInfo';
import { Console } from './Console';
import { useRunner } from '@/hooks/useRunner';
import { Button } from '@/components';

export const MatchInfoTab = () => {

  const {currentlyRunningMatch, debugIPCEventLog, setDebugIPCEventLog} = useRunner();

  return (
    <div>
      <div>
        Currently Running Match:
        <p>
          {currentlyRunningMatch?.matchId}
          <br />
          {currentlyRunningMatch?.teamBlue} vs {currentlyRunningMatch?.teamGreen}
        </p>
      </div>
      <GameInfo />
      <Console />
    </div>
  );
};
