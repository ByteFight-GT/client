"use client";

import React from 'react';
import "./page.css";

import { useMatches } from '@/hooks/useMatches';
import { CompletedMatchCard } from './components/CompletedMatchCard';
import { GenericPage } from '@/components';

const MatchReplayerPage = () => {

	const {completedMatchHistory} = useMatches();

	console.log("match replayer page: matches: ", completedMatchHistory);

	return (
		<GenericPage 
		variant="thin"
		className='relative flex flex-col pb-8' 
		titleEle={<span className='text-primary leading-normal'>Matches</span>}>
			<div className='matches-list'>
				{completedMatchHistory.map(match => (
					<CompletedMatchCard key={match.matchId} matchData={match} />
				))}
			</div>
		</GenericPage>
	);
};

export default MatchReplayerPage;
