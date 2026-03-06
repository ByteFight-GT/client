"use client";

import React from 'react';

type SidebarItemProps = {
	label: string | React.ReactNode; // thing in the header
	disableDefaultHeader?: boolean; // whether to include the default header styling (brackets and lines)
	children: React.ReactNode;
} | {
	disableDefaultHeader: true;
	children: React.ReactNode;
};

export const SidebarItem = (props: SidebarItemProps) => {
	return (
		<div className='flex flex-col gap-2 p-2 border border-border bg-secondary'>

			{props.disableDefaultHeader?
				props.label
			:
				<div className='flex gap-2 items-center'>
					<hr className='flex-1 border-muted-foreground' />
					<h3 className='flex-grow-0 text-sm font-medium text-secondary-foreground'>[{props.label}]</h3>
					<hr className='flex-1 border-muted-foreground' />
				</div>
			}

			{props.children}
		</div>
	);
};
