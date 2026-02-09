"use client";

import { Button } from '@/components';
import React from 'react';

type SaveBarProps = {
	hasUnsavedChanges?: boolean
	saveSettings: () => void,
	restoreSettings: () => void
};

export const SaveBar = (props: SaveBarProps) => {
	return (
		<div className={`settings-save-bar ${props.hasUnsavedChanges ? 'unsaved-changes' : ''}`}>
			{props.hasUnsavedChanges && <span className='text-sm font-bold align-middle mr-auto px-2'>Unsaved changes!</span>}
			<Button disabled={!props.hasUnsavedChanges} variant="link" className='text-muted-foreground' onClick={props.restoreSettings}>Discard Changes</Button>
			<Button disabled={!props.hasUnsavedChanges} onClick={props.saveSettings}>Save</Button>
		</div>
	);
};
