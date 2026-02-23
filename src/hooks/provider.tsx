"use client";

import React from 'react';
import { BotsProvider } from './useBots';
import { MapsProvider } from './useMaps';
import { SettingsProvider } from './useSettings';
import { MatchesProvider } from './useMatches';
import { LoadingsProvider } from './loadingsContext';

/**
 * Combined provider that wraps all app-wide state providers.
 * Use this at the toplevel of the app, then everything should be able to access states n stuff
 */
export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  // keep LoadingsProvider on top cuz other things depend on its value.
  // also might wanna do settings next cuz other things might depend on settings (eg. maps/bots dir)
  return (
    <LoadingsProvider>
      <SettingsProvider>
        <BotsProvider>
          <MapsProvider>
            <MatchesProvider>
              {children}
            </MatchesProvider>
          </MapsProvider>
        </BotsProvider>
      </SettingsProvider>
    </LoadingsProvider>
  );
};
