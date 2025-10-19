import { createContext, useContext, ReactNode } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const SupabaseDataContext = createContext<ReturnType<typeof useSupabaseData> | undefined>(undefined);

interface SupabaseDataProviderProps {
  children: ReactNode;
}

export function SupabaseDataProvider({ children }: SupabaseDataProviderProps) {
  const value = useSupabaseData();

  return (
    <SupabaseDataContext.Provider value={value}>
      {children}
    </SupabaseDataContext.Provider>
  );
}

export function useSupabaseDataContext() {
  const context = useContext(SupabaseDataContext);

  if (!context) {
    throw new Error('useSupabaseDataContext must be used within a SupabaseDataProvider');
  }

  return context;
}
