import React from 'react'
import { Button } from '@/components';
import { ButtonGroup } from '@/components/ui/button-group';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from 'lucide-react';
import { Range } from 'react-range';

import { useGame } from '@/gamerenderer/useGame';
import { useRunner } from '@/hooks/useRunner';

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

	const {TEMP_gameDataPacketsReceived} = useRunner();

	const [TEMP_maxGameFrame, setTEMP_maxGameFrame] = React.useState(0);

	// TEMP: for now, update our local state to the source of truth (from gameManagerRef) whenever we got new packet (TEMP_gameDataPacketsReceived changes)
	React.useEffect(() => {
		const newMaxFrame = gameManagerRef.current.gamePGN.turn_count;
		setTEMP_maxGameFrame(newMaxFrame);
	}, [TEMP_gameDataPacketsReceived]);

	return (
		<div className="game-navigator-container">
			<div className='flex gap-2 items-center gamenav-area-1 w-fit'>
				<span className='text-xl'>
					<span className='font-bold tabular-nums'>
						{(renderedGameFrame).toString()}
					</span>
					<span className='text-secondary-foreground'>
						/{Math.max(0, TEMP_maxGameFrame).toString() /* (TEMP) this is so stupid lol */}
					</span>
				</span>

				<Button 
				disabled={renderedGameFrame <= 0}
				title='Previous Move'
				size="iconsm"
				onClick={() => {
					setAutoAdvance(false);
					incrementRenderedGameFrame(-1);
				}}>
					<ChevronLeftIcon />
				</Button>

				<Button 
				disabled={renderedGameFrame >= TEMP_maxGameFrame} // TODO
				title='Next Move'
				size="iconsm"
				onClick={() => {
					setAutoAdvance(false);
					incrementRenderedGameFrame(1);
				}}>
					<ChevronRightIcon />
				</Button>
			</div>

			<div className={`gamenav-area-2 ${TEMP_maxGameFrame <= 0 && 'pointer-events-none opacity-50'}`}>
				<Range
				disabled={TEMP_maxGameFrame <= 0} // < and ^: TODO: make this cleaner lol
				// TEMP: when navigating back to /player, max starts off at 0. it should update when the effect runs
				values={renderedGameFrame !== undefined ? [Math.min(renderedGameFrame, TEMP_maxGameFrame)] : [0]}
				step={1}
				min={0}
				max={TEMP_maxGameFrame <= 0? 1 : TEMP_maxGameFrame} // TODO. setting to 1 as min because it errors if min=max. Should be disabled tho so it should be fine
				onChange={(values) => {
					setAutoAdvance(false);
					setRenderedGameFrame(values[0]);
				}}
				renderTrack={RangeTrack}
				renderThumb={RangeThumb} />
			</div>

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