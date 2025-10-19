import { createContext, useContext, ReactNode } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const SupabaseDataContext = createContext<ReturnType<typeof useSupabaseData> | undefined>(undefined);

interface SupabaseDataProviderProps {
  children: ReactNode;
}

export function SupabaseDataProvider({ children }: SupabaseDataProviderProps) {
  const value = useSupabaseData();

  // Mostrar loader global cuando está migrando
  if (value.isMigrating) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
          <p className="text-lg font-semibold">Migrando datos...</p>
          <p className="text-sm text-muted-foreground">Por favor espera, no cierres esta ventana</p>
        </div>
      </div>
    );
  }

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
