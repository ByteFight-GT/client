"use client";

import React from 'react';
import { Checkbox, GenericPage } from '@/components';
import { SettingsItem } from './components/SettingsItem';

import "./page.css";
import { ErrorBlock, Input } from '@/components';
import { SaveBar } from './components/SaveBar';
import { Settings } from '../../../common/settingsBridge';

type MatchPlayerPageProps = {
	
};

export default function SettingsPage(props: MatchPlayerPageProps) {

	const [frozenSettings, setFrozenSettings] = React.useState<Settings | null>(null);
	const [draftChanges, setDraftChanges] = React.useState<Record<keyof Settings, Settings[keyof Settings]>>({});
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(getSettings, []);

	// > SETTINGS DATA
	function getSettings() {
		window.settings.get().then((settings) => {
			setFrozenSettings(settings);
			setError(null);
		}).catch((err: any) => {
			console.error("Error loading settings: ", err);
			setError(err.message || 'Failed to load settings!');
		});
	}

	function saveSettings() {
		console.log("Saving settings: ", draftChanges);
		window.settings.set(draftSettings)
		.then(updated => {
			setFrozenSettings(updated); 
			setDraftChanges({}); 
			console.log("Settings saved successfully: ", updated);
		})
		.catch(err => { console.error("Error saving settings: ", err) });
	}

	function updateSetting(name: string, value: any) {
		if (value === frozenSettings?.[name]?.value) {
			// if value is same as frozen, just remove from draft changes (if it exists)
			const { [name]: _, ...rest } = draftChanges;
			setDraftChanges(rest);
		} else {
			// otherwise, add/update in draft changes
			setDraftChanges(prev => ({ ...prev, [name]: value }));
		}
	}

	const draftSettings = React.useMemo(() => {
		const updatedSettings = {...frozenSettings};
		for (const [key, value] of Object.entries(draftChanges)) {
			updatedSettings[key] = {
				...updatedSettings[key],
				value
			};
		}
		return updatedSettings;
	}, [frozenSettings, draftChanges]);


	// ctrl+s keyboard shortcut for saving
	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 's') {
				console.log("Ctrl+S pressed, draft changes: ", draftChanges);
				e.preventDefault();
				if (Object.keys(draftChanges).length > 0) {
					saveSettings();
				}
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [draftChanges]);

	return (
		<GenericPage className='flex flex-col pb-8' titleEle={<span className='text-primary leading-normal'>Config</span>} variant="thin">

				{error?
					<ErrorBlock />
				:
					<div className='settings-list'>
						{Object.keys(draftSettings || {}).length > 0?
							Object.entries(draftSettings).map(([key, setting]) => (
								<SettingsItem 
								key={key} 
								name={key} 
								desc={setting.__desc}
								unsaved={key in draftChanges}>
									{setting.__type === "string"?
										<Input className='w-64' placeholder={setting.__placeholder} value={setting.value} onChange={(e) => {
											updateSetting(key, e.target.value);
										}} />
									: setting.__type === "toggle"?
										<Checkbox checked={setting.value} onCheckedChange={(checked) => {
											updateSetting(key, checked);
										}} />
									: setting.__type === "select"?
										<select value={setting.value} onChange={(e) => {
											updateSetting(key, e.target.value);
										}}>
											{setting.options?.map((option: any) => (
												<option key={option.value} value={option.value}>{option.label}</option>
											))}
										</select>
									: null}
								</SettingsItem>
							))
						: <p className='text-center text-muted-foreground'>Loading config...</p>}
						<SaveBar 
						nUnsavedChanges={Object.keys(draftChanges).length}
						saveChanges={saveSettings} 
						discardChanges={() => setDraftChanges({})} />
					</div>
				}
					
		</GenericPage>
	);
};
