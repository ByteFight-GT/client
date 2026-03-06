"use client";

import React from 'react';
import { MatchMetadata } from '../../../../common/types';
import { fmtTime, word } from '../../../../common/utils';
import { Button } from '@/components';
import Image from 'next/image';
import { useCollapse } from 'react-collapsed';
import { EyeOffIcon, FolderIcon, SwordsIcon } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useRunner } from '@/hooks/useRunner';
import { useLoadings } from '@/hooks/useLoadings';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { redirect } from 'next/navigation';

type CompletedMatchCardProps = {
  matchData: MatchMetadata;
};

/** 
 * displays MatchMetadata objects specifically for the completed matches page
 * Please make sure `matchData` is actually from the completed matches list!!!
 */
export const CompletedMatchCard = (props: CompletedMatchCardProps) => {

  const {toastError} = useToast();
  const {loadings} = useLoadings();
  const {currentlyRunningMatch, setTEMP_currentlyViewingMatch} = useRunner();
  const {loadGameIntoPlayer} = useRunner();

  const [timeElapsedDisplay, setTimeElapsedDisplay] = React.useState<string>(fmtTime(Date.now() - (props.matchData.finishTimestamp ?? 0)));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsedDisplay(fmtTime(Date.now() - (props.matchData.finishTimestamp ?? 0)));
    }, 60000);

    return () => clearInterval(interval);
  }, [props.matchData.finishTimestamp]);

  const { getCollapseProps, getToggleProps, isExpanded } = useCollapse({defaultExpanded: true, duration: 100});


  const handleOpenGameReplay = React.useCallback(async () => {
    if (!props.matchData.outputDir) {
      toastError(
        "No replay found",
        "Couldn't find replay directory: this match appears to not have a replay directory attached to it."
      );
      return;
    }

    if (currentlyRunningMatch) {
      toastError(
        "Game currently running",
        "You currently have a match running, please stop it or wait for it to finish before opening a replay."
      );
      return;
    }

    // TEMP - only have 1 map per match rn so just use [0]
    const success = await loadGameIntoPlayer(props.matchData, props.matchData.maps[0]);
    if (success) {
      redirect("/player");
    } // else: loadGameIntoPlayer will handle error display

  }, [loadGameIntoPlayer, currentlyRunningMatch, setTEMP_currentlyViewingMatch]);


  if (props.matchData.finishTimestamp === null || props.matchData.startTimestamp === null) {
    console.warn(`Tried to render CompletedMatchCard w/ match id ${props.matchData.matchId} that has no finishTimestamp or startTimestamp! It wont be shown cuz these are required!`);
    return null;
  }

  const winnerClass = 
    Object.entries(props.matchData.blueWins).length > Object.entries(props.matchData.greenWins).length? 
      "Blue"
    : Object.entries(props.matchData.greenWins).length > Object.entries(props.matchData.blueWins).length?
      "Green"
    : // else:
      "Undecided";

  const blueScore = Object.keys(props.matchData.blueWins).length + Object.keys(props.matchData.draws).length/2;
  const greenScore = Object.keys(props.matchData.greenWins).length + Object.keys(props.matchData.draws).length/2;

  return (
    <div className={`completed-match-card ${winnerClass}`}>

      <div className="completed-match-card-header" {...getToggleProps()}>
        <h3 className='match-card-blue-header flex gap-4 items-center' title={props.matchData.teamBlue}>
          <b className='text-4xl align-middle flex-shrink-0'>{blueScore.toFixed(1)}</b>
          <Image src="/blue_team_icon.svg" alt="*" width={12} height={12} />
          <span className='ellipsis'>{props.matchData.teamBlue}</span>
        </h3>
        <h3 className='match-card-green-header flex justify-end gap-4 items-center' title={props.matchData.teamGreen}>
          <span className='ellipsis'>{props.matchData.teamGreen}</span>
          <Image src="/green_team_icon.svg" alt="*" width={12} height={12} />
          <b className='text-4xl align-middle flex-shrink-0'>{greenScore.toFixed(1)}</b>
        </h3>
      </div>

      <div {...getCollapseProps()}>
        {props.matchData.maps.map(map => {

          let winObj;
          let resultDisplay;
          let winnerClassName;
          if (props.matchData.greenWins[map]) {
            winObj = props.matchData.greenWins[map];
            winnerClassName = "Green";
            resultDisplay = "Green won";
          } else if (props.matchData.blueWins[map]) {
            winObj = props.matchData.blueWins[map];
            winnerClassName = "Blue";
            resultDisplay = "Blue won";
          } else if (props.matchData.draws[map]) {
            winObj = props.matchData.draws[map];
            winnerClassName = "undecided";
            resultDisplay = "Draw";
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
            <button
            key={map} 
            disabled={loadings.loadGameIntoPlayer}
            onClick={handleOpenGameReplay}
            className={`completed-match-card-map ${winnerClassName}`}>
              { loadings.loadGameIntoPlayer && <LoadingSpinner /> }
              <span className='font-bold text-foreground'>{map}</span>
              &middot;
              <span>{resultDisplay}</span>
              &middot;
              <span>{word(winObj.numRounds, "round", "rounds")}</span>
              &middot;
              <span>by {winObj.reason}</span>
            </button>
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

            {/*<Button 
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
            </Button>*/}

            <Button tooltip='Collapse' className='ml-auto' variant="ghost" size="iconsm" {...getToggleProps()}>
              <EyeOffIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
