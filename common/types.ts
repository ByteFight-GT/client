export type Settings = Record<string, {
	value: any;
	[key: `__${string}`]: any; // for __type, __desc, __placeholder, other meta stuff.
}>; 

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

/**
 * Stores gamestate data corresponding to a player during the game, like their stamina, paint, etc.
 */
type PlayerGameState_t = {
	totalPaint: number; // sum of all # of layers of paint on all tiles
	uniquePaintedCells: number; // # of UNIQUE tiles painted (ignores multi-layered)
	
	stamina: number;
	maxStamina: number;
	
	controlledHills: Set<number>;
	
	beaconCount: number;
}

export type Team_t = 'blue' | 'green';

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
	HILL_CENTER: 'HILL_CENTER',
	BLUE_SPAWN: 'BLUE_SPAWN',
	GREEN_SPAWN: 'GREEN_SPAWN',
} as const;

export type MatchStatus = 'queued' | 'in-progress' | 'terminated' | 'completed';

/**
 * All information about a match (which can have multiple games),
 * except for the actual game data (like gamestates, moves, etc.).
 *
 * can also be used to represent queued or in-progress matches.
 */
export type MatchMetadata = {
	matchId: string;
	queuedTimestamp: number; // when the match entered the queue
	startTimestamp: number | null; // start time of first game
	finishTimestamp: number | null; // end time of last game or termination
	notes: string; // user-written notes for their reference!

	maps: string[]; // names of maps played (or to play)

	resultFiles: string[]; // filepaths to pgns for each game. SAME ORDER AS maps array!

	teamGreen: string; // green bot name
	teamBlue: string; // blue bot name
	greenWins: {map: string, reason: string, numRounds: number}[];
	blueWins: {map: string, reason: string, numRounds: number}[];

	status: MatchStatus;
}

