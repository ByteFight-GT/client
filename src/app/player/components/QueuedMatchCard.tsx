"use client";

import React from 'react';
import { MatchMetadata } from '../../../../common/types';
import { fmtTime, word } from '../../../../common/utils';
import { Button } from '@/components';
import { useRunner } from '@/hooks/useRunner';
import { ChevronDownIcon, ChevronsUpIcon, ChevronUpIcon } from 'lucide-react';
import Image from 'next/image';

type QueuedMatchCardProps = {
  queueIndex: number;
  matchData: MatchMetadata;
};

/** 
 * displays MatchMetadata objects specifically for the queue page
 * Please make sure `matchData` is actually from the queue!!!
 */
export const QueuedMatchCard = (props: QueuedMatchCardProps) => {

  // stored in state so we can update every min
  const [timeElapsedDisplay, setTimeElapsedDisplay] = React.useState<string>(fmtTime(props.matchData.queuedTimestamp));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsedDisplay(fmtTime(Date.now() - props.matchData.queuedTimestamp));
    }, 60000);

    return () => clearInterval(interval);
  }, [props.matchData.queuedTimestamp]);

  const {queuedMatches, moveWithinQueue, dequeueMatch} = useRunner();

  const promoteToFront = React.useCallback(() => {
    if (props.queueIndex === 0) return;
    moveWithinQueue(props.queueIndex, 0);
  }, [props.queueIndex, moveWithinQueue]);

  const moveForward = React.useCallback(() => {
    if (props.queueIndex === 0) return;
    moveWithinQueue(props.queueIndex, props.queueIndex - 1);
  }, [props.queueIndex, moveWithinQueue]);

  const moveBackward = React.useCallback(() => {
    if (props.queueIndex === queuedMatches.length - 1) return;
    moveWithinQueue(props.queueIndex, props.queueIndex + 1);
  }, [props.queueIndex, queuedMatches.length, moveWithinQueue]);

  return (
    <div className={`match-card ${props.queueIndex === 0? "border-primary" : "border-border"}`}>
      <div>
        <h3 className='match-card-blue-header ellipsis' title={props.matchData.teamBlue}>
          <Image className='inline' src="/blue_team_icon.svg" alt="*" width={12} height={12} />&nbsp;
          {props.matchData.teamBlue}
        </h3>
        <h3 className='match-card-green-header ellipsis' title={props.matchData.teamGreen}>
          <Image className='inline' src="/green_team_icon.svg" alt="*" width={12} height={12} />&nbsp;
          {props.matchData.teamGreen}
        </h3>
      </div>

      <div>
        <h4 className='text-sm text-muted-foreground'>
          On {word(props.matchData.maps.length, "map", "maps")}:
        </h4>
        {props.matchData.maps.map((map, index) => (
          <p key={index} className='text-sm'>{map}</p>
        ))}
      </div>

      <hr />

      <div>
        <p className='text-sm text-muted-foreground'>
          Queue Position&nbsp;
          <span className='text-foreground font-bold'>
            {props.queueIndex > 0? `#${props.queueIndex + 1}` : "UP NEXT"}
          </span>
        </p>
        <p className='text-sm text-muted-foreground' title={new Date(props.matchData.queuedTimestamp).toLocaleString()}>
          Queued&nbsp;
          <span className='text-secondary-foreground'>{timeElapsedDisplay} ago</span>
        </p>
        <p className='text-sm text-muted-foreground'>
          Match ID&nbsp;
          <span className='text-secondary-foreground'>{props.matchData.matchId}</span>
        </p>
        <div className='flex flex-wrap gap-2 mt-2'>
          <Button variant="outline" size="iconsm" onClick={promoteToFront}><ChevronsUpIcon /></Button>
          <Button variant="outline" size="iconsm" disabled={props.queueIndex === 0} onClick={moveForward}><ChevronUpIcon /></Button>
          <Button variant="outline" size="iconsm" disabled={props.queueIndex === queuedMatches.length - 1} onClick={moveBackward}><ChevronDownIcon /></Button>
          <Button variant="destructive" onClick={() => dequeueMatch(props.queueIndex)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};
