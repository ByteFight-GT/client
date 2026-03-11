"use client";

import React from 'react';
import { Button, Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components';

type ClearMapDialogProps = {
  open: boolean;
	onCancel: () => void;
	onConfirm: () => void;
};

export const ClearMapDialog = (props: ClearMapDialogProps) => {
	return (
		<Dialog open={props.open} onOpenChange={(open) => { if (!open) props.onCancel() }}>
			<DialogContent>
				<DialogTitle>Clear Map?</DialogTitle>
				<p>Are you sure you want to clear all features on the map? This action cannot be undone!!!!!!!!!!</p>
        <DialogFooter>
          <Button variant='secondary' onClick={() => props.onCancel()}>Cancel</Button>
          <Button variant='destructive' onClick={() => props.onConfirm()}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}