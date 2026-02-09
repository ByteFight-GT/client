"use client";

import React from 'react';

interface GenericPageProps extends React.HTMLAttributes<HTMLDivElement> {
	titleEle?: React.ReactNode;
	subtitleEle?: React.ReactNode;
	variant?: 'wide' | 'thin';
	children: React.ReactNode;
};

const GENERIC_PAGE_VARIANTS = {
	wide: 'py-24 min-h-full w-11/12 mx-auto',
	thin: 'py-24 min-h-full px-6 md:max-w-5xl mx-auto',
} as const;

export const GenericPage = ({
	className, 
	titleEle, 
	subtitleEle, 
	children, 
	variant = 'wide', 
	...rest
}: GenericPageProps) => {
	return (
		<div className={`${GENERIC_PAGE_VARIANTS[variant]} ${className}`} {...rest}>

			{titleEle && <>
				<h1 className="text-5xl lg:text-6xl font-bold">{titleEle}</h1>
			</>}
			{subtitleEle && <>
				<p className="text-lg text-muted-foreground mt-1">{subtitleEle}</p>
			</>}
			{(titleEle || subtitleEle) && 
				<br />
			}

			{children}

		</div>
	);
};
