"use client";

import { ChevronUp } from 'lucide-react';
import React from 'react';
import { useCollapse } from "react-collapsed";

type CollapsibleDockerProps = {
	children?: React.ReactNode;
	title?: string;
};

export const CollapsibleDocker = (props: CollapsibleDockerProps) => {

	const { getCollapseProps, getToggleProps, isExpanded } = useCollapse({defaultExpanded: true, duration: 100});

	return (
		<div className='CollapsibleDocker-container'>
			<div className={`CollapsibleDocker-header-bar ${isExpanded? 'isExpanded' : ''}`} {...getToggleProps()}>
				<h1>{props.title}</h1>
				<ChevronUp className='CollapsibleDocker-toggle-icon' />
			</div>
			<div className='CollapsibleDocker-body' {...getCollapseProps()}>
				{props.children}
			</div>
		</div>
	);
};
