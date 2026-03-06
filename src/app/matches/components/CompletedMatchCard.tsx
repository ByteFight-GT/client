"use client";

import React from 'react';
import { MatchMetadata } from '../../../../common/types';
import { fmtTime, word } from '../../../../common/utils';
import { Button } from '@/components';
import Image from 'next/image';
import { useCollapse } from 'react-collapsed';
import { EyeOffIcon, FolderIcon, SwordsIcon } from 'lucide-react';

type CompletedMatchCardProps = {
  matchData: MatchMetadata;
};

/** 
 * displays MatchMetadata objects specifically for the completed matches page
 * Please make sure `matchData` is actually from the completed matches list!!!
 */
export const CompletedMatchCard = (props: CompletedMatchCardProps) => {
  const [timeElapsedDisplay, setTimeElapsedDisplay] = React.useState<string>(fmtTime(Date.now() - (props.matchData.finishTimestamp ?? 0)));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsedDisplay(fmtTime(Date.now() - (props.matchData.finishTimestamp ?? 0)));
    }, 60000);

    return () => clearInterval(interval);
  }, [props.matchData.finishTimestamp]);

  const { getCollapseProps, getToggleProps, isExpanded } = useCollapse({defaultExpanded: true, duration: 100});

  if (props.matchData.finishTimestamp === null || props.matchData.startTimestamp === null) {
    console.warn(`Tried to render CompletedMatchCard w/ match id ${props.matchData.matchId} that has no finishTimestamp or startTimestamp! It wont be shown cuz these are required!`);
    return null;
  }

  return (
    <div className="completed-match-card">

      <div className="completed-match-card-header" {...getToggleProps()}>
        <h3 className='match-card-blue-header flex gap-4 items-center' title={props.matchData.teamBlue}>
          <b className='text-4xl align-middle flex-shrink-0'>{Object.keys(props.matchData.blueWins).length}</b>
          <Image src="/blue_team_icon.svg" alt="*" width={12} height={12} />
          <span className='ellipsis'>{props.matchData.teamBlue}</span>
        </h3>
        <h3 className='match-card-green-header flex justify-end gap-4 items-center' title={props.matchData.teamGreen}>
          <span className='ellipsis'>{props.matchData.teamGreen}</span>
          <Image src="/green_team_icon.svg" alt="*" width={12} height={12} />
          <b className='text-4xl align-middle flex-shrink-0'>{Object.keys(props.matchData.greenWins).length}</b>
        </h3>
      </div>

      <div {...getCollapseProps()}>
        {props.matchData.maps.map(map => {

          let winObj;
          let winnerStr;
          if (props.matchData.greenWins[map]) {
            winObj = props.matchData.greenWins[map];
            winnerStr = "Green";
          } else if (props.matchData.blueWins[map]) {
            winObj = props.matchData.blueWins[map];
            winnerStr = "Blue";
          } else {
            return (
              <div
              key={map} 
              className="completed-match-card-map undecided">
                <span className='font-bold text-foreground'>{map}</span>
                &middot;
                Undecided
              </div>
            );
          }

          return (
            <div
            key={map} 
            className={`completed-match-card-map ${winnerStr}`}>
              <span className='font-bold text-foreground'>{map}</span>
              &middot;
              <span>{winnerStr} won</span>
              &middot;
              <span>{word(winObj.numRounds, "round", "rounds")}</span>
              &middot;
              <span>by {winObj.reason}</span>
            </div>
          );
        })}

        <div className='flex flex-wrap items-center gap-x-2 mt-4 text-sm text-muted-foreground'>
          <p title={new Date(props.matchData.queuedTimestamp).toLocaleString()}>
            Played&nbsp;
            <span className='text-secondary-foreground'>{timeElapsedDisplay} ago</span>
          </p>
          &middot;
          <p>
            Ran for&nbsp;
            <span className='text-secondary-foreground'>{fmtTime(props.matchData.finishTimestamp - props.matchData.startTimestamp)}</span>
          </p>
          &middot;
          <p>
            Status:&nbsp;
            <span className={`completed-match-card-status-${props.matchData.status}`}>{props.matchData.status}</span>
          </p>
          &middot;
          <p>
            Match ID&nbsp;
            <span className='text-secondary-foreground'>{props.matchData.matchId}</span>
          </p>

          <div className='ml-auto'>

            {/* TODO: go to runmatchtab and input these specs (dont immediately queue) */}
            {/*<Button tooltip="Rerun" className='ml-auto' variant="ghost" size="iconsm">
              <SwordsIcon />
            </Button>*/}

            <Button 
            onClick={() => {
              if (props.matchData.outputDir) {
                window.electron.openPathInExplorer(props.matchData.outputDir);
              }
            }}
            tooltip={props.matchData.outputDir? "Open games folder" : "No games folder found"}
            disabled={!props.matchData.outputDir}
            className='ml-auto' 
            variant="ghost" 
            size="iconsm">
              <FolderIcon />
            </Button>

            <Button tooltip='Collapse' className='ml-auto' variant="ghost" size="iconsm" {...getToggleProps()}>
              <EyeOffIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
