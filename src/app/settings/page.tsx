"use client";

import React from 'react';
import { 
	Button, 
	ErrorBlock, 
	Input, 
	Checkbox, 
	GenericPage, 
	Select, 
	SelectItem, 
	SelectContent, 
	SelectTrigger, 
	SelectValue
} from '@/components';
import { SettingsItem } from './components/SettingsItem';

import "./page.css";
import { SaveBar } from './components/SaveBar';
import { Settings } from '../../../common/types';
import { FolderOpenIcon, ExternalLinkIcon } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';


export default function SettingsPage() {

	const {settings, saveSettings, openExplorerChooser, openAppRelativePathInExplorer} = useSettings();

	const [draftChanges, setDraftChanges] = React.useState<Record<keyof Settings, Settings[keyof Settings]>>({});

	function updateSetting(name: string, value: any) {
		if (value === settings?.[name]?.value) {
			// if value is same as frozen, just remove from draft changes (if it exists)
			const { [name]: _, ...rest } = draftChanges;
			setDraftChanges(rest);
		} else {
			// otherwise, add/update in draft changes
			setDraftChanges(prev => ({ ...prev, [name]: value }));
		}
	}

	const draftSettings = React.useMemo(() => {
		const updatedSettings = {...settings};
		for (const [key, value] of Object.entries(draftChanges)) {
			updatedSettings[key] = {
				...updatedSettings[key],
				value
			};
		}
		return updatedSettings;
	}, [settings, draftChanges]);


	const handleSaveSettings = React.useCallback(async () => {
		if (Object.keys(draftChanges).length > 0) {
			const success = await saveSettings(draftSettings);
			if (success) {
				setDraftChanges({});
			}
		}
	}, [draftSettings]);

	// ctrl+s keyboard shortcut for saving
	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 's') {
				e.preventDefault();
				handleSaveSettings();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleSaveSettings]);

	return (
		<GenericPage className='relative flex flex-col pb-8' titleEle={<span className='text-primary leading-normal'>Config</span>} variant="thin">
			<div className='settings-list'>
				{Object.keys(draftSettings || {}).length > 0?
					Object.entries(draftSettings).map(([key, setting]) => (
						<React.Fragment key={key}>
							<SettingsItem 
							name={key} 
							desc={setting.__desc}
							unsaved={key in draftChanges}>
								{setting.__type === "string"?
								<div className="flex gap-2">
									<Input className='w-64' placeholder={setting.__placeholder} value={setting.value} onChange={(e) => {
										updateSetting(key, e.target.value);
									}} />
									{setting.__showExplorerOptions &&
										<>
											<Button variant="secondary" size="iconsm" onClick={async () => {
												const selectedPath = await openExplorerChooser();
												if (selectedPath) updateSetting(key, selectedPath);
											}}>
												<FolderOpenIcon />
											</Button>
											<Button variant="secondary" size="iconsm" onClick={() => {
												openAppRelativePathInExplorer(setting.value);
											}}>
												<ExternalLinkIcon />
											</Button>
										</>
									}
								</div>
								: setting.__type === "toggle"?
									<Checkbox checked={setting.value} onCheckedChange={(checked) => {
										updateSetting(key, checked);
									}} />
								: setting.__type === "select"?
									<Select value={setting.value} onValueChange={(value) => updateSetting(key, value)}>
										<SelectTrigger className='w-48'>
											<SelectValue placeholder={setting.__placeholder} />
										</SelectTrigger>
										<SelectContent>
											{setting.__options?.map((option: any) => (
												<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
											))}
										</SelectContent>
									</Select>
								: null}
							</SettingsItem>
							{setting.__addSeparatorBelow && <hr className='my-4' />}
						</React.Fragment>
					))
				: <p className='text-center text-muted-foreground'>Loading config...</p>}
			</div>
			<SaveBar 
			nUnsavedChanges={Object.keys(draftChanges).length}
			saveChanges={handleSaveSettings} 
			discardChanges={() => setDraftChanges({})} />
		</GenericPage>
	);
};
