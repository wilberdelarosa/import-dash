import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SupabaseDataProvider } from "@/context/SupabaseDataContext";
import { SystemConfigProvider } from "@/context/SystemConfigContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

// Lazy load pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Equipos = lazy(() => import("./pages/Equipos"));
const ControlMantenimiento = lazy(() => import("./pages/ControlMantenimientoProfesional"));
const Inventario = lazy(() => import("./pages/Inventario"));
const Mantenimiento = lazy(() => import("./pages/Mantenimiento"));
const PlanesMantenimiento = lazy(() => import("./pages/PlanesMantenimiento"));
const KitsMantenimiento = lazy(() => import("./pages/KitsMantenimiento"));
const PlanificadorInteligente = lazy(() => import("./pages/PlanificadorInteligente"));
const Historial = lazy(() => import("./pages/Historial"));
const Reportes = lazy(() => import("./pages/Reportes"));
const Configuraciones = lazy(() => import("./pages/Configuraciones"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AsistenteIA = lazy(() => import("./pages/AsistenteIA"));
const ListasPersonalizadas = lazy(() => import("./pages/ListasPersonalizadas"));
const ImportarDatosCaterpillar = lazy(() => import("./pages/ImportarDatosCaterpillar"));
const Auth = lazy(() => import("./pages/Auth"));
const NotificacionesPage = lazy(() => import("./pages/Notificaciones"));
const GestorTickets = lazy(() => import("./pages/GestorTickets"));

// Mechanic pages - with device detection routers
const MechanicDashboardRouter = lazy(() => import("./pages/MechanicModule").then(m => ({ default: m.MechanicDashboardRouter })));
const MechanicPendingListRouter = lazy(() => import("./pages/MechanicModule").then(m => ({ default: m.MechanicPendingListRouter })));
const MechanicSubmissionFormRouter = lazy(() => import("./pages/MechanicModule").then(m => ({ default: m.MechanicSubmissionFormRouter })));
const MechanicHistoryRouter = lazy(() => import("./pages/MechanicModule").then(m => ({ default: m.MechanicHistoryRouter })));

// Supervisor pages - with device detection routers
const SupervisorDashboardRouter = lazy(() => import("./pages/SupervisorModule").then(m => ({ default: m.SupervisorDashboardRouter })));
const SupervisorSubmissionsRouter = lazy(() => import("./pages/SupervisorModule").then(m => ({ default: m.SupervisorSubmissionsRouter })));

// Admin pages
const Admin = lazy(() => import("./pages/Admin"));

// QueryClient for data fetching
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
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/equipos" element={<ProtectedRoute><Equipos /></ProtectedRoute>} />
                  <Route path="/control-mantenimiento" element={<ProtectedRoute><ControlMantenimiento /></ProtectedRoute>} />
                  <Route path="/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
                  <Route path="/mantenimiento" element={<ProtectedRoute><Mantenimiento /></ProtectedRoute>} />
                  <Route path="/planes-mantenimiento" element={<ProtectedRoute><PlanesMantenimiento /></ProtectedRoute>} />
                  <Route path="/kits-mantenimiento" element={<ProtectedRoute><KitsMantenimiento /></ProtectedRoute>} />
                  <Route path="/planificador-inteligente" element={<ProtectedRoute><PlanificadorInteligente /></ProtectedRoute>} />
                  <Route path="/historial" element={<ProtectedRoute><Historial /></ProtectedRoute>} />
                  <Route path="/reportes" element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
                  <Route path="/configuraciones" element={<ProtectedRoute><Configuraciones /></ProtectedRoute>} />
                  <Route path="/asistente" element={<ProtectedRoute><AsistenteIA /></ProtectedRoute>} />
                  <Route path="/listas-personalizadas" element={<ProtectedRoute><ListasPersonalizadas /></ProtectedRoute>} />
                  <Route path="/importar-caterpillar" element={<ProtectedRoute><ImportarDatosCaterpillar /></ProtectedRoute>} />
                  <Route path="/notificaciones" element={<ProtectedRoute><NotificacionesPage /></ProtectedRoute>} />
                  <Route path="/tickets" element={<ProtectedRoute><GestorTickets /></ProtectedRoute>} />

                  {/* Mechanic routes */}
                  <Route path="/mechanic" element={<ProtectedRoute><MechanicDashboardRouter /></ProtectedRoute>} />
                  <Route path="/mechanic/pendientes" element={<ProtectedRoute><MechanicPendingListRouter /></ProtectedRoute>} />
                  <Route path="/mechanic/reportar" element={<ProtectedRoute><MechanicSubmissionFormRouter /></ProtectedRoute>} />
                  <Route path="/mechanic/reportar/:ficha" element={<ProtectedRoute><MechanicSubmissionFormRouter /></ProtectedRoute>} />
                  <Route path="/mechanic/historial" element={<ProtectedRoute><MechanicHistoryRouter /></ProtectedRoute>} />
                  <Route path="/mechanic/historial/:id" element={<ProtectedRoute><MechanicHistoryRouter /></ProtectedRoute>} />

                  {/* Supervisor routes */}
                  <Route path="/supervisor" element={<ProtectedRoute><SupervisorDashboardRouter /></ProtectedRoute>} />
                  <Route path="/supervisor/reportes" element={<ProtectedRoute><SupervisorSubmissionsRouter /></ProtectedRoute>} />
                  <Route path="/supervisor/submissions" element={<ProtectedRoute><SupervisorSubmissionsRouter /></ProtectedRoute>} />

                  {/* Admin routes */}
                  <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                  <Route path="/admin/usuarios" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                  <Route path="/admin/submissions" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </SupabaseDataProvider>
        </SystemConfigProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
