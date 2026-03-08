"use client";

import React from 'react';
import { MatchInfoTab } from './MatchInfoTab';
import { RunMatchTab } from './RunMatchTab';
import { QueueTab } from './QueueTab';
import { ListIcon, PlayIcon, SwordsIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export const MATCHPLAYER_SIDEBAR_TABS = {
  matchInfo: {
    label: <><SwordsIcon /> Match</>,
    component: MatchInfoTab
  },
  runner: {
    label: <><PlayIcon /> Run</>,
    component: RunMatchTab
  },
  queue: {
    label: <><ListIcon /> Queue</>,
    component: QueueTab
  }
} as const;
export type MatchPlayerTabProps = {
  switchTab: (tab: keyof typeof MATCHPLAYER_SIDEBAR_TABS) => void;
};
  
export const MatchPlayerSidebar = () => {

  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');

  console.log("initialTab:", initialTab);

  const [currTab, setCurrTab] = React.useState<keyof typeof MATCHPLAYER_SIDEBAR_TABS>(
    (initialTab && initialTab in MATCHPLAYER_SIDEBAR_TABS ? initialTab : 'runner') as keyof typeof MATCHPLAYER_SIDEBAR_TABS
  );

  // which thing torender
  const ActiveTabComponent = React.useMemo(
    () => MATCHPLAYER_SIDEBAR_TABS[currTab].component,
    [currTab]
  );

  return (
    <div className='matchplayer-sidebar'>
      <div className='matchplayer-sidebar-tabs'>
        {Object.entries(MATCHPLAYER_SIDEBAR_TABS).map(([key, { label }]) => (
          <button 
          key={key}
          className={`matchplayer-sidebar-tab ${currTab === key? 'selected' : ''}`}
          onClick={() => setCurrTab(key as keyof typeof MATCHPLAYER_SIDEBAR_TABS)}>
            {label}
          </button>
        ))}
      </div>
      <ActiveTabComponent switchTab={setCurrTab} />
    </div>
  );
};
