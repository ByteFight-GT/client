"use client";

import { useAppState } from '@/app/useAppState';
import { Button, Checkbox } from '@/components';
import Link from 'next/link';
import React from 'react';

type MapListProps = {
	selectedMaps: Set<string>;
	setSelectedMaps: React.Dispatch<React.SetStateAction<Set<string>>>;
};

export const MapList = (props: MapListProps) => {

	const { maps, handleImportMaps } = useAppState();

	function handleSelectMany(select: boolean) {
		if (select) {
			props.setSelectedMaps(new Set(maps));
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
			<div className='matchplayer-map-list'>
				{maps.length?
					maps.map(mapName => (
						<div 
						key={mapName} 
						className={`matchplayer-map-list-item ${props.selectedMaps.has(mapName)? "selected" : ""}`}
						onClick={() => setMapSelected(mapName, !props.selectedMaps.has(mapName))}>
							
							<Checkbox
							checked={props.selectedMaps.has(mapName)}
							onClick={e => e.stopPropagation()}
							onCheckedChange={(checked) => {
								// why tf is there an indeterminate state??????????????????????????????? lol
								setMapSelected(mapName, checked === "indeterminate"? true : checked);
							}} />

							{mapName}
						</div>
					)) : (
						<div className='text-sm text-center text-muted-foreground'>
							No maps... <Link href="/mapbuilder" className='underline'>Make some!</Link>
						</div>
					)
				}
			</div>

			<div className='flex gap-2'>
				<Button 
				variant="outline"
				onClick={() => handleSelectMany(true)}>
					+ All
				</Button>
				<Button 
				variant="outline"
				onClick={() => handleSelectMany(false)}>
					- None
				</Button>
				<Button 
				variant="outline"
				className="flex-grow"
				onClick={handleImportMaps}>
					Import Maps
				</Button>
			</div>
		</div>
	);
};
