"use client";

import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components';
import { ArrowRightIcon } from 'lucide-react';
import React from 'react';

type BotSelectorProps = {
	botNames: string[];
	recents: string[];
	value?: string;
	onChange: (botName: string) => void;
};

/**
 * Select+Input element for selecting autodetected bots from a dropdown, or specifying a custom directory
 */
export const BotSelector = (props: BotSelectorProps) => {

	const botNames = React.useMemo(() => (
		props.botNames.map(path => path.slice(path.lastIndexOf('/') + 1))
	), [props.botNames]);

	return (
		<div>
			<h3 className='text-sm text-muted-foreground mb-1'>Select Bot</h3>
			<Select value={props.value} onValueChange={props.onChange}>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Select..." />
				</SelectTrigger>
				<SelectContent>
					{botNames.map((_, i) => (
						<SelectItem 
						key={props.botNames[i]} 
						value={props.botNames[i]}>
							{botNames[i]}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{props.recents.length > 0 && (
				<div className='mt-2'>
					<h3 className='text-sm text-muted-foreground mb-1'>Recently Used</h3>	
					<div className='flex flex-col gap-1'>
						{props.recents.map((botName) => (
							<button 
							key={botName}
							className={`bot-selector-recent-button ${props.value === botName? 'selected' : ''}`}
							onClick={() => props.onChange(botName)}>
								<ArrowRightIcon className='inline mx-auto text-muted-foreground' />
								&nbsp;{botName}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
