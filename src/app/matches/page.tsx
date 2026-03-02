"use client";

import React from 'react';
import "./page.css";

import { useMatches } from '@/hooks/useMatches';
import { CompletedMatchCard } from './components/CompletedMatchCard';
import { Button, GenericPage } from '@/components';
import { word } from '../../../common/utils';
import { useLoadings } from '@/hooks/useLoadings';

const PAGE_SIZE = 30;

const MatchReplayerPage = () => {

	const {loadings} = useLoadings();
	const {completedMatchHistory, totalMatchesIndexed, fetchMatchHistoryNextPage} = useMatches();

	console.log("match replayer page: matches: ", completedMatchHistory);

	return (
		<GenericPage 
		variant="thin"
		className='relative flex flex-col pb-8' 
		titleEle={<span className='text-primary leading-normal'>Matches</span>}
		subtitleEle={
			<span className='flex gap-4 items-center'>
				{word(totalMatchesIndexed, "match", "matches")} played
				&middot;
				<Button variant="secondary">Import from file</Button>
			</span>
		}>
			<div className='matches-list'>
				{completedMatchHistory.map(match => (
					<CompletedMatchCard key={match.matchId} matchData={match} />
				))}
				{completedMatchHistory.length < totalMatchesIndexed?
					<Button
					className='mx-auto'
					disabled={loadings.fetchMatchHistoryNextPage}
					variant="outline"
					onClick={() => fetchMatchHistoryNextPage(PAGE_SIZE)}>
						Load More ({totalMatchesIndexed} / {completedMatchHistory.length})
					</Button>
				:
					<p className='text-center text-sm text-muted-foreground'>That's all folks!</p>
				}
			</div>
		</GenericPage>
	);
};

export default MatchReplayerPage;
