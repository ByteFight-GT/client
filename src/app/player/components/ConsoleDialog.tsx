"use client";

import React from 'react';
import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components';
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from 'lucide-react';
import { word } from '../../../../common/utils';

type ConsoleDialogProps = {
  stdOutChunks: string[];
};

export const ConsoleDialog = (props: ConsoleDialogProps) => {

  const consoleBodyRef = React.useRef<HTMLDivElement>(null);

  return (
    <Dialog>

      <DialogTrigger asChild>
        <Button variant="ghost" size="iconsm">
          <ExternalLinkIcon />
        </Button>
      </DialogTrigger>

      <DialogContent aria-describedby='console-title-aria-sybau'>
        <DialogTitle>Console Output</DialogTitle>

        {props.stdOutChunks.length > 0?
          <div 
          ref={consoleBodyRef}
          className='Console-body' 
          onWheel={(e) => {
            e.stopPropagation(); // some stupid radixui thing blocks scrolling idk
          }}>
            {props.stdOutChunks.map((chunk, index) => (
              <p key={`stdout-${index}`} className='Console-data'>{chunk}<br /></p>
            ))}
          </div>
        :
          <p className='text-muted-foreground text-center'>No output yet</p>
        }

        <DialogFooter>
          <Button variant="secondary" onClick={() => {
            if (consoleBodyRef.current) {
              consoleBodyRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
              })
            } 
          }}>
            <ChevronUpIcon /> Scroll to Top
          </Button>
          <Button variant="secondary" onClick={() => {
            if (consoleBodyRef.current) {
              consoleBodyRef.current.scrollTo({
                top: consoleBodyRef.current.scrollHeight,
                behavior: 'smooth'
              })
            } 
          }}>
            <ChevronDownIcon /> Scroll to Bottom
          </Button>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
