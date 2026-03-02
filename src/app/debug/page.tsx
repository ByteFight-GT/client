"use client";

import React from 'react';
import { Button, GenericPage } from '@/components';
import { useRunner } from '@/hooks/useRunner';

export default function DebugPage() {

  const {debugIPCEventLog, setDebugIPCEventLog} = useRunner();

  return (
    <GenericPage titleEle="Debug Log">
      <Button onClick={() => {
        setDebugIPCEventLog([]);
      }}>Clear Log</Button>
      <br />
      {debugIPCEventLog.map((event, index) => (
        <p key={index}>{event}</p>
      ))}
    </GenericPage>
  );
};
