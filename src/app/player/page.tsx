"use client";

import React from 'react';
import './page.css';

import { GameWindow } from './components/GameWindow';
import { MatchPlayerSidebar } from './components/MatchPlayerSidebar';

type MatchPlayerPageProps = {
	
};

const MatchPlayerPage = (props: MatchPlayerPageProps) => {
	return (
		<div className='matchplayer-container'>
			<MatchPlayerSidebar />
			<GameWindow />
		</div>
	);
};

export default MatchPlayerPage;
