import React from 'react'
import { Button } from '@/components';
import { ButtonGroup } from '@/components/ui/button-group';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from 'lucide-react';
import { Range } from 'react-range';

import { useVisualizer } from '@/gamerenderer/useVisualizer';

const speeds = [
	{ label: "1x", value: 1 },
	{ label: "2x", value: 2 },
	{ label: "4x", value: 4 },
	{ label: "8x", value: 8 },
];

export const GameNavigator = () => {
	const { 
		subscribeToGameOrFrameChanges,
		currentMatchData,
		setRenderedGameFrame,
		incrementRenderedGameFrame,
		autoAdvance,
		setAutoAdvance,
		playbackSpeed,
		setPlaybackSpeed
	} = useVisualizer();

	// state to show, received from visualizer subscription
	const [maxGameFrame, setMaxGameFrame] = React.useState(0);
	const [renderedGameFrame, setRenderedGameFrameState] = React.useState<number>(0);

	React.useEffect(() => {
		return subscribeToGameOrFrameChanges(
			(entirePGN, currentFrame) => {
				setMaxGameFrame(entirePGN.turn_count);
				setRenderedGameFrameState(currentFrame);
			}
		);
	}, []);

	/** 
	 * Disabled means user cant control anything except for setting playback speed.
	 * We disable when theres no game running, or at the very beginning of a game
	 * when only the  map has been loaded and not any data (turn_count should be -1 then)
	 */
	const controlsDisabled = !currentMatchData || maxGameFrame <= 0;

	// components for the slider
	const RenderSliderTrack = React.useCallback(({ props, children }) => {
		const {key, ...rest} = props;
		return (
			<div key={key} {...rest} className={`gamenav-slider-track ${controlsDisabled? "disabled" : ""}`}>
				{children}
			</div>
		);
	}, [controlsDisabled]);

	const RenderSliderThumb = React.useCallback(({ props }) => {
		if (controlsDisabled) return null; // hide the thumb if controls are disabled
		const {key, ...rest} = props;
		return (
			<div key={key} {...rest} className="gamenav-slider-thumb" />
		);
	}, [controlsDisabled]);

	return (
		<div className="gamenav-container">
			<div className='flex gap-2 items-center gamenav-area-1'>
				<div className='flex justify-center text-secondary-foreground'>
					<span className='w-[4ch] text-right tabular-nums text-foreground font-bold'>
						{controlsDisabled? "-" : renderedGameFrame}
					</span>
					/
					<span className='w-[4ch] text-left tabular-nums'>
						{controlsDisabled? "-" : maxGameFrame}
					</span>
				</div>

				<ButtonGroup>
					<Button 
					disabled={controlsDisabled}
					tooltip='Previous Move'
					size="iconsm"
					onClick={() => {
						setAutoAdvance(false);
						incrementRenderedGameFrame(-1);
					}}>
						<ChevronLeftIcon />
					</Button>

					<Button 
					disabled={controlsDisabled}
					tooltip='Next Move'
					size="iconsm"
					onClick={() => {
						setAutoAdvance(false);
						incrementRenderedGameFrame(1);
					}}>
						<ChevronRightIcon />
					</Button>
				</ButtonGroup>
			</div>

			<div className="gamenav-area-2">
				<Range
				disabled={controlsDisabled}
				min={0}
				max={controlsDisabled? 1 : maxGameFrame} // 1 if disabled just so rendering doesnt break. Shouldnt be usable anyway
				step={1}
				values={controlsDisabled? [0] : [Math.min(renderedGameFrame, maxGameFrame)]}
				onChange={(values) => {
					// blur this element to prevent keybinds from doublecounting (see GameWindow)
					document.activeElement instanceof HTMLElement && document.activeElement.blur(); 
					setAutoAdvance(false);
					setRenderedGameFrame(values[0]);
				}}
				renderTrack={RenderSliderTrack}
				renderThumb={RenderSliderThumb} />
			</div>

			<ButtonGroup className='gamenav-area-3'>
				<Button 
				disabled={controlsDisabled}
				tooltip="Play/Pause" 
				variant="secondary" 
				size="iconsm" 
				onClick={() => setAutoAdvance(prev => !prev)}>
					{autoAdvance? <PauseIcon /> : <PlayIcon />}
				</Button>

				{speeds.map((speed) => (
					<Button 
					tooltip={`${speed.label} Speed`}
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
