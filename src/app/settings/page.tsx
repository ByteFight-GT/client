"use client";

import React from 'react';
import { GenericPage } from '@/components';
import { SettingsItem } from './components/SettingsItem';

import "./page.css";
import { ErrorBlock, Input } from '@/components';
import { SaveBar } from './components/SaveBar';

type MatchPlayerPageProps = {
	
};

export default function SettingsPage(props: MatchPlayerPageProps) {

	const [draftSettings, setDraftSettings] = React.useState<any[] | null>(null);
	const [frozenSettings, setFrozenSettings] = React.useState<any[] | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(getSettings, []);

	function getSettings() {
		window.settings.get().then((settings) => {
			setFrozenSettings(settings);
			setDraftSettings(settings);
			setError(null);
		}).catch((err: any) => {
			setError(err.message || 'Failed to load settings!');
		});
	}

	function saveSettings() {
		window.settings.set(draftSettings).catch((err: any) => {
			console.error("Error saving settings: ", err);
			alert("Failed to save settings: " + err.message);
		});
	}

	function updateSetting(name: string, value: any) {
		setDraftSettings(prevSettings => prevSettings?.map(s => s.name === name ? { ...s, value } : s) || null);
	}
	
	return (
		<GenericPage className='flex flex-col pb-8' titleEle={<span className='text-primary'>/Config</span>} variant="thin">

				{error?
					<ErrorBlock />
				:
					<div className='settings-list'>
						{draftSettings && draftSettings.length > 0?
							draftSettings.map(setting => (
								<SettingsItem key={setting.name} name={setting.name} desc={setting.desc}>
									{setting.__type === "string"?
										<Input placeholder={setting.__placeholder} value={setting.value} onChange={(e) => {
											updateSetting(setting.name, e.target.value);
										}} />
									: setting.__type === "toggle"?
										<Input type="checkbox" checked={setting.value} onChange={(e) => {
											updateSetting(setting.name, e.target.checked);
										}} />
									: setting.__type === "select"?
										<select value={setting.value} onChange={(e) => {
											updateSetting(setting.name, e.target.value);
										}}>
											{setting.options?.map((option: any) => (
												<option key={option.value} value={option.value}>{option.label}</option>
											))}
										</select>
									: null}
								</SettingsItem>
							))
						: <p className='text-center text-muted-foreground'>No config options yet!</p>}
						<SaveBar hasUnsavedChanges={false} saveSettings={saveSettings} restoreSettings={getSettings} />
					</div>
				}
					
		</GenericPage>
	);
};
