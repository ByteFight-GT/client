"use client";

import { useRunner } from '@/hooks/useRunner';
import React from 'react';
import { QueuedMatchCard } from './QueuedMatchCard';
import { word } from '../../../../common/utils';
import { Button } from '@/components';

export const QueueTab = () => {

  const {queuedMatches, clearAllQueued} = useRunner();

  return (
    <div className='flex flex-col gap-4 p-4'>
      <div>
        <h2>Queue</h2>
        <p className='text-muted-foreground'>{word(queuedMatches.length, "match", "matches")} waiting</p>
        <Button className='mt-2 w-full' variant="destructive" onClick={clearAllQueued} disabled={queuedMatches.length === 0}>
          Clear All Queued Matches
        </Button>
      </div>

      <hr />

      {queuedMatches.map((match, index) => (
        <QueuedMatchCard key={match.matchId} queueIndex={index} matchData={match} />
      ))}
    </div>
  );
};
