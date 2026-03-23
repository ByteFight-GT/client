// looks in engine/config/maps.json and converts all the map strings in that object
// into client-formatted map json files using common/mapconvert.ts:mapDataFromString

import fs from "fs";
import path from "path";

import { mapDataFromString } from "../common/mapconvert";

import ENGINE_MAP_STRINGS from "../engine/config/maps.json";
const OUTPUT_DIR = path.join(__dirname, "../resources/default-maps");

async function main() {
	if (!fs.existsSync(OUTPUT_DIR)) {
		fs.mkdirSync(OUTPUT_DIR);
	}

	for (const [mapName, mapString] of Object.entries(ENGINE_MAP_STRINGS)) {
		const mapData = mapDataFromString(mapString);
		const outputPath = path.join(OUTPUT_DIR, `${mapName}.json`);
		fs.writeFileSync(outputPath, JSON.stringify(mapData, null, 2));
		console.log(`converted \x1b[33m${mapName}\x1b[0m -> \x1b[32m${outputPath}\x1b[0m`);
	}
}

main().catch((err) => {
	console.error("Error generating default maps:", err);
	process.exit(1);
});