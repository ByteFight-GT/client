'use client';

import React from 'react';
import { MapData, PlayerGameState } from '@/gametypes';

type PlayerContextType = {
  gameStates: PlayerGameState[];
  mapData: MapData | null;
  setGameStates: React.Dispatch<React.SetStateAction<PlayerGameState[]>>;
  setMapData: React.Dispatch<React.SetStateAction<MapData | null>>;
};

const PlayerContext = React.createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [matchInfo, setMatchInfo] = React.useState(null);
  const [gameStates, setGameStates] = React.useState<PlayerGameState[]>([]);
  const [mapData, setMapData] = React.useState<MapData | null>(null);

	const value = {
		gameStates,
    mapData,
    setGameStates,
    setMapData
	} as const;

	return (
		<PlayerContext.Provider value={value}>
			{children}
		</PlayerContext.Provider>
	);
};


export const usePlayerContext = (): PlayerContextType => {
	const context = React.useContext(PlayerContext);
	if (context === undefined) {
		throw new Error("PlayerContext must be used within a PlayerProvider");
	}
	return context;
};
