"use client";

import React from 'react';
import { fmtTime, word } from '../../../../common/utils';
import Image from 'next/image';
import { useRunner } from '@/hooks/useRunner';
import { SidebarItem } from '@/components/SidebarItem';
import { Button } from '@/components';

/** 
 * displays MatchMetadata objects that are currently running!
 * For use in MatchInfoTab
 */
export const RunningMatchCard = () => {

  const {currentlyRunningMatch, TEMP_currentlyViewingMatch} = useRunner();

  const matchToShow = React.useMemo(() => {
    // TEMP - show running with higher prio, or viewing if no running
    return currentlyRunningMatch ?? TEMP_currentlyViewingMatch;
  }, [currentlyRunningMatch, TEMP_currentlyViewingMatch]);

  // stored in state so we can update every min
  const [timeElapsedDisplay, setTimeElapsedDisplay] = React.useState<string>(fmtTime(matchToShow?.queuedTimestamp || Date.now()));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsedDisplay(fmtTime(Date.now() - (matchToShow?.queuedTimestamp ?? 0)));
    }, 60000);

    return () => clearInterval(interval);
  }, [matchToShow?.queuedTimestamp]);
  
  if (!matchToShow) {
    return (
      <SidebarItem disableDefaultHeader>
        <span className="text-center text-sm text-muted-foreground">
          No match is currently running.
        </span>
      </SidebarItem>
    );
  }


  return (
    <div className="match-card border-border">
      <div>
        <h3 className='match-card-green-header ellipsis' title={matchToShow.teamGreen}>
          <Image className='inline' src="/green_team_icon.svg" alt="*" width={12} height={12} />&nbsp;
          {matchToShow.teamGreen}
        </h3>
        <h3 className='match-card-blue-header ellipsis' title={matchToShow.teamBlue}>
          <Image className='inline' src="/blue_team_icon.svg" alt="*" width={12} height={12} />&nbsp;
          {matchToShow.teamBlue}
        </h3>
      </div>

      <div>
        <h4 className='text-sm text-muted-foreground'>
          On {word(matchToShow.maps.length, "map", "maps")}:
        </h4>
        {matchToShow.maps.map((map, index) => (
          <p key={index} className='text-sm'>{map}</p>
        ))}
      </div>

      <hr />

      <div>
        <p className='text-sm text-muted-foreground' title={new Date(matchToShow.queuedTimestamp).toLocaleString()}>
          Queued&nbsp;
          <span className='text-secondary-foreground'>{timeElapsedDisplay} ago</span>
        </p>
        <p className='text-sm text-muted-foreground'>
          Match ID&nbsp;
          <span className='text-secondary-foreground'>{matchToShow.matchId}</span>
        </p>
      </div>
    </div>
  );
};
