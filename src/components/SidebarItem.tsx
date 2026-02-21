"use client";

import React from 'react';

type SidebarItemProps = {
	label: string;
	children: React.ReactNode;
};

export const SidebarItem = (props: SidebarItemProps) => {
	return (
		<div className='flex flex-col gap-2 p-2 border border-border bg-secondary'>
			<div className='flex gap-2 items-center mb-2'>
				<hr className='flex-1 border-muted-foreground' />
				<h3 className='flex-grow-0 text-sm font-medium text-secondary-foreground'>[{props.label}]</h3>
				<hr className='flex-1 border-muted-foreground' />
			</div>
			{props.children}
		</div>
	);
};
