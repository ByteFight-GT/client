"use client";

import React from 'react';
import { MapbuilderSidebar } from './components/MapbuilderSidebar';

import './page.css'
import { type MapData } from '@/gametypes';

import _DEFAULT_MAP_DATA from './defaultMapData.json';
const DEFAULT_MAP_DATA = _DEFAULT_MAP_DATA as unknown as MapData;

export default function MapBuilderPage() {

	const [mapData, setMapData] = React.useState<MapData>(DEFAULT_MAP_DATA);

	return (
		<div className='mapbuilder-container'>
			<MapbuilderSidebar mapData={mapData} setMapData={setMapData} />
			<div className='mapbuilder-gamerenderer'>
				<p>
					eventually GameRenderer will go here and can just take mapData. for now though...
					<br />
					{JSON.stringify(mapData, null, 2)}
				</p>
			</div>
		</div>
	);
};
