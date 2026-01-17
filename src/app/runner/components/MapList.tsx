"use client";

import React from 'react';

const TEMP_MAP_LIST = [
	{
		name: "Map 1",
		path: "/maps/map1.map",
	},
	{
		name: "Map with very long name cuz its cool and i need to test things",
		path: "/maps/map2.map",
	},
	{
		name: "Map 3",
		path: "/maps/map3.map",
	},
];

export const MapList = () => {

	const [selectedMaps, setSelectedMaps] = React.useState<string[]>([]);
	
	function toggleMapSelected(path: string) {
		if (!selectedMaps.includes(path)) {
			setSelectedMaps([...selectedMaps, path]);
		} else {
			setSelectedMaps(selectedMaps.filter(m => m !== path));
		}
	}

	return (
		<div className='map-list-container card-shadow'>
			{TEMP_MAP_LIST.map(map => (
				<MapListItem 
				key={map.path} 
				name={map.name} 
				path={map.path} 
				selected={selectedMaps.includes(map.path)} 
				toggleSelect={() => toggleMapSelected(map.path)} />
			))}
		</div>
	);
};

type MapListItemProps = {
	name: string;
	path: string;
	selected: boolean;
	toggleSelect: () => void;
};
const MapListItem = (props: MapListItemProps) => {
	return (
		<div 
		className={`map-list-item${props.selected ? ' selected' : ''}`} 
		onClick={() => props.toggleSelect()}>
			{props.name}
		</div>
	);
}
