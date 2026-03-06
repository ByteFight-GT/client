"use client";

import React from 'react';
import { MatchMetadata } from '../../../../common/types';
import { fmtTime, word } from '../../../../common/utils';
import { Button } from '@/components';
import { useRunner } from '@/hooks/useRunner';
import { ChevronDownIcon, ChevronsUpIcon, ChevronUpIcon } from 'lucide-react';
import Image from 'next/image';

type RunningMatchCardProps = {
  matchData: MatchMetadata;
};

/** 
 * displays MatchMetadata objects that are currently running!
 * For use in MatchInfoTab
 */
export const RunningMatchCard = (props: RunningMatchCardProps) => {

  // stored in state so we can update every min
  const [timeElapsedDisplay, setTimeElapsedDisplay] = React.useState<string>(fmtTime(props.matchData.queuedTimestamp));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsedDisplay(fmtTime(Date.now() - props.matchData.queuedTimestamp));
    }, 60000);

    return () => clearInterval(interval);
  }, [props.matchData.queuedTimestamp]);

  return (
    <div className="match-card border-border">
      <div>
        <h3 className='match-card-green-header ellipsis' title={props.matchData.teamGreen}>
          <Image className='inline' src="/green_team_icon.svg" alt="*" width={12} height={12} />&nbsp;
          {props.matchData.teamGreen}
        </h3>
        <h3 className='match-card-blue-header ellipsis' title={props.matchData.teamBlue}>
          <Image className='inline' src="/blue_team_icon.svg" alt="*" width={12} height={12} />&nbsp;
          {props.matchData.teamBlue}
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
        <p className='text-sm text-muted-foreground' title={new Date(props.matchData.queuedTimestamp).toLocaleString()}>
          Queued&nbsp;
          <span className='text-secondary-foreground'>{timeElapsedDisplay} ago</span>
        </p>
        <p className='text-sm text-muted-foreground'>
          Match ID&nbsp;
          <span className='text-secondary-foreground'>{props.matchData.matchId}</span>
        </p>
      </div>
    </div>
  );
};
