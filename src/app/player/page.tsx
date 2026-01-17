"use client";

import React from 'react';
import './page.css';
import './components.css';

import { GameWindow } from './components/GameWindow';
import { Console } from './components/Console';
import { GameInfo } from './components/GameInfo';

type MatchPlayerPageProps = {
	
};

const MatchPlayerPage = (props: MatchPlayerPageProps) => {
	return (
		<div className='matchplayer-container'>
			<div className='matchplayer-dockers'>
				<GameInfo />
				<Console blueTeamName='version_1' greenTeamName='version_2_fixed_really_long_name_bruh_ok' />
			</div>
			<GameWindow />
		</div>
	);
};

export default MatchPlayerPage;
