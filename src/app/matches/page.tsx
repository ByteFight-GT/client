"use client";

import React from 'react';
import "./page.css";

import { useMatches } from '@/hooks/useMatches';
import { CompletedMatchCard } from './components/CompletedMatchCard';
import { Button, GenericPage, Input } from '@/components';
import { word } from '../../../common/utils';
import { useLoadings } from '@/hooks/useLoadings';
import { ArrowRightIcon } from 'lucide-react';
import { MatchMetadata } from '../../../common/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const PAGE_SIZE = 30;

const MatchReplayerPage = () => {

	const {loadings} = useLoadings();
	const {completedMatchHistory, totalMatchesIndexed, fetchMatchHistoryNextPage} = useMatches();

	const [visibleMatchHistory, setVisibleMatchHistory] = React.useState<MatchMetadata[]>([]);

	const filterInputRef = React.useRef<HTMLInputElement>(null);

	const filterMatches = React.useCallback((matches: MatchMetadata[], filter?: string) => {
		if (!filter) return matches;

		const lowercaseFilter = filter.toLowerCase();

		return matches.filter((match, i) => {
			const idFilter = match.matchId.includes(filter);
			const greenTeamFilter = match.teamGreen.toLowerCase().includes(lowercaseFilter);
			const blueTeamFilter = match.teamBlue.toLowerCase().includes(lowercaseFilter);
			return idFilter || greenTeamFilter || blueTeamFilter;
		});
	}, []);

	React.useEffect(() => {
		setVisibleMatchHistory(filterMatches(completedMatchHistory, filterInputRef.current?.value));
	}, [completedMatchHistory, filterMatches]);

	const handleSearch = () => {
		const filter = filterInputRef.current?.value;
		setVisibleMatchHistory(filterMatches(completedMatchHistory, filter));
	}

	return (
		<GenericPage 
		variant="thin"
		className='relative flex flex-col pb-8' 
		titleEle={<span className='text-primary leading-normal'>Matches</span>}
		subtitleEle={
			<>
				Showing {visibleMatchHistory.length} of {word(totalMatchesIndexed, "match", "total matches")}

				<div className='flex gap-4 mt-2 items-center'>
					
					<Button variant="secondary">Import from file</Button>

					<Input 
					placeholder="Search by ID or Teams" 
					ref={filterInputRef} 
					onKeyDown={e => {
						if (e.key === "Enter") {
							handleSearch();
						}
					}} />

					<Button onClick={handleSearch}>
						Search <ArrowRightIcon/>
					</Button>
					
				</div>
			</>
		}>
			<div className='matches-list'>
				{visibleMatchHistory.length === 0?
					loadings.fetchMatchHistoryNextPage?
						<LoadingSpinner className='mx-auto w-16 h-16 text-muted-foreground' />
					:
						<p className='text-center text-sm text-muted-foreground'>No matches found.</p>
				:
					visibleMatchHistory.map(match => (
						<CompletedMatchCard key={match.matchId} matchData={match} />
					))
				}

				{completedMatchHistory.length < totalMatchesIndexed?
					<Button
					className='mx-auto'
					loading={loadings.fetchMatchHistoryNextPage}
					variant="outline"
					onClick={() => fetchMatchHistoryNextPage(PAGE_SIZE)}>
						Load More ({completedMatchHistory.length} / {totalMatchesIndexed})
					</Button>
				:
					<p className='text-center text-sm text-muted-foreground'>All matches loaded!</p>
				}
			</div>
		</GenericPage>
	);
};

export default MatchReplayerPage;
