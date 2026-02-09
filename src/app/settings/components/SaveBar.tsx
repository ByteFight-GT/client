"use client";

import { Button } from '@/components';
import React from 'react';

type SaveBarProps = {
	nUnsavedChanges: number,
	saveChanges: () => void,
	discardChanges: () => void
};

export const SaveBar = (props: SaveBarProps) => {
	return (
		<div className={`settings-save-bar ${props.nUnsavedChanges ? 'unsaved-changes' : ''}`}>
			<span className='text-sm mr-auto px-2'>
				{props.nUnsavedChanges > 0?
					`${props.nUnsavedChanges} Unsaved change(s)!`
				: 
					"All changes saved"
				}
			</span>
			<Button disabled={!props.nUnsavedChanges} variant="link" className='text-muted-foreground' onClick={props.discardChanges}>Discard Changes</Button>
			<Button disabled={!props.nUnsavedChanges} onClick={props.saveChanges}>Save</Button>
		</div>
	);
};
