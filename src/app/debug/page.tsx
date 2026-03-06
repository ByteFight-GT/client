"use client";

import React from 'react';
import { Button, GenericPage } from '@/components';
import { useRunner } from '@/hooks/useRunner';
import { useToast } from '@/hooks/useToast';

export default function DebugPage() {

  const {toast, toastError} = useToast();
  const {debugIPCEventLog, setDebugIPCEventLog} = useRunner();

  return (
    <GenericPage titleEle="Debug Log">
      <div className='flex gap-2'>
        <Button onClick={() => {
          //setDebugIPCEventLog([]);
        }}>Clear Log</Button>
        <Button onClick={() => {
          toast({
            toastTitle: <span className='text-primary'>Test Toast</span>,
            toastDescription: (
              <div>
                Test toast with custom react content!
                <Button onClick={() => toastError(
                  "toast error title (nested!)",
                  "testfdsdf!! content goes here"
                )}>Show Another Toast</Button>
                <p>woah this is cool!</p>
              </div>
            ),
          });
        }}>Show Test Toast</Button>
      </div>
      <br />
      {debugIPCEventLog.map((event, index) => (
        <p key={index}>{event}</p>
      ))}
    </GenericPage>
  );
};
