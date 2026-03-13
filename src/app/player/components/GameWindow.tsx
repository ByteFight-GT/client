"use client";

import React from 'react';
import { GameNavigator } from './GameNavigator';
import { GameRenderer } from '@/gamerenderer/GameRenderer'; 

export const GameWindow = () => {
	return (
		<div className='GameWindow-container'>
			<GameRenderer transformComponentProps={{
				wrapperStyle: { 
					width: '100%', 
					height: '100vh',
					backgroundImage: `url(/gamerenderer-bg.webp)`,
					backgroundSize: 'cover',
				},
			}} />
			<GameNavigator />
		</div>
	);
};
