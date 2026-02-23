import React from 'react';

type AsyncLoadingWrapper_t = <F extends (...args: any[]) => Promise<any>>(
  key: string,
  asyncFn: F
) => (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>> | null>;

type LoadingsContextType = {
  /** map of key -> loading state */
  loadings: Record<string, boolean>;

  /** set a loading state. If no value, either toggles or sets to true if the key doesnt exist yet */
  toggleLoading: (key: string, value?: boolean) => void;

  /** wraps an async function with loading state management. Returns null if already loading. */
  asyncLoadingWrapper: AsyncLoadingWrapper_t;
};

const LoadingsContext = React.createContext<LoadingsContextType | undefined>(undefined);

export const LoadingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadings, setLoadings] = React.useState<Record<string, boolean>>({});

  const toggleLoading = React.useCallback((key: string, value?: boolean) => {
    setLoadings(prev => ({
      ...prev,
      [key]: value !== undefined? value : !prev[key], // 
    }));
  }, []);

  const asyncLoadingWrapper: AsyncLoadingWrapper_t = React.useCallback(
    (key, asyncFn) => 
      async function (...args) {
        if (loadings[key]) return null;
        toggleLoading(key, true);
        try {
          return await asyncFn(...args);
        } finally {
          toggleLoading(key, false);
        }
      },
    [loadings, toggleLoading]
  );

  const value = React.useMemo(() => ({
    loadings,
    toggleLoading,
    asyncLoadingWrapper,
  }), [loadings, toggleLoading]);

  return (
    <LoadingsContext.Provider value={value}>
      {children}
    </LoadingsContext.Provider>
  );
}

export const useLoadings = (): LoadingsContextType => {
  const context = React.useContext(LoadingsContext);
  if (!context) {
    throw new Error('useLoadings must be used within a LoadingsProvider');
  }
  return context;
}