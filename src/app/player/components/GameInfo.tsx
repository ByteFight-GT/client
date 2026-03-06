"use client";

import { useGame } from '@/gamerenderer/useGame';
import { useRunner } from '@/hooks/useRunner';
import { ClockIcon, LandPlotIcon, SmartphoneChargingIcon } from 'lucide-react';
import React from 'react';

export const GameInfo = () => {

	const { 
		gameManagerRef,
		renderedGameFrame, 
	} = useGame();

	const {TEMP_gameDataPacketsReceived, currentlyRunningMatch, TEMP_currentlyViewingMatch} = useRunner();
	
	const [TEMP_maxGameFrame, setTEMP_maxGameFrame] = React.useState(0);

	// TEMP: for now, update our local state to the source of truth (from gameManagerRef) whenever we got new packet (TEMP_gameDataPacketsReceived changes)
	React.useEffect(() => {
		const newMaxFrame = gameManagerRef.current.gamePGN.turn_count;
		setTEMP_maxGameFrame(newMaxFrame);
	}, [TEMP_gameDataPacketsReceived]);

	if (!currentlyRunningMatch && !TEMP_currentlyViewingMatch) {
		return null;
	}

	return (
		<div className='game-info-container'>

			{/*<div className='flex w-full gap-4'>
				<div className='game-info-header-blue w-full flex-1'>
					<span className='ellipsis'>{currentlyRunningMatch?.teamBlue ?? 'Blue'}</span>
					<Image src="/blue_team_icon.svg" alt="*" width={16} height={16} />
				</div>
				<div className='game-info-header-green w-full flex-1'>
					<Image src="/green_team_icon.svg" alt="*" width={16} height={16} />
					<span className='ellipsis'>{currentlyRunningMatch?.teamGreen ?? 'Green'}</span>
				</div>
			</div>*/}

			<div className='game-info-row'>
				<span>
					{gameManagerRef.current.gamePGN.p1_stamina[renderedGameFrame] ?? '-'}
				</span>
				<div className='flex flex-col items-center'>
					<SmartphoneChargingIcon />
					<span className='text-xs text-muted-foreground'>STAMINA</span>
				</div>
				<span>
					{gameManagerRef.current.gamePGN.p2_stamina[renderedGameFrame] ?? '-'}
				</span>
			</div>

			<div className='game-info-row'>
				<span>
					{gameManagerRef.current.gamePGN.p1_territory[renderedGameFrame] ?? '-'}
				</span>
				<div className='flex flex-col items-center'>
					<LandPlotIcon />
					<span className='text-xs text-muted-foreground'>TERRITORY</span>
				</div>
				<span>
					{gameManagerRef.current.gamePGN.p2_territory[renderedGameFrame] ?? '-'}
				</span>
			</div>

			<div className='game-info-row'>
				<span>
					{gameManagerRef.current.gamePGN.p1_time_left[renderedGameFrame]?.toFixed(2) ?? '-'}
				</span>
				<div className='flex flex-col items-center'>
					<ClockIcon />
					<span className='text-xs text-muted-foreground'>TIME</span>
				</div>
				<span>
					{gameManagerRef.current.gamePGN.p2_time_left[renderedGameFrame]?.toFixed(2) ?? '-'}
				</span>
			</div>
		</div>
	);
};
