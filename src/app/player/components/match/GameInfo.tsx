"use client";

import { useVisualizer } from '@/gamerenderer/useVisualizer';
import React from 'react';
import { GamePGN } from '../../../../../common/types';
import Image from 'next/image';
import { GameInfoRow } from './GameInfoRow';

type GameInfoVisibleState = {
	p1_stamina: number | null;
	p2_stamina: number | null;
	p1_max_stamina: number | null;
	p2_max_stamina: number | null;
	p1_territory: number | null;
	p2_territory: number | null;
	p1_time_left: number | null;
	p2_time_left: number | null;
}

export const GameInfo = () => {

	const {subscribeToGameOrFrameChanges} = useVisualizer();
	
	// state to show, received from visualizer subscription
	const [renderedState, setRenderedState] = React.useState<GameInfoVisibleState | null>(null);
	const [maxTimePerBot, setMaxTimePerBot] = React.useState<number | null>(null); // set once on update 0
	
	React.useEffect(() => {
		return subscribeToGameOrFrameChanges(
			(entirePGN: GamePGN, frame: number) => {
				if (maxTimePerBot === null) {
					setMaxTimePerBot(entirePGN.p2_time_left[frame] ?? 360);
				}
				setRenderedState({
					p1_stamina: entirePGN.p1_stamina[frame] ?? null,
					p2_stamina: entirePGN.p2_stamina[frame] ?? null,
					p1_max_stamina: entirePGN.p1_max_stamina[frame] ?? null,
					p2_max_stamina: entirePGN.p2_max_stamina[frame] ?? null,
					p1_territory: entirePGN.p1_territory[frame] ?? null,
					p2_territory: entirePGN.p2_territory[frame] ?? null,
					p1_time_left: entirePGN.p1_time_left[frame] ?? null,
					p2_time_left: entirePGN.p2_time_left[frame] ?? null,
				});
			}
		);
	}, []);

	return (
		<div className='game-info-container'>

			<GameInfoRow
			label='STAMINA'
			icon={<Image src="/sprites/stamina.png" alt="*" width={48} height={48} />}
			blueVal={renderedState?.p1_stamina ?? '-'}
			greenVal={renderedState?.p2_stamina ?? '-'}
			blueFillProportion={
				(renderedState?.p1_stamina != null && renderedState.p1_max_stamina)? 
					renderedState.p1_stamina / Math.max(renderedState.p1_max_stamina, 1)
				: 
					0
			}
			greenFillProportion={
				(renderedState?.p2_stamina != null && renderedState.p2_max_stamina)? 
					renderedState.p2_stamina / Math.max(renderedState.p2_max_stamina, 1)
				: 
					0
			} />

			<GameInfoRow
			label='MAX STAMINA'
			icon={<Image src="/sprites/max_stamina.png" alt="*" width={48} height={48} />}
			blueVal={renderedState?.p1_max_stamina ?? '-'}
			greenVal={renderedState?.p2_max_stamina ?? '-'} />

			<GameInfoRow
			label='TERRITORY'
			icon={<Image src="/sprites/territory.png" alt="*" width={48} height={48} />}
			blueVal={renderedState?.p1_territory ?? '-'}
			greenVal={renderedState?.p2_territory ?? '-'} />

			<GameInfoRow
			label='TIME'
			icon={<Image src="/sprites/time.png" alt="*" width={48} height={48} />}
			blueVal={renderedState?.p1_time_left?.toFixed(2) ?? '-'}
			greenVal={renderedState?.p2_time_left?.toFixed(2) ?? '-'}
			blueFillProportion={
				(renderedState?.p1_time_left != null && maxTimePerBot)?
					renderedState.p1_time_left / maxTimePerBot
				:
					0
			}
			greenFillProportion={
				(renderedState?.p2_time_left != null && maxTimePerBot)?
					renderedState.p2_time_left / maxTimePerBot
				:
					0
			} />
		</div>
	);
};
