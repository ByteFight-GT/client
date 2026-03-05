"use client";

import React from 'react';
import './page.css';

import { GameWindow } from './components/GameWindow';
import { MatchPlayerSidebar } from './components/MatchPlayerSidebar';

import { GameProvider } from '@/gamerenderer/useGame';

type MatchPlayerPageProps = {
	
};

const MatchPlayerPage = (props: MatchPlayerPageProps) => {
	return (
		<div className='matchplayer-container'>
			<GameProvider>
				<MatchPlayerSidebar />
				<GameWindow />
			</GameProvider>
		</div>
	);
};

export default MatchPlayerPage;
