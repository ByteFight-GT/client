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
  const wallStr = wallBinary.join("");


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

/**
 * Parses the client map string format back into MapData.
 */
export function mapDataFromString(mapString: string): MapData {
  const components = mapString.split("#");
  if (components.length !== 8) {
    throw new Error(`Invalid map string: expected 8 components, got ${components.length}`);
  }

  const [sizeStr, blueSpawnStr, greenSpawnStr, wallStr, hillIdStr, hillStr, _spawnListFlag, paramsStr] = components;

  const parseLoc = (locStr: string): [number, number] => {
    const [rStr, cStr] = locStr.split(",");
    const r = Number(rStr);
    const c = Number(cStr);
    if (!Number.isFinite(r) || !Number.isFinite(c)) {
      throw new Error(`Invalid location: ${locStr}`);
    }
    return [r, c];
  };

  const size = parseLoc(sizeStr);
  const spawnpointBlue = parseLoc(blueSpawnStr);
  const spawnpointGreen = parseLoc(greenSpawnStr);

  const wallLocs: [number, number][] = [];
  for (let i = 0; i < wallStr.length; i++) {
    if (wallStr.charAt(i) === "1") {
      wallLocs.push([Math.floor(i / size[1]), i % size[1]]);
    }
  }

  const hillIds = hillIdStr.length > 0 ? hillIdStr.split(",") : [];
  const hillCoordGroups = hillStr.length > 0 ? hillStr.split("_") : [];
  if (hillIds.length !== hillCoordGroups.length) {
    throw new Error(`Invalid hill data: ${hillIds.length} ids but ${hillCoordGroups.length} coord groups`);
  }

  const hillLocs: MapData["hillLocs"] = {};
  for (let i = 0; i < hillIds.length; i++) {
    const hillId = hillIds[i];
    const coords = hillCoordGroups[i];

    const coordTokens = coords.length > 0 ? coords.split(",") : [];
    if (coordTokens.length % 2 !== 0) {
      throw new Error(`Invalid hill coordinates for hill ${hillId}`);
    }

    const cells: [number, number][] = [];
    for (let j = 0; j < coordTokens.length; j += 2) {
      const r = Number(coordTokens[j]);
      const c = Number(coordTokens[j + 1]);
      if (!Number.isFinite(r) || !Number.isFinite(c)) {
        throw new Error(`Invalid hill coordinate in hill ${hillId}`);
      }
      cells.push([r, c]);
    }
    hillLocs[hillId] = cells;
  }

  const [intervalStr, numStr, symmetryStr] = paramsStr.split(",");
  const powerupSpawnInterval = Number(intervalStr);
  const powerupSpawnNum = Number(numStr);
  if (!Number.isFinite(powerupSpawnInterval) || !Number.isFinite(powerupSpawnNum) || !symmetryStr) {
    throw new Error("Invalid map parameters");
  }

  return {
    size,
    hillLocs,
    wallLocs,
    spawnpointBlue,
    spawnpointGreen,
    symmetry: symmetryStr as MapData["symmetry"],
    powerupSpawnInterval,
    powerupSpawnNum,
  };
}

/*
// TESTS
import mapStrings from '../engine/config/maps.json';

Object.values(mapStrings).forEach((mapStr, idx) => {
  try {
    const mapData = mapDataFromString(mapStr);
    const regeneratedMapStr = stringFromMapData(mapData);
    if (mapStr !== regeneratedMapStr) {
      console.error(`Test failed for map ${idx}: regenerated string does not match original`);
      console.log(`Original:   ${mapStr}`);
      console.log(`Regenerated:${regeneratedMapStr}`);
    } else {
      console.log(`Test passed for map ${idx}`);
    }
  } catch (e) {
    console.error(`Test failed for map ${idx}: error during parsing or regeneration`);
    console.error(e);
  }
});
*/

/*
// script to convert map strings in maps.json to map data objects and save them to resources/default-maps
import fs from 'fs';
import path from 'path';
import mapStrings from '../engine/config/maps.json';

Object.entries(mapStrings).forEach(([mapName, mapStr]) => {
  try {
    const mapData = mapDataFromString(mapStr);
    const outputPath = path.join(__dirname, '../resources/default-maps', `${mapName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(mapData, null, 2));
    console.log(`Successfully parsed and saved map ${mapName}`);
  } catch (e) {
    console.error(`Error parsing map ${mapName}:`, e);
  }
});
*/