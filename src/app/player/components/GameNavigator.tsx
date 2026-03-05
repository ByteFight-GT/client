import React from 'react'
import { Button } from '@/components';
import { ButtonGroup } from '@/components/ui/button-group';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from 'lucide-react';
import { Range } from 'react-range';

import { useGame } from '@/gamerenderer/useGame';

const speeds = [
	{ label: "1x", value: 1 },
	{ label: "2x", value: 2 },
	{ label: "4x", value: 4 },
	{ label: "8x", value: 8 },
];

export const GameNavigator = () => {

	const { 
		gameManagerRef, 
		renderedGameFrame, 
		setRenderedGameFrame,
		incrementRenderedGameFrame,
		autoAdvance,
		setAutoAdvance,
		playbackSpeed,
		setPlaybackSpeed
	} = useGame();

	const MAX_ROUNDS_TEMP = gameManagerRef.current.gamePGN.turn_count; // TODO - wont cause rerenders - we gotta make it reactive somehow

	return (
		<div className="game-navigator-container">
			<div className='flex gap-2 items-center gamenav-area-1 w-fit'>
				<span className='text-xl'>
					<span className='font-bold tabular-nums'>
						{(renderedGameFrame + 1).toString()}
					</span>
					<span className='text-secondary-foreground'>
						/{MAX_ROUNDS_TEMP}
					</span>
				</span>

				<Button 
				disabled={renderedGameFrame <= 0}
				title='Previous Move'
				size="iconsm"
				onClick={() => incrementRenderedGameFrame(-1)}>
					<ChevronLeftIcon />
				</Button>

				<Button 
				disabled={renderedGameFrame >= MAX_ROUNDS_TEMP - 1} // TODO
				title='Next Move'
				size="iconsm"
				onClick={() => incrementRenderedGameFrame(1)}>
					<ChevronRightIcon />
				</Button>
			</div>

			{MAX_ROUNDS_TEMP > 0 && 
				<div className='gamenav-area-2'>
					<Range
					values={renderedGameFrame !== undefined ? [renderedGameFrame] : [0]}
					step={1}
					min={0}
					max={MAX_ROUNDS_TEMP - 1}
					onChange={(values) => setRenderedGameFrame(values[0])}
					renderTrack={RangeTrack}
					renderThumb={RangeThumb} />
				</div>
			}

			<ButtonGroup className='gamenav-area-3 w-fit'>
				<Button title="Play/Pause" variant="secondary" size="iconsm" onClick={() => setAutoAdvance(!autoAdvance)}>
					{autoAdvance? <PauseIcon /> : <PlayIcon />}
				</Button>

				{speeds.map((speed) => (
					<Button 
					title={`${speed.label} Speed`}
					variant={speed.value === playbackSpeed? "default": "secondary"}
					size="iconsm" 
					onClick={() => setPlaybackSpeed(speed.value)}
					key={speed.value}>
						{speed.label}
					</Button>
				))}
			</ButtonGroup>
		</div>
	);
}

// this stuff is for the slider 
function RangeTrack({ props, children }) {
	const {key, ...rest} = props;
	return (
		<div key={key} {...rest} className='gamenav-slider-track'>
			{children}
		</div>
	);
}
function RangeThumb({ props }) {
	const {key, ...rest} = props;
	return (
		<div key={key} {...rest} className='gamenav-slider-thumb' />
	);
}