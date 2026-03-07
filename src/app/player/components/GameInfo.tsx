"use client";

import { useVisualizer } from '@/gamerenderer/useVisualizer';
import { ClockIcon, LandPlotIcon, SmartphoneChargingIcon } from 'lucide-react';
import React from 'react';
import { GamePGN } from '../../../../common/types';

type GameInfoVisibleState = {
	p1_stamina: number | null;
	p2_stamina: number | null;
	p1_territory: number | null;
	p2_territory: number | null;
	p1_time_left: number | null;
	p2_time_left: number | null;
}

export const GameInfo = () => {

	const {subscribeToGameOrFrameChanges} = useVisualizer();
	
	// state to show, received from visualizer subscription
	const [renderedState, setRenderedState] = React.useState<GameInfoVisibleState | null>(null);
	const [renderedGameFrame, setRenderedGameFrameState] = React.useState<number>(0);
	
	React.useEffect(() => {
		return subscribeToGameOrFrameChanges(
			(entirePGN: GamePGN, frame: number) => setRenderedState({
				p1_stamina: entirePGN.p1_stamina[frame] ?? null,
				p2_stamina: entirePGN.p2_stamina[frame] ?? null,
				p1_territory: entirePGN.p1_territory[frame] ?? null,
				p2_territory: entirePGN.p2_territory[frame] ?? null,
				p1_time_left: entirePGN.p1_time_left[frame] ?? null,
				p2_time_left: entirePGN.p2_time_left[frame] ?? null,
			})
		);
	}, []);

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
					{renderedState?.p1_stamina ?? '-'}
				</span>
				<div className='flex flex-col items-center'>
					<SmartphoneChargingIcon />
					<span className='text-xs text-muted-foreground'>STAMINA</span>
				</div>
				<span>
					{renderedState?.p2_stamina ?? '-'}
				</span>
			</div>

			<div className='game-info-row'>
				<span>
					{renderedState?.p1_territory ?? '-'}
				</span>
				<div className='flex flex-col items-center'>
					<LandPlotIcon />
					<span className='text-xs text-muted-foreground'>TERRITORY</span>
				</div>
				<span>
					{renderedState?.p2_territory ?? '-'}
				</span>
			</div>

			<div className='game-info-row'>
				<span>
					{renderedState?.p1_time_left?.toFixed(2) ?? '-'}
				</span>
				<div className='flex flex-col items-center'>
					<ClockIcon />
					<span className='text-xs text-muted-foreground'>TIME</span>
				</div>
				<span>
					{renderedState?.p2_time_left?.toFixed(2) ?? '-'}
				</span>
			</div>
		</div>
	);
};
