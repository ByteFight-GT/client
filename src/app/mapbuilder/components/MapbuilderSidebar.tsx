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

	const { toast } = useToast();

	const [editorState, setEditorState] = React.useState<{
		selectedTileType: keyof typeof TileType;
		erasing: boolean;
	}>({
		selectedTileType: TileType.EMPTY,
		erasing: false,
	});

	// TODO - use context lol.
	const [mapList, setMapList] = React.useState<string[]>([]);
	const [selectedMaps, setSelectedMaps] = React.useState<Set<string>>(new Set());
	const [deleteMapsDialogOpen, setDeleteMapsDialogOpen] = React.useState(false);
	const [askingToLoadMapToEditor, setAskingToLoadMapToEditor] = React.useState<string | null>(null);

	// initial fetch of maps list
	React.useEffect(() => {
		window.electron.invoke('maps:list').then(res => {
			if (res.success) {
				setMapList(res.maps);
			} else {
				toast({
					title: "Failed to load maps",
					description: res.error,
				});
			}
		});
	}, []);

	async function handleDeleteMaps() {
		const res = await window.electron.invoke('maps:delete', Array.from(selectedMaps))
		if (res.success) {
			setMapList(prev => {
				return prev.filter(mapName => !res.deleted.includes(mapName));
			});
			setSelectedMaps(new Set());
		} else {
			toast({
				title: "Failed to delete maps",
				description: res.error,
			});
			setSelectedMaps(prev => {
				const newSelected = new Set(prev);
				for (const mapName of res.deleted) {
					newSelected.delete(mapName);
				}				
				return newSelected;
			});
		}
	}

	async function handleLoadMapToEditor(mapName: string) {
		const res = await window.electron.invoke('maps:read', mapName);
		if (res.success) {
			props.setMapData(JSON.parse(res.mapData));
			setAskingToLoadMapToEditor(null);
		} else {
			toast({
				title: "Failed to load map",
				description: res.error,
			});
		}
	}

	function handleSaveMap() {
		window.electron.invoke('maps:write', props.mapData.name, JSON.stringify(props.mapData, null, 2)).then(res => {
			if (res.success) {
				toast({
					title: "Map Saved",
					description: `Successfully saved map "${props.mapData.name}"`,
				});
				if (!mapList.includes(props.mapData.name)) {
					setMapList(prev => [...prev, props.mapData.name]);
				}
			} else {
				toast({
					title: "Failed to save map",
					description: res.error,
				});
			}
		});
	}

	function handleImportMaps(mapNames: string[]) {
		if (mapNames.length > 0) {
			// can just blindly add because electron wont overwrite dupes
			// ^ (altho maybe we can add handling for this (popup) in the future?)
			setMapList(prev => [...prev, ...mapNames]);
			toast({
				title: "Maps Imported",
				description: `Successfully imported ${mapNames.length} map(s)!`,
			});
		}
	}

	return (
		<div className='mapbuilder-sidebar'>

			<OverwriteEditorDialog
			askingToLoadMapToEditor={askingToLoadMapToEditor}
			onCancel={() => setAskingToLoadMapToEditor(null)}
			onConfirm={(mapName) => {
				setAskingToLoadMapToEditor(null);
				handleLoadMapToEditor(mapName)
			}} />

			<DeleteMapsDialog
			open={deleteMapsDialogOpen}
			nSelectedMaps={selectedMaps.size}
			selectedMaps={selectedMaps}
			onCancel={() => setDeleteMapsDialogOpen(false)}
			onConfirm={() => handleDeleteMaps().then(() => setDeleteMapsDialogOpen(false))} />

			<h2>Map Builder</h2>

			<SidebarItem label="All Maps">
				<MapList 
				mapList={mapList}
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
			</SidebarItem>

			<SidebarItem label="Symmetry">
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
			</SidebarItem>

			<SidebarItem label="Map Size">
				<div className='flex items-center gap-1'>
					<span className='text-sm text-muted-foreground'>X:</span>
					<Input type="number" value={props.mapData.width} onChange={(e) => props.setMapData({...props.mapData, width: parseInt(e.target.value)})} />
					&ensp;
					<span className='text-sm text-muted-foreground'>Y:</span>
					<Input type="number" value={props.mapData.height} onChange={(e) => props.setMapData({...props.mapData, height: parseInt(e.target.value)})} />
				</div>
			</SidebarItem>

			<hr />
			
			<SidebarItem label="Map Name">
				<Input 
				value={props.mapData.name} 
				onChange={(e) => props.setMapData({...props.mapData, name: e.target.value})} />
			</SidebarItem>

			<SidebarItem label="Save">
				<div className="flex gap-2">
					<Button className='w-1/2' onClick={handleSaveMap}>Save</Button>
					<Button variant='secondary' className='w-1/2'><DownloadIcon /> Export</Button>
				</div>
			</SidebarItem>

		</div>
	);
};
