"use client";

import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components';
import { type MapData, Symmetry, TileType } from '@/gametypes';
import React from 'react';
import { MapbuilderSidebarItem } from './MapbuilderSidebarItem';
import Image from 'next/image';
import { DownloadIcon } from 'lucide-react';

type MapbuilderSidebarProps = {
	mapData: MapData;
	setMapData: React.Dispatch<React.SetStateAction<MapData>>;
};

const NEW_MAP_VALUE = "__new"; // no way someone names their map this right???
const TILE_TYPE_DESCS = {
	EMPTY: {
		name: "Empty",
		desc: "Use to erase map features. You can also right click on tiles to erase, or hover and press delete!",
	},
	WALL: {
		name: "Wall",
		desc: "Blocks movement and cannot be painted on.",
	},
	HILL: {
		name: "Hill",
		desc: "Hill description",
	},
	HILL_CENTER: {
		name: "Hill Center",
		desc: "The center of a hill. No two hill centers may be connected via a bridge of hills.",
	},
	BLUE_SPAWN: {
		name: "Blue Spawn",
		desc: "The location where the blue player spawns at the start of the game. Green's spawn will be determined symmetrically when this is placed!",
	},
	GREEN_SPAWN: {
		name: "Green Spawn",
		desc: "The location where the green player spawns at the start of the game. Blue's spawn will be determined symmetrically when this is placed!",
	},
}

export const MapbuilderSidebar = (props: MapbuilderSidebarProps) => {

	const [editorState, setEditorState] = React.useState<{
		selectedTileType: keyof typeof TileType;
		erasing: boolean;
	}>({
		selectedTileType: TileType.EMPTY,
		erasing: false,
	});

	const [editingExistingMap, setEditingExistingMap] = React.useState<string | null>(null);
	const [existingMaps, setExistingMaps] = React.useState<string[]>(["Example Map 1", "Example Map 2"]);
	// TODO - fetch existing maps from electron

	return (
		<div className='mapbuilder-sidebar'>
			<h2>Map Builder</h2>

			<MapbuilderSidebarItem label="Load Existing Map">
				<div className='flex gap-2'>
					<Select onValueChange={val => setEditingExistingMap(val === NEW_MAP_VALUE? null : val)}>
						<SelectTrigger>
							<SelectValue className={editingExistingMap === null? 'text-muted-foreground' : ''} placeholder="Edit existing..." />
						</SelectTrigger>
						<SelectContent>
							<SelectItem className='text-muted-foreground' value={NEW_MAP_VALUE}>(Create new...)</SelectItem>
							{existingMaps.map((mapName) => (
								<SelectItem key={mapName} value={mapName}>{mapName}</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Input type="file" accept=".json" className='mapbuilder-file-input' onChange={(e) => {
						console.log(e.target.files);
					}} />
				</div>
			</MapbuilderSidebarItem>

			<MapbuilderSidebarItem label="Build">
				<div className='mapbuilder-sidebar-selected-tile'>
					<Image className='w-24 h-24' src={`/mapbuilder/${editorState.selectedTileType}.png`} alt={editorState.selectedTileType} width={96} height={96} />
					<div>
						<h4 className='text-sm'>{TILE_TYPE_DESCS[editorState.selectedTileType].name}</h4>
						<p className='text-muted-foreground text-xs'>{TILE_TYPE_DESCS[editorState.selectedTileType].desc}</p>
					</div>
				</div>
				<div className='mapbuilder-sidebar-tile-select'>
					{Object.keys(TileType).map(k => (
						<div 
						key={k} 
						className={`mapbuilder-tile-option ${editorState.selectedTileType === k? 'selected' : ''}`}
						onClick={() => setEditorState({...editorState, selectedTileType: k as keyof typeof TileType})}>
							<Image src={`/mapbuilder/${k}.png`} alt={k} width={64} height={64} />
						</div>
					))}
				</div>
			</MapbuilderSidebarItem>

			<MapbuilderSidebarItem label="Symmetry">
				<Select onValueChange={(val: keyof typeof Symmetry) => props.setMapData({...props.mapData, symmetry: val})} value={props.mapData.symmetry}>
					<SelectTrigger>
						<SelectValue className={editingExistingMap === null? 'text-muted-foreground' : ''} placeholder="Edit existing..." />
					</SelectTrigger>
					<SelectContent>
						{Object.entries(Symmetry).map(([k, v]) => (
							<SelectItem key={k} value={k}>{v}</SelectItem>
						))}
					</SelectContent>
				</Select>
			</MapbuilderSidebarItem>

			<MapbuilderSidebarItem label="Map Size">
				<div className='flex items-center gap-1'>
					<span className='text-sm text-muted-foreground'>X:</span>
					<Input type="number" value={props.mapData.width} onChange={(e) => props.setMapData({...props.mapData, width: parseInt(e.target.value)})} />
					&ensp;
					<span className='text-sm text-muted-foreground'>Y:</span>
					<Input type="number" value={props.mapData.height} onChange={(e) => props.setMapData({...props.mapData, height: parseInt(e.target.value)})} />
				</div>
			</MapbuilderSidebarItem>


			<hr />
			
			<MapbuilderSidebarItem label="Map Name">
				<Input value={props.mapData.name} onChange={(e) => props.setMapData({...props.mapData, name: e.target.value})} />
			</MapbuilderSidebarItem>

			<MapbuilderSidebarItem label="Save">
				<div className="flex gap-2">
					<Button className='w-1/2'>Save</Button>
					<Button variant='secondary' className='w-1/2'><DownloadIcon /> Download...</Button>
				</div>
			</MapbuilderSidebarItem>

		</div>
	);
};
