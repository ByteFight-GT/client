type ValueType<T> = T[keyof T];

export const TileType = {
	EMPTY: 'EMPTY',
	WALL: 'WALL',
	HILL: 'HILL',
	BLUE_SPAWN: 'BLUE_SPAWN',
	GREEN_SPAWN: 'GREEN_SPAWN',
} as const;

export type MapLoc = {r: number; c: number};

export const Symmetry = {
	Horizontal: 'Horizontal',
	Vertical: 'Vertical',
	Origin: 'Origin',
} as const;
export type Symmetry_t = ValueType<typeof Symmetry>;

export type PowerupSpawn = {
	loc: MapLoc;
	round: number;
}

export type PaintMatrix = number[][];

export type BeaconOwner = "P1" | "P2" | null;

export type BeaconMatrix = BeaconOwner[][];

export type PowerupCellState = {
	hasHealth: boolean;
	hasStamina: boolean;
};

export type PowerupMatrix = PowerupCellState[][];

export type GameRenderState = {
	p1Loc: MapLoc;
	p2Loc: MapLoc;
	paint: PaintMatrix;
	beacons: BeaconMatrix;
	powerups: PowerupMatrix;
};

export const GameActionName = {
	MOVE: 'Move',
	PAINT: 'Paint'
} as const;
export type GameActionName_t = ValueType<typeof GameActionName>;

export const Dir = {
	UP: 'UP',
	DOWN: 'DOWN',
	LEFT: 'LEFT',
	RIGHT: 'RIGHT'
} as const;
export type Dir_t = ValueType<typeof Dir>;

export const MoveType = {
	REGULAR: 'REGULAR',
	BEACON_TRAVEL: 'BEACON_TRAVEL'
} as const;
export type MoveType_t = ValueType<typeof MoveType>;

/** represents actions taken during a turn in the game. Note that player isnt specified. */
export type GameTurn = 
	"NONE" 
	| {
		name: GameActionName_t;
		direction: Dir_t;
		move_type: MoveType_t;
		place_beacon: boolean;
		beacon_target: [number, number];
	} | {
		name: GameActionName_t;
		location: MapLoc;
	};

/** Game PGN format (all data about a match) */
export type GamePGN = {
	p1_bid: number; // stamina bid
	p2_bid: number; // stamina bid

	p1_time_left: number[]; // seconds left, on each turn
	p2_time_left: number[]; // seconds left, on each turn

	p1_loc: MapLoc[]; // position at end of each turn
	p2_loc: MapLoc[]; // position at end of each turn

	p1_stamina: number[]; // stamina at end of each turn
	p2_stamina: number[]; // stamina at end of each turn

	p1_max_stamina: number[]; // max stamina at end of each turn
	p2_max_stamina: number[]; // max stamina at end of each turn

	p1_territory: number[]; // # of tiles painted at end of each turn
	p2_territory: number[]; // # of tiles painted at end of each turn

	parity_playing: number[]; // which player was playing on each turn. We have this because one can spend stamina to take multiple turns in a row. +/-1 = p1/p2

	paint_updates: {[key: `${number}`]: number}[]; // array of { FLATTENED tile : +- 1 }, +/- 1 means player 1/2 painted tile (or removed paint from tile)

	beacon_updates: {[key: `${number}`]: number}[]; // array of { FLATTENED tile : +-1 }, +/- 1 means player 1/2 placed beacon

	powerup_updates: {[key: `${number}`]: boolean}[]; // array of { FLATTENED tile : boolean }, true=powerup spawned, false=powerup despawned/was consumed.

	hill_mapping: number[][]; // 2d matrix. similar values indicate cells are part of the same hill.

	walls: boolean[][]; // 2d binary matrix, true = wall, false = no wall

	actions: GameTurn[]; // array of actions taken by players on each turn. Player is determined by indexing parity_playing

	turn_count: number; // total number of turns in the game
	
	result: "PLAYER_1" | "PLAYER_2" // no draws
	
	reason: string; // reason for match end

	p1_err?: string; // if p1 lost by bot error/crash

	p2_err?: string; // if p2 lost by bot error/crash

	p1_commentary?: string; // optional notes (publicly visible commentary) from p1

	p2_commentary?: string; // optional notes (publicly visible commentary) from p2

	map_string: string // string representation of the map played on for this game

	engine_version: string; // version of the game engine used to run this match

	cpu: string; // cpu info of how the game was run
}
/**
 * Represents all data about a map.
 * Map features like hills, walls, spawnpoints, etc. are all specified
 * No computation necessary
 */
export type MapData = {
	size: MapLoc; // r, c (height, width)
	hillLocs: {
		[hillId: string]: MapLoc[];
	};
	wallLocs: MapLoc[];
	spawnpointBlue: MapLoc;
	spawnpointGreen: MapLoc;
	symmetry: Symmetry_t;
	powerupSpawnInterval: number;
	powerupSpawnNum: number;
}