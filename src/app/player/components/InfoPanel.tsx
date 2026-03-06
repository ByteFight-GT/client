"use client";

import React from 'react';

type InfoPanelProps = {
	playerColor: string;
	botName: string; // name of the directory for local games, and team name for actual games
	botPath?: string; // dir path for the bot, only for local games
};

export const InfoPanel = (props: InfoPanelProps) => {
	return (
		<div>
			<h1>{props.playerColor}</h1>
		</div>
	);
};
