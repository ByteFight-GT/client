import React from 'react';

enum TileType {
	EMPTY,
	WALL,
	HILL,
	SPAWNPOINT,
}

enum SymmetryType {
	X,
	Y,
	ROTATIONAL,
}

type BoardLocation = {
	x: number;
	y: number;
}

type UseStateSetter<T> = React.Dispatch<React.SetStateAction<T>>;
type MapbuilderContextValue = {
	selectedTileType: TileType;
	setSelectedTileType: UseStateSetter<TileType>;
	
	mapWidth: number;
	mapHeight: number;
	setMapWidth: UseStateSetter<number>;
	setMapHeight: UseStateSetter<number>;

	symmetry: SymmetryType;
	setSymmetry: UseStateSetter<SymmetryType>;

	mapName: string;
	setMapName: UseStateSetter<string>;

	spawnpointLocation: BoardLocation; // stores green's spawn location. blue spawn determined by sym.
	setSpawnpointLocation: UseStateSetter<BoardLocation>;

	wallLocations: BoardLocation[]; // stores the location clicked on. Otherside determined by sym.
	setWallLocations: UseStateSetter<BoardLocation[]>;

	hillLocations: BoardLocation[]; // stores the location clicked on. Otherside determined by sym.
	setHillLocations: UseStateSetter<BoardLocation[]>;

	powerupRate: number;
	powerupNum: number;
	setPowerupRate: UseStateSetter<number>;
	setPowerupNum: UseStateSetter<number>;
}


const MapbuilderContext = React.createContext<MapbuilderContextValue | undefined>(undefined);

export function useMapbuilderContext() {
	const context = React.useContext(MapbuilderContext);
	if (!context) {
		throw new Error('useMapbuilderContext must be used within a MapbuilderContextProvider');
	}
	return context;
}

type MapbuilderContextProviderProps = {
	children: React.ReactNode;
};
export function MapbuilderContextProvider(props: MapbuilderContextProviderProps) {
	
	return (
		<MapbuilderContext.Provider value={{}}>
			{props.children}
		</MapbuilderContext.Provider>
	);
}