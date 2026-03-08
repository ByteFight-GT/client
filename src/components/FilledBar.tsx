"use client";

import { cn } from '@/lib/utils';
import React from 'react';

type FilledBarProps = {
  filledProportion: number; // between 0 and 1
  background: React.CSSProperties['background'];
} & React.HTMLAttributes<HTMLDivElement>;

/** "Progress-bar" like thing */
export const FilledBar = (
  {className, filledProportion, ...rest}: FilledBarProps
) => {
  return (
    <div className={cn('w-full h-2 bg-muted overflow-hidden', className)} {...rest}>
      <div
        className='h-full transition-all duration-25'
        style={{
          width: `${Math.min(Math.max(filledProportion, 0), 1) * 100}%`,
          background: rest.background,
        }}
      />
    </div>
  );
};
