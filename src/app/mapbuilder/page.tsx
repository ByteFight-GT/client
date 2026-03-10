"use client";

import React from 'react';
import Image from 'next/image';

import './page.css'
import { TileType, type TileType_t, type MapData, type MapLoc, type MapDataOptionalSpawnpts, type GamePGN } from '../../../common/types';
import { MapbuilderSidebar } from './components/MapbuilderSidebar';
import { GameRenderer } from '@/gamerenderer/GameRenderer';
import { useVisualizer, VisualizerProvider } from '@/gamerenderer/useVisualizer';

import { applySymmetry, arrayEq1D } from '../../../common/utils';

import _DEFAULT_MAP_DATA from '../../gamerenderer/defaults/DEFAULT_MAP_DATA.json';
const DEFAULT_MAP_DATA = _DEFAULT_MAP_DATA as unknown as MapData;

export default function MapBuilderPageWrapper() {
	return (
		<VisualizerProvider>
			<MapBuilderPage />
		</VisualizerProvider>
	);
}

export type MapBuilderEditorState = {
	mapName: string;
	selectedTileType: TileType_t;
	mouseDown: boolean;
	hillId: number;
};

/** returns a new MapData after changing the tiletype at loc based on whats selected in editorState. */
function placeTile(
	mapData: MapDataOptionalSpawnpts, 
	loc: MapLoc, 
	editorState: MapBuilderEditorState,
): MapDataOptionalSpawnpts {

	
	// make copy and check everything to see if we needa clear it first
	const newMapData = {...mapData};
	const symmetricLoc = applySymmetry(loc, mapData.size, mapData.symmetry);
	
	const shouldntBeCleared = editorState.selectedTileType !== TileType.HILL?
		(tile: MapLoc) => !arrayEq1D(tile, loc) && !arrayEq1D(tile, symmetricLoc)
	:
		(tile: MapLoc) => !arrayEq1D(tile, loc); // no need to clear otherside on hills, since they arent symmetric
	
	// CLEARING CURRENT TILE if needed
	newMapData.wallLocs = mapData.wallLocs.filter(shouldntBeCleared);
	for (const hillId in mapData.hillLocs) {
		newMapData.hillLocs[hillId] = mapData.hillLocs[hillId].filter(shouldntBeCleared);
	}
	if (mapData.spawnpointBlue && !shouldntBeCleared(mapData.spawnpointBlue)) {
		newMapData.spawnpointBlue = null;
	}
	if (mapData.spawnpointGreen && !shouldntBeCleared(mapData.spawnpointGreen)) {
		newMapData.spawnpointGreen = null;
	}

	switch (editorState.selectedTileType) {
		case TileType.EMPTY: // already handled!
			return newMapData;

		case TileType.WALL:
			newMapData.wallLocs.push(loc);
			newMapData.wallLocs.push(symmetricLoc);
			return newMapData;

		case TileType.HILL:
			if (!newMapData.hillLocs[editorState.hillId]) {
				newMapData.hillLocs[editorState.hillId] = [];
			}
			newMapData.hillLocs[editorState.hillId].push(loc); // NOTE - hills not symmetric!
			return newMapData;

		case TileType.BLUE_SPAWN:
			newMapData.spawnpointBlue = loc;
			newMapData.spawnpointGreen = symmetricLoc;
			return newMapData;

		case TileType.GREEN_SPAWN:
			newMapData.spawnpointGreen = loc;
			newMapData.spawnpointBlue = symmetricLoc;
			return newMapData;
	}
}

function MapBuilderPage() {

	const {setVisualizerState, subscribeToCanvasMouseEvents} = useVisualizer();

	const [mapData, setMapData] = React.useState<MapDataOptionalSpawnpts>(DEFAULT_MAP_DATA);
	const [editorState, setEditorState] = React.useState<MapBuilderEditorState>({
		mapName: '',
		selectedTileType: TileType.EMPTY,
		mouseDown: false,
		hillId: 0,
	});


	// click handler
	React.useEffect(() => {
		return subscribeToCanvasMouseEvents((mapLoc, event) => {
			if (event.type === "mousedown") {
				setEditorState(prev => ({...prev, mouseDown: true}));
			} else if (event.type === "mouseup") {
				setEditorState(prev => ({...prev, mouseDown: false}));
			}

			if (event.type === "mousemove" && !editorState.mouseDown) {
				return; // only place tiles on click or click+drag, not just hover
			}
			setMapData(prevMapData => placeTile(prevMapData, mapLoc, editorState));
		});
	}, [editorState.mouseDown, editorState.hillId, editorState.selectedTileType]);

	// updating the visualizer state whenever mapData or editorState changes
	React.useEffect(() => {
		setVisualizerState({mapData});
	}, [mapData]);

	return (
		<div className='mapbuilder-container'>

			<MapbuilderSidebar 
			mapData={mapData} 
			setMapData={setMapData} 
			editorState={editorState} 
			setEditorState={setEditorState} />

			<div className='mapbuilder-gamerenderer'>
				<GameRenderer 
				disablePanning
				shouldShowSpawnpoints
				transformComponentProps={{
					wrapperStyle: { 
						width: '100%', 
						height: '100%',
						backgroundImage: `url(/gamerenderer-bg.webp)`,
						backgroundSize: 'cover',
					},
				}} />
			</div>
		</div>
	);
};
