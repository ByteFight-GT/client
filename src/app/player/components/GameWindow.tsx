"use client";

import React from 'react';
import { GameNavigator } from './GameNavigator';
import { GameRenderer } from '@/gamerenderer/GameRenderer';
import { useVisualizer } from '@/gamerenderer/useVisualizer';

type GameWindowProps = {
	
};

export const GameWindow = (props: GameWindowProps) => {

	const {incrementRenderedGameFrame, setAutoAdvance, setPlaybackSpeed} = useVisualizer();
	
	// keybinds map
	const KEYBINDS_MAP = React.useMemo(() => ({
		"Space": () => setAutoAdvance(prev => !prev),
		"ArrowRight": () => incrementRenderedGameFrame(1),
		"D": () => incrementRenderedGameFrame(1),
		"ArrowLeft": () => incrementRenderedGameFrame(-1),
		"A": () => incrementRenderedGameFrame(-1),
		"Digit1": () => setPlaybackSpeed(1),
		"Digit2": () => setPlaybackSpeed(2),
		"Digit4": () => setPlaybackSpeed(4),
		"Digit8": () => setPlaybackSpeed(8),
	}), [incrementRenderedGameFrame, setAutoAdvance, setPlaybackSpeed]);

	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const keybind = KEYBINDS_MAP[e.code];
			if (keybind) {
				e.preventDefault();
				keybind();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [KEYBINDS_MAP]);

	return (
		<div className='GameWindow-container'>
			<GameRenderer transformComponentProps={{
				wrapperStyle: { 
					width: '100%', 
					height: '100%',
					backgroundColor: "hsl(230, 45%, 15%)", // temp color for now. TODO - add background image?
				},
			}} />
			<GameNavigator />
		</div>
	);
};
