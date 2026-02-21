"use client";

import React from 'react';

type SidebarItemProps = {
	label: string;
	children: React.ReactNode;
};

export const SidebarItem = (props: SidebarItemProps) => {
	return (
		<div className='flex flex-col gap-2'>
			<h3 className='text-sm font-medium'>[{props.label}]</h3>
			{props.children}
		</div>
	);
};
