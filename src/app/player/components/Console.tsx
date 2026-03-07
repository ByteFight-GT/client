"use client";

import React from 'react';
import { useRunner } from '@/hooks/useRunner';
import { ChevronDownIcon } from 'lucide-react';
import { useCollapse } from 'react-collapsed';

const CONSOLE_UPDATE_INTERVAL_MS = 250;

/**
 * Console docker for match player.
 * We only have space to show one at a time i think so this will have tabs to switch between players
 */
export const Console = () => {

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
		<div className='ConsoleContainer-container'>
			<div className="ConsoleContainer-header-bar">Console</div>
			<div className='ConsoleContainer-body'>

				<div className='Console-body'>
					{stdOutChunks.map((chunk, index) => (
						<p key={`stdout-${index}`} className='Console-stdout'>{chunk}<br /></p>
					))}
				</div>
			</div>
		</div>
	);
};
