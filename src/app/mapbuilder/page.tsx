"use client";

import React from 'react';

import './page.css'
import { TileType, type TileType_t, type MapLoc, type MapDataOptionalSpawnpts, type Symmetry_t } from '../../../common/types';
import { MapbuilderSidebar } from './components/MapbuilderSidebar';
import { InitialMapSetupDialog } from './components/InitialMapSetupDialog';
import { GameRenderer } from '@/gamerenderer/GameRenderer';
import { useVisualizer, VisualizerProvider } from '@/gamerenderer/useVisualizer';
import { useMaps } from '@/hooks/useMaps';

import { getEmptyMapWithSizeAndSym, getTileTypeAtLoc, placeTile, updateMapData } from './mapBuilderUtils';
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

	const {canvasManagerRef, subscribeToCanvasMouseEvents, setVisualizerState} = useVisualizer();
	
	// restoring state when coming back from previous sesh
	const {mapbuilderSavedState, setMapbuilderSavedState} = useMaps();
	const shouldCheckForSavedProgress = React.useRef(true);

	// -1 means no button down, 0 = left, 2 = right. (1 = middle but we dont use that)
	const mouseDownButtonRef = React.useRef<number>(-1); 

	const [editorState, setEditorState] = React.useState<MapBuilderEditorState>({
		selectedTileType: TileType.EMPTY,
		hillId: 1,
	});
	const [mapSizeDraft, setMapSizeDraft] = React.useState<MapLoc>(canvasManagerRef.current.mapData.size);

	// show initial setup dialog on first ever visit (no saved state yet)
	const [showInitialSetup, setShowInitialSetup] = React.useState(false);

	// If there is unsaved progress from a previous visit, restore it once on mount.
	// Otherwise, show the initial setup dialog.
	React.useEffect(() => {
		if (!shouldCheckForSavedProgress.current) return;
		shouldCheckForSavedProgress.current = false;

		if (mapbuilderSavedState) {
			setVisualizerState({ mapData: mapbuilderSavedState });
			setMapSizeDraft(mapbuilderSavedState.size);
		} else {
			setShowInitialSetup(true);
		}
	}, [mapbuilderSavedState, setVisualizerState]);

	const handleInitialSetupConfirm = React.useCallback((size: MapLoc, symmetry: Symmetry_t) => {
		const newMapData = getEmptyMapWithSizeAndSym(size, symmetry);
		updateMapData(canvasManagerRef, newMapData);
		setMapSizeDraft(size);
		setShowInitialSetup(false);
	}, [canvasManagerRef]);

	// save progress when unmounting (navving away)
	React.useEffect(() => {
		return () => {
			setMapbuilderSavedState(canvasManagerRef.current.mapData);
		};
	}, [canvasManagerRef, setMapbuilderSavedState]);

	// click handler
	React.useEffect(() => {
		return subscribeToCanvasMouseEvents((mapLoc, event) => {
			if (event.type === "mousedown") {
				if (event.button !== 1) {
					// prevents accidental panning when mouse leaves
					// UNLESS we are middle clicking which is used for panning specifically
					event.stopPropagation();
				}
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

			if (![0, 2].includes(mouseDownButtonRef.current)) {
				return; // only do things on right/left click
			}

			const {tileType, hillId} = getTileTypeAtLoc(canvasManagerRef.current.mapData, mapLoc);

			// button 2 = rightclick = erase
			const tileToPlace = mouseDownButtonRef.current === 2? TileType.EMPTY : editorState.selectedTileType; 

			// dont rerun expensive placing logic if tiles are the same
			// ^ UNLESS: for hills the id might be different bruh, so we gotta check for that
			if (tileToPlace === tileType && (tileType !== TileType.HILL || hillId === editorState.hillId)) {
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

			<InitialMapSetupDialog
			open={showInitialSetup}
			defaultSize={canvasManagerRef.current.mapData.size}
			defaultSymmetry={canvasManagerRef.current.mapData.symmetry}
			onConfirm={handleInitialSetupConfirm}
			onDismiss={() => setShowInitialSetup(false)} />

			<MapbuilderSidebar 
			editorState={editorState} 
			setEditorState={setEditorState}
			mapSizeDraft={mapSizeDraft}
			setMapSizeDraft={setMapSizeDraft} />

			<div className='mapbuilder-gamerenderer'>
				<GameRenderer 
				shouldShowSpawnpoints
				transformComponentProps={{
					wrapperStyle: { 
						width: '100%', 
						height: '100vh',
						backgroundImage: `url(/gamerenderer-bg.webp)`,
						backgroundSize: 'cover',
					},
				}} />
			</div>
		</div>
	);
};
