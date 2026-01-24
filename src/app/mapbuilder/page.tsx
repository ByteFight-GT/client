"use client";

import React from 'react';
import MapBuilder from './components/MapBuilder'
import { MapbuilderSidebar } from './components/MapbuilderSidebar';

import './style.css'

type MatchPlayerPageProps = {
	
};

const MapBuilderPage = (props: MatchPlayerPageProps) => {
	return (
		<div className='mapbuilder-container'>
			<MapbuilderSidebar />
			<h1>test</h1>
		</div>
	);
};

export default MapBuilderPage;