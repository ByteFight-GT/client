"use client";

import React from 'react';
import { CollapsibleDocker } from './CollapsibleDocker';
import { useRunner } from '@/hooks/useRunner';

const CONSOLE_UPDATE_INTERVAL_MS = 500;

/**
 * Console docker for match player.
 * We only have space to show one at a time i think so this will have tabs to switch between players
 */
export const Console = () => {

	const [selectedTab, setSelectedTab] = React.useState<string>('blue');
	const {currentlyRunningMatch, stdOutChunksRef, stdErrChunksRef} = useRunner();

	const [stdOutChunks, setStdOutChunks] = React.useState<string[]>([]);
	React.useEffect(() => {
		const interval = setInterval(() => {
			// update buffers every so often
			if (stdOutChunksRef.current.length > 0) {
				setStdOutChunks(prev => [...prev, ...stdOutChunksRef.current]);
				stdOutChunksRef.current = [];
			}
			// TODO - somehow interleave stderr, or just combine them on the backend (make stderr red or smth?)
		}, CONSOLE_UPDATE_INTERVAL_MS);

		return () => clearInterval(interval);
	}, []);

	React.useEffect(() => {
		// clears console on new match
		setStdOutChunks([]); 
	}, [currentlyRunningMatch]);

	return (
		<CollapsibleDocker title="Console">
			<div className='Console-tabs-bar'>
				<div
				title={currentlyRunningMatch?.teamBlue || 'Blue'} 
				className={`Console-tab blue ${selectedTab === 'blue'? 'selected' : ''}`} 
				onClick={() => setSelectedTab('blue')}>
					<img src='/blue_team_icon.svg' alt={selectedTab[0]} className='Console-tab-icon' />
					<span>&nbsp;{currentlyRunningMatch?.teamBlue || 'Blue'}</span>
				</div>

				<div 
				title={currentlyRunningMatch?.teamGreen || 'Green'}
				className={`Console-tab green ${selectedTab === 'green'? 'selected' : ''}`} 
				onClick={() => setSelectedTab('green')}>
					<img src='/green_team_icon.svg' alt={selectedTab[0]} className='Console-tab-icon' />
					<span>&nbsp;{currentlyRunningMatch?.teamGreen || 'Green'}</span>
				</div>
			</div>

			<div className='Console-body'>
				{stdOutChunks.map((chunk, index) => (
					<p key={`stdout-${index}`} className='Console-stdout'>{chunk}<br /></p>
				))}
			</div>
		</CollapsibleDocker>
	);
};
