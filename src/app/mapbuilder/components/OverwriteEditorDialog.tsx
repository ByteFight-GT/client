"use client";

import React from 'react';
import { Button, Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components';
import { useLoadings } from '@/hooks/loadingsContext';

type OverwriteEditorDialogProps = {
	onCancel: () => void;
	onConfirm: (mapName: string) => void;
	askingToLoadMapToEditor: string | null;
};

export const OverwriteEditorDialog = (props: OverwriteEditorDialogProps) => {

	const {loadings} = useLoadings();

	return (
		<Dialog open={props.askingToLoadMapToEditor !== null} 
		onOpenChange={(open) => {
			if (!open) props.onCancel();
		}}>
			<DialogContent>
				<DialogTitle>Overwrite Editor?</DialogTitle>
				<p>Are you sure you want to load <span className='text-primary'>{props.askingToLoadMapToEditor}</span> into the editor? Any unsaved progress will be lost.</p>
				<DialogFooter>
					<Button variant='secondary' onClick={() => props.onCancel()}>Cancel</Button>
					<Button loading={loadings["readMap"]} onClick={() => props.onConfirm(props.askingToLoadMapToEditor!)}>Load Map</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
