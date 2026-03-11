"use client";

import React from 'react';
import {
	Button, Input,
	Dialog, DialogContent, DialogTitle, DialogFooter,
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components';
import { MapLoc, Symmetry, Symmetry_t } from '../../../../common/types';
import { mapSizeAllowed, MIN_MAP_SIZE, MAX_MAP_SIZE } from '../mapBuilderUtils';

type InitialMapSetupDialogProps = {
	open: boolean;
	defaultSize: MapLoc;
	defaultSymmetry: Symmetry_t;
	onConfirm: (size: MapLoc, symmetry: Symmetry_t) => void;
	onDismiss: () => void;
};

export const InitialMapSetupDialog = (props: InitialMapSetupDialogProps) => {
	const [size, setSize] = React.useState<MapLoc>(props.defaultSize);
	const [symmetry, setSymmetry] = React.useState<Symmetry_t>(props.defaultSymmetry);

	const sizeValid = mapSizeAllowed(size);

	return (
		<Dialog open={props.open} onOpenChange={(open) => { if (!open) props.onDismiss() }}>
			<DialogContent>
				<DialogTitle>Initial Map Setup</DialogTitle>

				<p className='text-sm text-muted-foreground'>
					Welcome to the Map Builder! This is a reminder to pick your map size and symmetry now, as trying to change
          these later on will require clearing the map! Symmetry sucks doesn't it...
				</p>

        <div>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground flex-shrink-0'>Rows:</span>
            <Input
            type="number"
            min={MIN_MAP_SIZE}
            max={MAX_MAP_SIZE}
            value={size[0]}
            onFocus={e => e.currentTarget.select()}
            onChange={e => setSize(prev => [parseInt(e.target.value) || 0, prev[1]])} />

            &ensp;

            <span className='text-sm text-muted-foreground flex-shrink-0'>Columns:</span>
            <Input
            type="number"
            min={MIN_MAP_SIZE}
            max={MAX_MAP_SIZE}
            value={size[1]}
            onFocus={e => e.currentTarget.select()}
            onChange={e => setSize(prev => [prev[0], parseInt(e.target.value) || 0])} />
          </div>

          <p className={`mt-1 text-xs text-center ${sizeValid ? 'text-muted-foreground' : 'text-destructiveBright'}`}>
            Map dimensions must be between {MIN_MAP_SIZE} and {MAX_MAP_SIZE}.
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground flex-shrink-0'>Symmetry:</span>
          <Select value={symmetry} onValueChange={val => setSymmetry(val as Symmetry_t)}>
            <SelectTrigger className='bg-secondary'><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(Symmetry).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

				<DialogFooter>
					<Button disabled={!sizeValid} onClick={() => props.onConfirm(size, symmetry)}>
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
