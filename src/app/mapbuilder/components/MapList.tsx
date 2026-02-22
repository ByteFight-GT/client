"use client";

import { Button, Checkbox } from '@/components';
import { ArrowRightIcon } from 'lucide-react';
import React from 'react';

type MapListProps = {
	mapList: string[];
	selectedMaps: Set<string>;
	setSelectedMaps: React.Dispatch<React.SetStateAction<Set<string>>>;
	askToLoadMapToEditor: (mapName: string) => void;
	askToDeleteMaps: () => void;
	onImportMaps: (mapNames: string[]) => void;
};

export const MapList = (props: MapListProps) => {

	const [deletionLoading, setDeletionLoading] = React.useState(false);

	function handleImportMaps() {
		window.electron.invoke('maps:import').then(props.onImportMaps);
	}

	function handleSelectMany(select: boolean) {
		if (select) {
			props.setSelectedMaps(new Set(props.mapList));
		} else {
			props.setSelectedMaps(new Set());
		}
	}

	const setMapSelected = (mapName: string, newSelected: boolean) => {
		const newSelectedMaps = new Set(props.selectedMaps);
		if (newSelected) {
			newSelectedMaps.add(mapName);
		} else {
			newSelectedMaps.delete(mapName);
		}
		props.setSelectedMaps(newSelectedMaps);
	};

	return (
		<div className='flex flex-col gap-2'>
			<div className='mapbuilder-map-list'>
				{props.mapList.length?
					props.mapList.map(mapName => (
						<div 
						key={mapName} 
						className='mapbuilder-map-list-item' 
						onClick={() => setMapSelected(mapName, !props.selectedMaps.has(mapName))}
						onDoubleClick={() => props.askToLoadMapToEditor(mapName)}>
							
							<Checkbox
							checked={props.selectedMaps.has(mapName)}
							onClick={e => e.stopPropagation()}
							onCheckedChange={(checked) => {
								// why tf is there an indeterminate state??????????????????????????????? lol
								setMapSelected(mapName, checked === "indeterminate"? true : checked);
							}} />

							{mapName}

							<Button 
							className='ml-auto' 
							variant="secondary" 
							size="sm" 
							onClick={e => {
								e.stopPropagation();
								props.askToLoadMapToEditor(mapName);
							}}>
								Load <ArrowRightIcon />
							</Button> 
						</div>
					)) : (
						<div className='text-sm text-center text-muted-foreground'>
							No maps... So empty...
						</div>
					)
				}
			</div>

			<Button 
			variant="secondary"
			className="flex-grow"
			onClick={handleImportMaps}>
				Import Maps
			</Button>

			<div className='flex gap-2'>
				<Button 
				variant="secondary"
				onClick={() => handleSelectMany(true)}>
					+ All
				</Button>
				<Button 
				variant="secondary"
				onClick={() => handleSelectMany(false)}>
					- None
				</Button>
				<Button
				variant="destructive"
				className='w-full'
				disabled={props.selectedMaps.size === 0 || deletionLoading}
				onClick={props.askToDeleteMaps}>
					Delete Selected
				</Button>
			</div>
		</div>
	);
};
