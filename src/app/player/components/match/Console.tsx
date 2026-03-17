"use client";

import React from 'react';
import { useRunner } from '@/hooks/useRunner';
import { ConsoleDialog } from './ConsoleDialog';

export const CONSOLE_UPDATE_INTERVAL_MS = 250;

/**
 * Console docker for match player.
 * We only have space to show one at a time i think so this will have tabs to switch between players
 */
export const Console = () => {

	const [isDialogOpen, setIsDialogOpen] = React.useState(false);

	const {stdOutChunksRef} = useRunner();
	const [stdOutChunks, setStdOutChunks] = React.useState<string[]>([]);
	React.useEffect(() => {
		const interval = setInterval(() => {
			// update buffers every so often
			if (stdOutChunksRef.current.length > 0) {
				setStdOutChunks(prev => [...prev, ...stdOutChunksRef.current]);
				stdOutChunksRef.current = [];
			}
		}, CONSOLE_UPDATE_INTERVAL_MS);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className='Console-container'>
			<div className="Console-header-bar">
				Console
				<ConsoleDialog stdOutChunks={stdOutChunks} />
			</div>
			<div className='Console-body'>
				{stdOutChunks.map((chunk, index) => (
					<p key={`stdout-${index}`} className='Console-data'>{chunk}<br /></p>
				))}
			</div>
		</div>
	);
};
