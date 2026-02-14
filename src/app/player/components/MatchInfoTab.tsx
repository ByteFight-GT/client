"use client";

import React from 'react';
import { GameInfo } from './GameInfo';
import { Console } from './Console';

export const MatchInfoTab = () => {
  return (
    <div>
      <GameInfo />
      <Console blueTeamName='version_1' greenTeamName='version_2_fixed_really_long_name_bruh_ok' />
    </div>
  );
};
