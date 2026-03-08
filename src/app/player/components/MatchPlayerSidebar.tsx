"use client";

import React from 'react';
import { CurrentMatchTab } from './tabs/CurrentMatchTab';
import { RunMatchTab } from './tabs/RunMatchTab';
import { QueueTab } from './tabs/QueueTab';
import { ListIcon, PlayIcon, SwordsIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export const MATCHPLAYER_SIDEBAR_TABS = {
  currentMatch: {
    label: <><SwordsIcon /> Match</>,
    component: CurrentMatchTab
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

  const [currTab, setCurrTab] = React.useState<keyof typeof MATCHPLAYER_SIDEBAR_TABS>(
    // TEMP - we would like to use url params to set an initial but nextjs thing
    // requires Suspense wrapper and were tryna deploy rn so removing for now
    ('runner') as keyof typeof MATCHPLAYER_SIDEBAR_TABS
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
