"use client";

import React from 'react';

import { cn } from '@/lib/utils';

export const LoadingSpinner = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg 
    xmlns="http://www.w3.org/2000/svg" 
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 100 100" 
    preserveAspectRatio="xMidYMid" 
    className={cn('w-4 h-4', props.className)}
    style={{
      shapeRendering: "auto",
      display: "block",
      background: "transparent"
    }}>
      <g>
        <circle strokeDasharray="164.93361431346415 56.97787143782138" r="35" strokeWidth="10" stroke="currentColor" fill="none" cy="50" cx="50">
          <animateTransform keyTimes="0;1" values="0 50 50;360 50 50" dur="1s" repeatCount="indefinite" type="rotate" attributeName="transform"></animateTransform>
        </circle>
      </g>
    </svg>
  );
};
