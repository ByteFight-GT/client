"use client";

import React from 'react';

import './page.css';
import './components.css';

import { BotSelector } from './components/BotSelector';
import { Button } from '@/components/ui/button';
import { MapList } from './components/MapList';
import { LoaderPinwheel, RefreshCcw, Settings } from 'lucide-react';

const TEMP_BOT_PATHS = [
	"/path/to/bot1",
	"/path/to/bot2",
	"/path/to/bot3",
]

const RunnerPage = () => {

	const [blueBotPath, setBlueBotPath] = React.useState<string | undefined>();
	const [greenBotPath, setGreenBotPath] = React.useState<string | undefined>();

	return (
		<div className='runner-container'>

			<img 
			className='runner-container-bg-art' 
			src='/runner_page_bg_TEMP.png' 
			alt='Background Art' />

			<h1 className='mb-4'>Run Match</h1>
			<div className='flex gap-4 h-full'>

				<div className='flex flex-col gap-2'>
					<h3>Select Maps (3/14)</h3>
					<div className='flex gap-2'>
						<Button variant='outline' className='w-full' size="sm">Select All</Button>
						<Button variant='outline' className='w-full' size="sm">Clear</Button>
					</div>
					<MapList />
				</div>

				<div className='vert-divider-full' />

				<div className='flex flex-col gap-2'>
					<h3>Select Players</h3>
					<div className='flex gap-4'>
						<BotSelector botPaths={TEMP_BOT_PATHS} value={greenBotPath || ''} onChange={setGreenBotPath} />
						<BotSelector botPaths={TEMP_BOT_PATHS} value={blueBotPath || ''} onChange={setBlueBotPath} />
					</div>
					<hr className='mt-auto' />
					<Button variant='outline' className='w-full' size="sm"><RefreshCcw /> Reload Maps</Button>
					<Button variant='outline' className='w-full' size="sm"><RefreshCcw /> Reload Players</Button>
					<Button variant='outline' className='w-full' size="sm"><Settings /> Config</Button>
					<Button className='w-full' size="sm">Start</Button>
				</div>
				
			</div>
		</div>
	);
};

export default RunnerPage;
