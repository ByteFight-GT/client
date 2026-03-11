"use client";

import React from 'react';
import { Button, Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components';

type ChangeMapSizeDialogProps = {
  open: boolean;
	onCancel: () => void;
	onConfirm: () => void;
};

export const ChangeMapSizeDialog = (props: ChangeMapSizeDialogProps) => {
	return (
		<Dialog open={props.open} onOpenChange={(open) => { if (!open) props.onCancel() }}>
			<DialogContent>
				<DialogTitle>Change Map Size?</DialogTitle>

				<p>Changing the map size requires clearing all map features. Are you sure you want to proceed?</p>

        <DialogFooter>
          <Button variant='secondary' onClick={() => props.onCancel()}>Cancel</Button>
          <Button variant='destructive' onClick={() => props.onConfirm()}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}