/**
 * Stores gamestate data corresponding to a player during the game, like their stamina, paint, etc.
 */
export type PlayerGameState = {
	totalPaint: number; // sum of all # of layers of paint on all tiles
	uniquePaintedCells: number; // # of UNIQUE tiles painted (ignores multi-layered)
	
	stamina: number;
	maxStamina: number;
	
	controlledHills: Set<number>;
	
	beaconCount: number;
}

type PlayerColor_t = 'blue' | 'green';

export type MapLoc = {
	x: number;
	y: number;
}

export const Symmetry = {
	X: 'X',
	Y: 'Y',
	XY: 'XY',
} as const;

export type PowerupSpawn = {
	loc: MapLoc;
	round: number;
}

export const TileType = {
	EMPTY: 'EMPTY',
	WALL: 'WALL',
	HILL: 'HILL',
	// HILL_CENTER: 'HILL_CENTER',
	BLUE_SPAWN: 'BLUE_SPAWN',
	GREEN_SPAWN: 'GREEN_SPAWN',
} as const;

/**
 * Represents all data about a map.
 * Map features like hills, walls, spawnpoints, etc. are only guarnateed to be specified
 * for at least one side - for the other, use symmetry to compute.
 */
export type MapData = {
	name: string;
	width: number;
	height: number;
	hillCenters: MapLoc[];
	wallLocs: MapLoc[];
	spawnpointGreen: MapLoc;
	symmetry: keyof typeof Symmetry;
	healthPowerupSpawns: PowerupSpawn[];
	staminaPowerupSpawns: PowerupSpawn[];
}
