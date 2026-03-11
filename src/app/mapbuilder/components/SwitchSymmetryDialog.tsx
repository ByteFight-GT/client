"use client";

import React from 'react';
import { Button, Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components';

type SwitchSymmetryDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const SwitchSymmetryDialog = (props: SwitchSymmetryDialogProps) => {

  return (
    <Dialog open={props.open} onOpenChange={(open) => { if (!open) props.onCancel() }}>
      <DialogContent>
        <DialogTitle>Switch Symmetry</DialogTitle>

        <p>Switching symmetry requires clearing all map features. Are you sure you want to proceed?</p>

        <DialogFooter>
          <Button variant='secondary' onClick={() => props.onCancel()}>Go Back</Button>
          <Button variant='destructive' onClick={() => props.onConfirm()}>Clear Entire Map</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
