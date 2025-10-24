import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Equipos from "./pages/Equipos";
import ControlMantenimiento from "./pages/ControlMantenimiento";
import Inventario from "./pages/Inventario";
import Mantenimiento from "./pages/Mantenimiento";
import Historial from "./pages/Historial";
import Reportes from "./pages/Reportes";
import Configuraciones from "./pages/Configuraciones";
import NotFound from "./pages/NotFound";
import AsistenteIA from "./pages/AsistenteIA";
import { SupabaseDataProvider } from "@/context/SupabaseDataContext";
import { SystemConfigProvider } from "@/context/SystemConfigContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SystemConfigProvider>
        <SupabaseDataProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/equipos" element={<Equipos />} />
              <Route path="/control-mantenimiento" element={<ControlMantenimiento />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/mantenimiento" element={<Mantenimiento />} />
              <Route path="/historial" element={<Historial />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/configuraciones" element={<Configuraciones />} />
              <Route path="/asistente" element={<AsistenteIA />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SupabaseDataProvider>
      </SystemConfigProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
