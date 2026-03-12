"use client";

import React from 'react';
import Image from 'next/image';
import { DownloadIcon } from 'lucide-react';

import { 
	Button, 
	Input, 
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components';
import { SidebarItem } from '@/components/SidebarItem';
import { MapData, MapLoc, Symmetry, Symmetry_t, TileType, TileType_t } from '../../../../common/types';
import { useMaps } from '@/hooks/useMaps';
import { OverwriteEditorDialog } from './OverwriteEditorDialog';
import { DeleteMapsDialog } from './DeleteMapsDialog';
import { MapList } from './MapList';
import { MapBuilderEditorState } from '../page';
import { SwitchSymmetryDialog } from './SwitchSymmetryDialog';
import { ChangeMapSizeDialog } from './ChangeMapSizeDialog';
import { toastError } from '@/hooks/useToast';

import { getEmptyMapWithSizeAndSym, mapSizeAllowed, MAX_MAP_SIZE, MIN_MAP_SIZE, updateMapData } from '../mapBuilderUtils';
import { arrayEq1D } from '../../../../common/utils';
import { ClearMapDialog } from './ClearMapDialog';
import { useVisualizer } from '@/gamerenderer/useVisualizer';

const TILE_TYPE_DESCS = {
	EMPTY: {
		name: "Empty",
		desc: "Use to erase map features. You can also right click on tiles to erase!",
	},
	WALL: {
		name: "Wall",
		desc: "Blocks all movement and cannot be painted on.",
	},
	HILL: {
		name: "Hill",
		desc: "Hills are the primary objectives of the game. Hills will also belong to distinct ID groups.",
	},
	BLUE_SPAWN: {
		name: "Blue Spawn",
		desc: "Blue's Location at game start. Green's spawn will be determined symmetrically when this is placed.",
	},
	GREEN_SPAWN: {
		name: "Green Spawn",
		desc: "Green's Location at game start. Blue's spawn will be determined symmetrically when this is placed.",
	},
}

type MapbuilderSidebarProps = {
	editorState: MapBuilderEditorState,
	setEditorState: React.Dispatch<React.SetStateAction<MapBuilderEditorState>>;
	mapSizeDraft: MapLoc;
	setMapSizeDraft: React.Dispatch<React.SetStateAction<MapLoc>>;
};
export const MapbuilderSidebar = (props: MapbuilderSidebarProps) => {
	const {maps, readMap, handleSaveMap, handleDeleteMaps} = useMaps();
	const [selectedMaps, setSelectedMaps] = React.useState<Set<string>>(new Set());

	const {canvasManagerRef} = useVisualizer();

	const [mapSaveName, setMapSaveName] = React.useState('');

	// stuff for all the dialogs
	const [deleteMapsDialogOpen, setDeleteMapsDialogOpen] = React.useState(false);
	const [changeSizeDialogOpen, setChangeSizeDialogOpen] = React.useState(false);
	const [clearMapDialogOpen, setClearMapDialogOpen] = React.useState(false);
	const [askingToLoadMapToEditor, setAskingToLoadMapToEditor] = React.useState<string | null>(null);
	const [askingToSwitchSymmetryTo, setAskingToSwitchSymmetryTo] = React.useState<Symmetry_t | null>(null);

	// need to be loaded on init but using value={} doesnt work cuz canvasmanager ref doesnt trigger rerender
	const powerupIntervalRef = React.useRef<HTMLInputElement>(null);
	const powerupNumRef = React.useRef<HTMLInputElement>(null);
	React.useEffect(() => {
		if (powerupIntervalRef.current) {
			powerupIntervalRef.current.value = canvasManagerRef.current.mapData.powerupSpawnInterval.toString();
		}
		if (powerupNumRef.current) {
			powerupNumRef.current.value = canvasManagerRef.current.mapData.powerupSpawnNum.toString();
		}
	}, [canvasManagerRef.current.mapData]);


	const handleLoadMapToEditor = React.useCallback(async (mapName: string) => {
		const res = await readMap(mapName);
		if (res) {
			updateMapData(canvasManagerRef, res);
			props.setMapSizeDraft(res.size);
		} // else: readMap should handle displaying error
	}, [readMap, canvasManagerRef, props.setMapSizeDraft]);

	const canChangeMapSize = React.useMemo(() => 
		!arrayEq1D(props.mapSizeDraft, canvasManagerRef.current.mapData.size) && mapSizeAllowed(props.mapSizeDraft),
		[props.mapSizeDraft, canvasManagerRef.current.mapData.size]
	);

	const handleMapSizeChangeConfirm = React.useCallback(() => {
		// just one more validation bro... just one more validation...
		if (!mapSizeAllowed(props.mapSizeDraft)) {
			toastError(
				"Invalid map size",
				`Map dimensions must both be between ${MIN_MAP_SIZE} and ${MAX_MAP_SIZE}. No changes made.`,
			);
		} else {
			// reset!
			updateMapData(canvasManagerRef, getEmptyMapWithSizeAndSym(props.mapSizeDraft, canvasManagerRef.current.mapData.symmetry));
		}

		setChangeSizeDialogOpen(false);
	}, [props.mapSizeDraft]);


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

			<SwitchSymmetryDialog
			open={askingToSwitchSymmetryTo !== null}
			onCancel={() => setAskingToSwitchSymmetryTo(null)}
			onConfirm={() => {
				updateMapData(canvasManagerRef, getEmptyMapWithSizeAndSym(canvasManagerRef.current.mapData.size, askingToSwitchSymmetryTo!));
				setAskingToSwitchSymmetryTo(null);
			}} />

			<ChangeMapSizeDialog
			open={changeSizeDialogOpen}
			onCancel={() => setChangeSizeDialogOpen(false)}
			onConfirm={handleMapSizeChangeConfirm} />

			<ClearMapDialog
			open={clearMapDialogOpen}
			onCancel={() => setClearMapDialogOpen(false)}
			onConfirm={() => {
				updateMapData(canvasManagerRef, getEmptyMapWithSizeAndSym(props.mapSizeDraft, canvasManagerRef.current.mapData.symmetry));
				setClearMapDialogOpen(false);
			}} />

			<h2>Map Builder</h2>

			<SidebarItem label={`All Maps (${maps.length})`}>
				<MapList 
				mapList={maps}
				selectedMaps={selectedMaps}
				setSelectedMaps={setSelectedMaps}
				askToLoadMapToEditor={(mapName) => setAskingToLoadMapToEditor(mapName)}
				askToDeleteMaps={() => setDeleteMapsDialogOpen(true)} />
			</SidebarItem>

			<SidebarItem label="Build">
				<div className='mapbuilder-sidebar-selected-tile'>
					<Image className='w-24 h-24' src={`/mapbuilder/${props.editorState.selectedTileType}.png`} alt={props.editorState.selectedTileType} width={96} height={96} />
					<div>
						<h4 className='text-sm'>{TILE_TYPE_DESCS[props.editorState.selectedTileType].name}</h4>
						<p className='text-muted-foreground text-xs'>{TILE_TYPE_DESCS[props.editorState.selectedTileType].desc}</p>
					</div>
				</div>

				<div className='mapbuilder-sidebar-tile-select'>
					{Object.keys(TileType).map(k => (
						<div 
						key={k} 
						className={`mapbuilder-tile-option ${props.editorState.selectedTileType === k? 'selected' : ''}`}
						onClick={() => props.setEditorState({...props.editorState, selectedTileType: k as TileType_t})}>
							<Image src={`/mapbuilder/${k}.png`} alt={k} width={64} height={64} />
						</div>
					))}
				</div>

				{/* HILL ID INPUT - Matches Width/Height style */}
				{props.editorState.selectedTileType === "HILL" && (
					<div className='flex items-center gap-2 mt-3 pt-3 border-t w-full'>
						<span className='text-sm text-muted-foreground flex-shrink-0'>
							Hill ID:
						</span>
						<Input 
							className='bg-background flex-1' 
							type="number" 
							min={0}
							value={props.editorState.hillId} 
							onChange={(e) => props.setEditorState({
								...props.editorState, 
								hillId: parseInt(e.target.value) || 0
							})} 
						/>
					</div>
				)}
			</SidebarItem>

			<SidebarItem label="Map Size">
				<div className='flex items-center gap-1'>
					<span className='text-sm text-muted-foreground flex-shrink-0'>Rows:</span>
					<Input 
					min={0}
					type="number" 
					value={props.mapSizeDraft[0]}
					className='bg-background' 
					onChange={e => props.setMapSizeDraft(prev => ([
						parseInt(e.target.value) || 0,
						prev[1]
					]))} />

					&ensp;

					<span className='text-sm text-muted-foreground flex-shrink-0'>Columns:</span>
					<Input 
					min={0}
					type="number" 
					value={props.mapSizeDraft[1]}
					className='bg-background'
					onChange={(e) => props.setMapSizeDraft(prev => ([
						prev[0],
						parseInt(e.target.value) || 0
					]))} />
				</div>

				<Button 
				variant={canChangeMapSize? 'default' : 'outline'}
				disabled={!canChangeMapSize}
				onClick={() => setChangeSizeDialogOpen(true)}>
					Update Map Size
				</Button>

				<p className={`
					text-xs text-center 
					${mapSizeAllowed(props.mapSizeDraft)? 'text-muted-foreground' : 'text-destructiveBright'}
				`}>
					Map dimensions must be between {MIN_MAP_SIZE} and {MAX_MAP_SIZE}.
				</p>
			</SidebarItem>

			<SidebarItem label="Map Settings">
				<div className='flex items-center gap-1'>
					<span className='text-sm text-muted-foreground'>Symmetry:</span>
					<Select 
					value={canvasManagerRef.current.mapData.symmetry} 
					onValueChange={val => setAskingToSwitchSymmetryTo(val as Symmetry_t)}>
						<SelectTrigger><SelectValue placeholder="Select symmetry..." /></SelectTrigger>
						<SelectContent>
							{Object.entries(Symmetry).map(([k, v]) => (
								<SelectItem key={k} value={k}>{v}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className='flex items-center gap-1'>
					<span className='text-sm text-muted-foreground flex-shrink-0'>Powerup Spawn Interval:</span>
					<Input 
					type="number" 
					className='bg-background'  
					ref={powerupIntervalRef}
					onChange={(e) => { 
						updateMapData(canvasManagerRef, {
							...canvasManagerRef.current.mapData, 
							powerupSpawnInterval: parseInt(e.target.value) || 0
						});
					}} />
				</div>

				<div className='flex items-center gap-1'>
					<span className='text-sm text-muted-foreground flex-shrink-0'>Powerup Spawn Count:</span>
					<Input 
					type="number" 
					className='bg-background' 
					ref={powerupNumRef}
					onChange={(e) => { 
						updateMapData(canvasManagerRef, {
							...canvasManagerRef.current.mapData, 
							powerupSpawnNum: parseInt(e.target.value) || 0
						});
					}} />
				</div>
			</SidebarItem>

			<hr />
			
			<SidebarItem label="Map Name">
				<Input className='bg-background'
				placeholder="Enter save name"
				value={mapSaveName} 
				onChange={(e) => setMapSaveName(e.target.value)} />
			</SidebarItem>

			<SidebarItem label="Save">
				<div className="flex gap-2">

					<Button 
					className='w-1/2'
					disabled={!mapSaveName} 
					onClick={() => {
						let mapDataInvalidReason: string | null = null;
						if (!mapSizeAllowed(canvasManagerRef.current.mapData.size)) {
							mapDataInvalidReason = `Map dimensions must both be between ${MIN_MAP_SIZE} and ${MAX_MAP_SIZE}.`;
						} else if (!canvasManagerRef.current.mapData.spawnpointBlue || !canvasManagerRef.current.mapData.spawnpointGreen) {
							mapDataInvalidReason = "Both spawn points must be placed.";
						}

						if (!mapDataInvalidReason) {
							handleSaveMap(mapSaveName, canvasManagerRef.current.mapData as MapData);
						} else {
							toastError("Map invalid", mapDataInvalidReason);
						}
					}}>
						Save
					</Button>

					<Button variant='outline' className='w-1/2'><DownloadIcon /> Export</Button>

				</div>
			</SidebarItem>

			<Button variant='destructive' onClick={() => setClearMapDialogOpen(true)}>
				Clear Map
			</Button>

		</div>
	);
};
