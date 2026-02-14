"use client";

import React from 'react';
import './page.css';

import { GameWindow } from './components/GameWindow';
import { PlayerProvider } from './context';
import { MatchPlayerSidebar } from './components/MatchPlayerSidebar';

type MatchPlayerPageProps = {
	
};

const MatchPlayerPage = (props: MatchPlayerPageProps) => {
	return (
		<PlayerProvider>
			<div className='matchplayer-container'>
				<MatchPlayerSidebar />
				<GameWindow />
			</div>
		</PlayerProvider>
	);
};

export default MatchPlayerPage;
