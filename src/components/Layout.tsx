import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const { migrateFromLocalStorage } = useSupabaseData();
  const { toast } = useToast();

  const handleMigrate = async () => {
    await migrateFromLocalStorage();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">Sistema de Gestión de Equipos</h1>
              <p className="text-muted-foreground">{title}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleMigrate} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Migrar desde LocalStorage
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
