"use client";

import React from 'react';
import { useIPC } from './useIPC';

type IPCWrapperProps = {
  children: React.ReactNode
};

export const IPCWrapper = (props: IPCWrapperProps) => {
  useIPC();
  return props.children;
};
