"use client";

import React from 'react';

import './page.css'
import { TileType, type TileType_t, type MapData, type MapLoc, type MapDataOptionalSpawnpts, type GamePGN } from '../../../common/types';
import { MapbuilderSidebar } from './components/MapbuilderSidebar';
import { GameRenderer } from '@/gamerenderer/GameRenderer';
import { useVisualizer, VisualizerProvider } from '@/gamerenderer/useVisualizer';

import { getTileTypeAtLoc, placeTile, updateMapData } from './mapBuilderUtils';

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
	mouseDownButton: number;
	hillId: number;
};

function MapBuilderPage() {

	const {canvasManagerRef, subscribeToCanvasMouseEvents} = useVisualizer();

	const [editorState, setEditorState] = React.useState<MapBuilderEditorState>({
		mapName: '',
		selectedTileType: TileType.EMPTY,
		mouseDownButton: -1,
		hillId: 0,
	});

	// click handler
	React.useEffect(() => {
		return subscribeToCanvasMouseEvents((mapLoc, event) => {
			if (event.type === "mousedown") {
				setEditorState(prev => ({...prev, mouseDownButton: event.button}));
			} else if (event.type === "mouseup" || event.type === "mouseleave" || event.type === "mouseout") {
				setEditorState(prev => ({...prev, mouseDownButton: -1}));
				return;
			}

			if (editorState.mouseDownButton === -1) {
				return; // only place tiles when mouse is being clicked
			}

			const tileToPlace = editorState.mouseDownButton === 2? // 2 = rightclick = erase. otherwise use selection
				TileType.EMPTY : editorState.selectedTileType; 

			if (tileToPlace === getTileTypeAtLoc(canvasManagerRef.current.mapData, mapLoc)) {
				return;
			}

			updateMapData(canvasManagerRef, placeTile(canvasManagerRef.current.mapData, mapLoc, {
				...editorState,
				selectedTileType: tileToPlace,
			}));
		});
	}, [editorState.mouseDownButton, editorState.hillId, editorState.selectedTileType]);

	return (
		<div className='mapbuilder-container'>

			<MapbuilderSidebar 
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
