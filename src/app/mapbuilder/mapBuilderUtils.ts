import { TileType } from '../../../common/types';
import type { TileType_t, MapLoc, MapDataOptionalSpawnpts, Symmetry_t, MapData } from '../../../common/types';
import { applySymmetry, arrayEq1D } from '../../../common/utils';
import { toastError } from '@/hooks/useToast';
import { MapBuilderEditorState } from './page';

import _DEFAULT_MAP_DATA from '../../gamerenderer/defaults/DEFAULT_MAP_DATA.json';
const DEFAULT_MAP_DATA = _DEFAULT_MAP_DATA as unknown as MapData;
import { clamp } from '@/gamerenderer/utils';
import { CanvasManager } from '@/gamerenderer/CanvasManager';

export const MIN_MAP_SIZE = 5;
export const MAX_MAP_SIZE = 32;

/** returns a new MapData after changing the tiletype at loc based on whats selected in editorState. */
export function placeTile(
	mapData: MapDataOptionalSpawnpts, 
	loc: MapLoc, 
	editorState: MapBuilderEditorState,
): MapDataOptionalSpawnpts {
	
	// make copy and check everything to see if we needa clear it first
	const newMapData = {...mapData};
	const symmetricLoc = applySymmetry(loc, mapData.size, mapData.symmetry);

	// disallow placing spawnpoints at a place where its symmetricLoc is the same (center of odd maps)
	if (
		(editorState.selectedTileType === TileType.BLUE_SPAWN || editorState.selectedTileType === TileType.GREEN_SPAWN)
		&& arrayEq1D(loc, symmetricLoc)
	) {
		toastError(
			"Invalid spawnpoint location",
			"Spawnpoints cannot be placed where their symmetric counterpart is the same tile. Please select a different location.",
		);
		return mapData; // do nothing cuz illegal operation
	}
	
	// all tiles shouldnt be cleared except the clicked one and its symmetric counterpart (if different)
	// HOWEVER - if the symmetric counterpart turns out to be a hill then dont delete since hills arent symmetric,
	// UNLESS we are placing something symmetry-obeying (spawnpoints & walls) since those DO need a matching counterpart
	
	const shouldntBeCleared =
		getTileTypeAtLoc(mapData, symmetricLoc).tileType === TileType.HILL &&
		(editorState.selectedTileType === TileType.EMPTY || editorState.selectedTileType === TileType.HILL)?
		(tile: MapLoc) => !arrayEq1D(tile, loc)
	:
		(tile: MapLoc) => !arrayEq1D(tile, loc) && !arrayEq1D(tile, symmetricLoc);

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

export function getTileTypeAtLoc(mapData: MapDataOptionalSpawnpts, loc: MapLoc): {
	tileType: TileType_t,
	hillId: number | null,
} {
	if (mapData.spawnpointBlue && arrayEq1D(mapData.spawnpointBlue, loc)) {
		return { tileType: TileType.BLUE_SPAWN, hillId: null };
	}
	if (mapData.spawnpointGreen && arrayEq1D(mapData.spawnpointGreen, loc)) {
		return { tileType: TileType.GREEN_SPAWN, hillId: null };
	}

	if (mapData.wallLocs.some(wall => arrayEq1D(wall, loc))) {
		return { tileType: TileType.WALL, hillId: null };
	}

	for (const hillId in mapData.hillLocs) {
		if (mapData.hillLocs[hillId].some(hillLoc => arrayEq1D(hillLoc, loc))) {
			return { tileType: TileType.HILL, hillId: parseInt(hillId) };
		}
	}

	return { tileType: TileType.EMPTY, hillId: null };
}

/** Note: blue spawn will always be at (1,1) for empty maps. */
export function getEmptyMapWithSizeAndSym(size: MapLoc, symmetry: Symmetry_t): MapDataOptionalSpawnpts {
	// start off with default
	const newMapData = structuredClone(DEFAULT_MAP_DATA);
	newMapData.size = size;
	newMapData.symmetry = symmetry;
	newMapData.spawnpointGreen = applySymmetry(newMapData.spawnpointBlue, size, symmetry);

	return newMapData;
}

export function mapSizeAllowed(attempt: MapLoc) {
	return (
		clamp(attempt[0], MIN_MAP_SIZE, MAX_MAP_SIZE) === attempt[0] 
		&& clamp(attempt[1], MIN_MAP_SIZE, MAX_MAP_SIZE) === attempt[1]	
	)
}

export function updateMapData(canvasManagerRef: React.RefObject<CanvasManager>, newMapData: MapDataOptionalSpawnpts) {
	canvasManagerRef.current.mapData = newMapData;
	canvasManagerRef.current.blitMap();
}