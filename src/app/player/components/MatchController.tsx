"use client";

import React from 'react';
import '../components.css';
import { CollapsibleDocker } from './CollapsibleDocker';
import { BotSelector } from './BotSelector';
import { Button } from '@/components/ui/button';

const TEMP_BOT_PATHS = [
	"/path/to/bot1",
	"/path/to/bot2",
	"/path/to/bot3",
]

type MatchControllerProps = {
	
};

/**
 * Interface for users to start/queue new matches, pick bots, maps, etc 
 */
export const MatchController = (props: MatchControllerProps) => {

	const [blueBotPath, setBlueBotPath] = React.useState<string | undefined>();
	const [greenBotPath, setGreenBotPath] = React.useState<string | undefined>();

	return (
		<CollapsibleDocker title='Match Controller'>
			<div className='p-4'>
				<div className='flex flex-col gap-2 w-fit'>
					<BotSelector botPaths={TEMP_BOT_PATHS} value={greenBotPath || ''} onChange={setGreenBotPath} />
					<hr />
					<BotSelector botPaths={TEMP_BOT_PATHS} value={blueBotPath || ''} onChange={setBlueBotPath} />
				</div>
				<Button className='w-full text-base' size="sm">Start</Button>
			</div>
		</CollapsibleDocker>
	);
};
