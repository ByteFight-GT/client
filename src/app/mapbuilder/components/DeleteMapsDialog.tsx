"use client";

import React from 'react';
import { Button, Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components';
import { useLoadings } from '@/hooks/useLoadings';

type DeleteMapsDialogProps = {
	open: boolean;
	nSelectedMaps: number;
	selectedMaps: Set<string>;
	onCancel: () => void;
	onConfirm: () => void;
};

export const DeleteMapsDialog = (props: DeleteMapsDialogProps) => {

	const {loadings} = useLoadings();

	return (
		<Dialog open={props.open} 
		onOpenChange={(open) => {
			if (!open) props.onCancel();
		}}>
			<DialogContent>
				<DialogTitle>Delete Maps?</DialogTitle>
				<p>Are you sure you want to delete <span className='text-primary'>{props.nSelectedMaps}</span> map(s)? This action cannot be undone.</p>
				<DialogFooter>
					<Button variant="secondary" onClick={props.onCancel}>Cancel</Button>
					<Button loading={loadings["handleDeleteMaps"]} variant="destructive" onClick={props.onConfirm}>Delete Maps</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
