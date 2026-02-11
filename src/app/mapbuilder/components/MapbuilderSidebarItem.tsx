"use client";

import React from 'react';

type MapbuilderSidebarItemProps = {
	label: string;
	children: React.ReactNode;
};

export const MapbuilderSidebarItem = (props: MapbuilderSidebarItemProps) => {
	return (
		<div className='mapbuilder-sidebar-item'>
			<h3>{props.label}</h3>
			{props.children}
		</div>
	);
};
