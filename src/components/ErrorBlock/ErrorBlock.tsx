"use client";

import React from 'react';
import { XIcon } from 'lucide-react';

import "./ErrorBlock.css";

type ErrorBlockProps = {
	text?: string;
  outerStyle?: React.CSSProperties;
  loaderStyle?: React.CSSProperties;
  loadTextStyle?: React.CSSProperties;
};

export const ErrorBlock = (props: ErrorBlockProps) => {
	return (
		<div
    className="error-block"
    style={props.outerStyle}>
      <XIcon className="text-[4em] mx-auto text-destructive" />
      <p className="text-secondary-foreground text-center">
        {props.text ?? 'An error occurred!'}
      </p>
    </div>
	);
};
