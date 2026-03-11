"use client";

import React from 'react';

import './page.css'
import { TileType, type TileType_t, type MapData, type MapLoc, type MapDataOptionalSpawnpts, type GamePGN } from '../../../common/types';
import { MapbuilderSidebar } from './components/MapbuilderSidebar';
import { GameRenderer } from '@/gamerenderer/GameRenderer';
import { useVisualizer, VisualizerProvider } from '@/gamerenderer/useVisualizer';

import { getTileTypeAtLoc, placeTile, updateMapData } from './mapBuilderUtils';
import { oob } from '../../../common/utils';

export default function MapBuilderPageWrapper() {
	return (
		<VisualizerProvider>
			<MapBuilderPage />
		</VisualizerProvider>
	);
}

export type MapBuilderEditorState = {
	selectedTileType: TileType_t;
	hillId: number;
};

function MapBuilderPage() {

	const {canvasManagerRef, subscribeToCanvasMouseEvents} = useVisualizer();

	// -1 means no button down, 0 = left, 2 = right. (1 = middle but we dont use that)
	const mouseDownButtonRef = React.useRef<number>(-1); 

	const [editorState, setEditorState] = React.useState<MapBuilderEditorState>({
		selectedTileType: TileType.EMPTY,
		hillId: 0,
	});

	// click handler
	React.useEffect(() => {
		return subscribeToCanvasMouseEvents((mapLoc, event) => {
			if (event.type === "mousedown") {
				event.stopPropagation(); // prevents accidental panning when mouse leaves
				mouseDownButtonRef.current = event.button;
			} else if (event.type === "mouseup") {
				mouseDownButtonRef.current = -1;
				return;
			} else if (event.type === "mouseenter") {
				mouseDownButtonRef.current = -1; // reset on enter since we dont know if they let go when outside canvas ;-;
				return;
			}

			if (oob(mapLoc, canvasManagerRef.current.mapData.size)) {
				return;
			}

			if (mouseDownButtonRef.current === -1) {
				return; // only change map when mouse is being clicked
			}

			const tileAtLoc = getTileTypeAtLoc(canvasManagerRef.current.mapData, mapLoc);

			// middle click selects the tile ;)
			if (mouseDownButtonRef.current === 1) {
				setEditorState(prev => ({
					...prev,
					selectedTileType: tileAtLoc,
				}));
				return;
			}

			// actually placing the tile
			const tileToPlace = mouseDownButtonRef.current === 2? // 2 = rightclick = erase. otherwise use selection
				TileType.EMPTY : editorState.selectedTileType; 
			if (tileToPlace === tileAtLoc) {
				return;
			}
			updateMapData(canvasManagerRef, placeTile(canvasManagerRef.current.mapData, mapLoc, {
				...editorState,
				selectedTileType: tileToPlace,
			}));
		});
	}, [editorState]);

	return (
		<div className='mapbuilder-container'>

			<MapbuilderSidebar 
			editorState={editorState} 
			setEditorState={setEditorState} />

			<div className='mapbuilder-gamerenderer'>
				<GameRenderer 
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
