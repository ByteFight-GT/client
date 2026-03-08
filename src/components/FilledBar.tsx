"use client";

import React from 'react';

type FilledBarProps = {
  filledProportion: number; // between 0 and 1
  background: React.CSSProperties['background'];
} & React.HTMLAttributes<HTMLDivElement>;

/** "Progress-bar" like thing */
export const FilledBar = (
  {className, ...rest}: FilledBarProps
) => {
  return (
    <div className='w-full h-4 bg-muted rounded overflow-hidden' {...rest}>
      <div
        className='h-full'
        style={{
          width: `${Math.min(Math.max(rest.filledProportion, 0), 1) * 100}%`,
          background: rest.background,
        }}
      />
    </div>
  );
};
