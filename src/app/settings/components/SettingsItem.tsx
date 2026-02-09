"use client";

import React from 'react';

type SettingsItemProps = {
	name: string,
	desc: string,
	unsaved: boolean,
	children: React.ReactNode
};

/**
 * Wrapper for a row/item on the config page, handles displaying title
 * and description and stuff. Pass in input elements as children. 
 */
export const SettingsItem = (props: SettingsItemProps) => {

	return (
		<div className={`settings-item${props.unsaved ? ' unsaved' : ''}`}>
			<div className='flex-1'>
				<h2 className='font-medium text-wrap'>{props.name}</h2>
				{props.desc && <p className='text-sm text-muted-foreground text-wrap'>{props.desc}</p>}
			</div>

			<div className='flex-shrink-0 flex items-center'>
				{props.children}
			</div>

		</div>
	);
};
