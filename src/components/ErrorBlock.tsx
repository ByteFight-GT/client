"use client";

import React from 'react';
import { XIcon } from 'lucide-react';

import { cn } from "@/lib/utils";

type ErrorBlockProps = {
	text?: string;
  loaderStyle?: React.CSSProperties;
  loadTextStyle?: React.CSSProperties;
} & React.ComponentProps<"div">;

export const ErrorBlock = ({ text, loaderStyle, loadTextStyle, className, ...props }: ErrorBlockProps) => {
	return (
		<div
    className={cn(
      "flex flex-col items-center justify-center gap-1 p-4 w-full h-full",
      className
    )}
    {...props}>
      <XIcon className="text-[4em] mx-auto text-destructive" />
      <p className="text-secondary-foreground text-center">
        {text ?? 'An error occurred!'}
      </p>
    </div>
	);
};

