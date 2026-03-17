"use client";

import { FilledBar } from '@/components';
import React from 'react';

type GameInfoRowProps = {
  icon: React.ReactNode;
  label: string;
  blueVal: React.ReactNode;
  greenVal: React.ReactNode;
  blueFillProportion?: number;
  greenFillProportion?: number;
};

export const GameInfoRow = (props: GameInfoRowProps) => {
  return (
    <div className='flex flex-col items-center'>
      <div className='game-info-row'>
        <div>
          {props.blueVal}
          {props.blueFillProportion !== undefined && (
            <FilledBar
            // hack to make it right-to-left
            className='h-1 bg-[hsl(var(--team-blue-color))]'
            background='hsl(var(--muted))'
            filledProportion={1 - props.blueFillProportion} />
          )}
        </div>

        {props.icon}

        <div>
          {props.greenVal}
          {props.greenFillProportion !== undefined && (
            <FilledBar
            className='h-1'
            background='hsl(var(--team-green-color))'
            filledProportion={props.greenFillProportion} />
          )}
        </div>
      </div>
      <span className='text-xs text-muted-foreground'>{props.label}</span>
    </div>
  );
};
