"use client";

import React from 'react';
import { fmtTime, word } from '../../../../../common/utils';
import Image from 'next/image';
import { SidebarItem } from '@/components/SidebarItem';
import { useVisualizer } from '@/gamerenderer/useVisualizer';

/** 
 * displays MatchMetadata objects that are currently running!
 * For use in CurrentMatchTab
 */
export const CurrentMatchCard = () => {

  const {currentMatchData} = useVisualizer();

  // stored in state so we can update every min
  const [timeElapsedDisplay, setTimeElapsedDisplay] = React.useState<string>(
    currentMatchData?.startTimestamp?
      fmtTime(Date.now() - currentMatchData.startTimestamp) 
    : 
      "-"
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsedDisplay(
        currentMatchData?.startTimestamp?
          fmtTime(Date.now() - currentMatchData.startTimestamp) 
        : 
          "-"
      );
    }, 60000);

    return () => clearInterval(interval);
  }, [currentMatchData?.startTimestamp]);
  
  if (!currentMatchData) {
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
        <h3 className='match-card-blue-header ellipsis' title={currentMatchData.teamBlue}>
          <Image className='inline' src="/blue_team_icon.svg" alt="*" width={12} height={12} />&nbsp;
          {currentMatchData.teamBlue}
          <span className='float-right font-bold'>{Object.keys(currentMatchData.blueWins).length}</span>
        </h3>
        <h3 className='match-card-green-header ellipsis' title={currentMatchData.teamGreen}>
          <Image className='inline' src="/green_team_icon.svg" alt="*" width={12} height={12} />&nbsp;
          {currentMatchData.teamGreen}
          <span className='float-right font-bold'>{Object.keys(currentMatchData.greenWins).length}</span>
        </h3>
      </div>

      <div>
        <h4 className='text-sm text-muted-foreground'>
          On {word(currentMatchData.maps.length, "map", "maps")}:
        </h4>
        {currentMatchData.maps.map((map, index) => (
          <p key={index} className='text-sm'>{map}</p>
        ))}
      </div>

      <hr />

      <div>
        {currentMatchData.startTimestamp !== null &&
          <p className='text-sm text-muted-foreground' title={new Date(currentMatchData.startTimestamp).toLocaleString()}>
            Started&nbsp;
            <span className='text-secondary-foreground'>{timeElapsedDisplay} ago</span>
          </p>
        }
        <p className='text-sm text-muted-foreground'>
          Match ID&nbsp;
          <span className='text-secondary-foreground'>{currentMatchData.matchId}</span>
        </p>
      </div>
    </div>
  );
};
