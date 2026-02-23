"use client";

import React from 'react';
import Image from 'next/image';
import { DownloadIcon } from 'lucide-react';

import { 
	Button, 
	Input, 
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components';
import { useToast } from '@/hooks/use-toast';
import { type MapData, Symmetry, TileType } from '@/gametypes';
import { SidebarItem } from '@/components/SidebarItem';
import { MapList } from './MapList';
import { OverwriteEditorDialog } from './OverwriteEditorDialog';
import { DeleteMapsDialog } from './DeleteMapsDialog';
import { useMaps } from '@/hooks/useMaps';

type MapbuilderSidebarProps = {
	mapData: MapData;
	setMapData: React.Dispatch<React.SetStateAction<MapData>>;
};

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
	// HILL_CENTER: {
	// 	name: "Hill Center",
	// 	desc: "The center of a hill. No two hill centers may be connected via a bridge of hills.",
	// },
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
        hillId: number;
    }>({
        selectedTileType: TileType.EMPTY,
        erasing: false,
        hillId: 0,
    });

	const {maps, readMap, handleImportMaps, handleSaveMap, handleDeleteMaps} = useMaps();
	const [selectedMaps, setSelectedMaps] = React.useState<Set<string>>(new Set());
	const [deleteMapsDialogOpen, setDeleteMapsDialogOpen] = React.useState(false);
	const [askingToLoadMapToEditor, setAskingToLoadMapToEditor] = React.useState<string | null>(null);

	const handleLoadMapToEditor = React.useCallback(async (mapName: string) => {
		const res = await readMap(mapName);
		if (res) {
			props.setMapData(res);
		} // else: readMap should handle displaying error
	}, [readMap, props]);

	return (
		<div className='mapbuilder-sidebar'>

			<OverwriteEditorDialog
			askingToLoadMapToEditor={askingToLoadMapToEditor}
			onCancel={() => setAskingToLoadMapToEditor(null)}
			onConfirm={(mapName) => {
				handleLoadMapToEditor(mapName).then(() =>
					setAskingToLoadMapToEditor(null)
				);
			}} />

			<DeleteMapsDialog
			open={deleteMapsDialogOpen}
			nSelectedMaps={selectedMaps.size}
			selectedMaps={selectedMaps}
			onCancel={() => setDeleteMapsDialogOpen(false)}
			onConfirm={() => 
				handleDeleteMaps(selectedMaps).then(() => {
					setDeleteMapsDialogOpen(false);
					setSelectedMaps(new Set());
				})
			} />

			<h2>Map Builder</h2>

			<SidebarItem label={`All Maps (${maps.length})`}>
				<MapList 
				mapList={maps}
				selectedMaps={selectedMaps}
				setSelectedMaps={setSelectedMaps}
				askToLoadMapToEditor={(mapName) => setAskingToLoadMapToEditor(mapName)}
				askToDeleteMaps={() => setDeleteMapsDialogOpen(true)}
				onImportMaps={handleImportMaps} />
			</SidebarItem>

			<SidebarItem label="Build">
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
                {/* HILL ID INPUT - Matches Width/Height style */}
				{editorState.selectedTileType === "HILL" && (
					<div className='flex items-center gap-2 mt-3 pt-3 border-t w-full'>
						<span className='text-sm text-muted-foreground flex-shrink-0'>
							Hill ID:
						</span>
						<Input 
							className='bg-background flex-1' 
							type="number" 
							min={0}
							value={editorState.hillId} 
							onChange={(e) => setEditorState({
								...editorState, 
								hillId: parseInt(e.target.value) || 0
							})} 
						/>
					</div>
				)}
            </SidebarItem>

			<SidebarItem label="Map Settings">
				<div className='flex items-center gap-1'>
				<span className='text-sm text-muted-foreground'>Symmetry:</span>
					<Select onValueChange={(val: keyof typeof Symmetry) => props.setMapData({...props.mapData, symmetry: val})} value={props.mapData.symmetry}>
						<SelectTrigger>
							<SelectValue placeholder="Select symmetry..." />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(Symmetry).map(([k, v]) => (
								<SelectItem key={k} value={k}>{v}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className='flex items-center gap-1'>
					<span className='text-sm text-muted-foreground flex-shrink-0'>Width:</span>
					<Input className='bg-background' type="number" value={props.mapData.width} onChange={(e) => props.setMapData({...props.mapData, width: parseInt(e.target.value)})} />
					&ensp;
					<span className='text-sm text-muted-foreground flex-shrink-0'>Height:</span>
					<Input className='bg-background' type="number" value={props.mapData.height} onChange={(e) => props.setMapData({...props.mapData, height: parseInt(e.target.value)})} />
				</div>

				<div className='flex items-center gap-1'>
					<span className='text-sm text-muted-foreground flex-shrink-0'>Powerup spawn rate:</span>
					<Input className='bg-background' type="number" value={props.mapData.powerupSpawnRate} onChange={(e) => props.setMapData({...props.mapData, powerupSpawnRate: parseInt(e.target.value)})} />
				</div>

				<div className='flex items-center gap-1'>
					<span className='text-sm text-muted-foreground flex-shrink-0'>Powerup spawn #:</span>
					<Input className='bg-background' type="number" value={props.mapData.powerupSpawnNum} onChange={(e) => props.setMapData({...props.mapData, powerupSpawnNum: parseInt(e.target.value)})} />
				</div>

				
			</SidebarItem>

			<hr />
			
			<SidebarItem label="Map Name">
				<Input className='bg-background'
				value={props.mapData.name} 
				onChange={(e) => props.setMapData({...props.mapData, name: e.target.value})} />
			</SidebarItem>

			<SidebarItem label="Save">
				<div className="flex gap-2">
					<Button className='w-1/2' onClick={() => handleSaveMap(props.mapData)}>Save</Button>
					<Button variant='outline' className='w-1/2'><DownloadIcon /> Export</Button>
				</div>
			</SidebarItem>

		</div>
	);
};
