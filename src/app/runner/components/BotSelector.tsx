"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components';
import React from 'react';

type BotSelectorProps = {
	botPaths: string[];
	value?: string;
	onChange: (botPath: string) => void;
};

/**
 * Select+Input element for selecting autodetected bots from a dropdown, or specifying a custom directory
 */
export const BotSelector = (props: BotSelectorProps) => {

	const botNames = React.useMemo(() => (
		props.botPaths.map(path => path.slice(path.lastIndexOf('/') + 1))
	), [props.botPaths]);

	return (
		<div>
			<Select value={props.value} onValueChange={props.onChange}>
				<SelectTrigger className="w-32">
					<SelectValue placeholder="Select a bot" />
				</SelectTrigger>
				<SelectContent>
					{botNames.map((_, i) => (
						<SelectItem 
						key={props.botPaths[i]} 
						value={props.botPaths[i]}>
							{botNames[i]}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};
