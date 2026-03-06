// TEMPORARY FOR NOW.
// convert maps between the string representation on engine, and the json representation on frontend

import type { MapData, GamePGNDiff } from './types.ts';

/**
 * Converts mapData to the map string used by the client.
 */
export function stringFromMapData(mapData: MapData): string {
  // 1. Generate Wall String (Flattened grid of 1s and 0s)
  const wallBinary: string[] = [];
  for (const wallLoc of mapData.wallLocs) {
    const flattenedRC = wallLoc[0] * mapData.size[1] + wallLoc[1];
    wallBinary[flattenedRC] = "1";
  }
  // fill rest with 0s
  for (let i = 0; i < mapData.size[0] * mapData.size[1]; i++) {
    if (!wallBinary[i]) {
      wallBinary[i] = "0";
    }
  }
  const wallStr = wallBinary.join(",");


  // 2. Generate Hill IDs and Hill Coordinate Sets
  const hillIds: string[] = [];
  const hillCoords: string[] = [];

  Object.entries(mapData.hillLocs).forEach(([id, cells]) => {
    hillIds.push(id);
    const coords = cells.map(loc => `${loc[0]},${loc[1]}`).join(",");
    hillCoords.push(coords);
  });

  const hillIdStr = hillIds.join(",");
  const hillStr = hillCoords.join("_");


  // 3. Format the generation parameters
  const paramsStr = `${mapData.powerupSpawnInterval},${mapData.powerupSpawnNum},${mapData.symmetry}`;


  // 4. Assemble final components using '#' delimiter
  const components = [
    `${mapData.size[0]},${mapData.size[1]}`, // size
    `${mapData.spawnpointBlue[0]},${mapData.spawnpointBlue[1]}`, // p1 start
    `${mapData.spawnpointGreen[0]},${mapData.spawnpointGreen[1]}`, // p2 start
    wallStr,                                                   // walls
    hillIdStr,                                                 // hill ids
    hillStr,                                                   // hill cells
    "0",                                                       // 0 indicates parameters are used instead of a list
    paramsStr                                                  // e.g., "5,2,Origin"
  ];

  return components.join("#");
}
