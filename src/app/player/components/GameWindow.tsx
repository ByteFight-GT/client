"use client";

import React from 'react';
import { GameNavigator } from './GameNavigator';
import { GameRenderer } from '@/gamerenderer/GameRenderer';

type GameWindowProps = {
	
};

export const GameWindow = (props: GameWindowProps) => {
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
