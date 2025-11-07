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
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <SystemConfigProvider>
          <SupabaseDataProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/equipos" element={<ProtectedRoute><Equipos /></ProtectedRoute>} />
                <Route path="/control-mantenimiento" element={<ProtectedRoute><ControlMantenimiento /></ProtectedRoute>} />
                <Route path="/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
                <Route path="/mantenimiento" element={<ProtectedRoute><Mantenimiento /></ProtectedRoute>} />
                <Route path="/historial" element={<ProtectedRoute><Historial /></ProtectedRoute>} />
                <Route path="/reportes" element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
                <Route path="/configuraciones" element={<ProtectedRoute><Configuraciones /></ProtectedRoute>} />
                <Route path="/asistente" element={<ProtectedRoute><AsistenteIA /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </SupabaseDataProvider>
        </SystemConfigProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
