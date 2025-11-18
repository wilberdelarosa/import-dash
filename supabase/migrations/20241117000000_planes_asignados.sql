-- Tabla para planes de mantenimiento asignados a equipos
CREATE TABLE IF NOT EXISTS public.planes_asignados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación con equipo
  equipo_ficha TEXT NOT NULL REFERENCES public.equipos(ficha) ON DELETE CASCADE,
  
  -- Relación con plan e intervalo
  plan_id UUID REFERENCES public.maintenance_plans(id) ON DELETE CASCADE,
  intervalo_codigo TEXT NOT NULL, -- PM1, PM2, PM3, PM4, etc.
  
  -- Asignación y responsabilidad
  tecnico_responsable TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'vencido')),
  
  -- Configuración de alertas
  horas_alerta INTEGER NOT NULL DEFAULT 50, -- Avisar cuando falten X horas
  alerta_activada BOOLEAN DEFAULT FALSE,
  fecha_ultima_alerta TIMESTAMPTZ,
  
  -- Información de mantenimiento
  horas_actuales DECIMAL(10, 1),
  proximo_mantenimiento DECIMAL(10, 1),
  
  -- Auditoría
  fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_inicio TIMESTAMPTZ,
  fecha_completado TIMESTAMPTZ,
  fecha_vencimiento TIMESTAMPTZ,
  
  -- Observaciones
  notas TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_planes_asignados_equipo ON public.planes_asignados(equipo_ficha);
CREATE INDEX IF NOT EXISTS idx_planes_asignados_plan ON public.planes_asignados(plan_id);
CREATE INDEX IF NOT EXISTS idx_planes_asignados_tecnico ON public.planes_asignados(tecnico_responsable);
CREATE INDEX IF NOT EXISTS idx_planes_asignados_estado ON public.planes_asignados(estado);
CREATE INDEX IF NOT EXISTS idx_planes_asignados_alerta ON public.planes_asignados(alerta_activada, estado);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_planes_asignados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Auto-actualizar estado basado en horas
  IF NEW.horas_actuales IS NOT NULL AND NEW.proximo_mantenimiento IS NOT NULL THEN
    IF NEW.horas_actuales >= NEW.proximo_mantenimiento THEN
      NEW.estado = 'vencido';
      NEW.fecha_vencimiento = now();
    ELSIF NEW.estado = 'pendiente' AND (NEW.proximo_mantenimiento - NEW.horas_actuales) <= NEW.horas_alerta THEN
      NEW.alerta_activada = TRUE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_planes_asignados_updated_at
  BEFORE UPDATE ON public.planes_asignados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_planes_asignados_updated_at();

-- Vista para consultas rápidas con información completa
CREATE OR REPLACE VIEW public.planes_asignados_detallados AS
SELECT 
  pa.*,
  e.nombre AS equipo_nombre,
  e.modelo AS equipo_modelo,
  e.marca AS equipo_marca,
  e.categoria AS equipo_categoria,
  mp.nombre AS plan_nombre,
  mp.modelo AS plan_modelo,
  (pa.proximo_mantenimiento - pa.horas_actuales) AS horas_restantes,
  CASE 
    WHEN pa.estado = 'vencido' THEN 0
    WHEN (pa.proximo_mantenimiento - pa.horas_actuales) <= 0 THEN 0
    WHEN (pa.proximo_mantenimiento - pa.horas_actuales) <= pa.horas_alerta THEN 1
    WHEN (pa.proximo_mantenimiento - pa.horas_actuales) <= 100 THEN 2
    ELSE 3
  END AS prioridad -- 0: Vencido, 1: Urgente, 2: Alerta, 3: Normal
FROM public.planes_asignados pa
LEFT JOIN public.equipos e ON pa.equipo_ficha = e.ficha
LEFT JOIN public.maintenance_plans mp ON pa.plan_id = mp.id;

-- Función para activar alertas automáticas
CREATE OR REPLACE FUNCTION public.activar_alertas_mantenimiento()
RETURNS void AS $$
BEGIN
  UPDATE public.planes_asignados
  SET alerta_activada = TRUE,
      fecha_ultima_alerta = now()
  WHERE estado = 'pendiente'
    AND horas_actuales IS NOT NULL
    AND proximo_mantenimiento IS NOT NULL
    AND (proximo_mantenimiento - horas_actuales) <= horas_alerta
    AND (alerta_activada = FALSE OR fecha_ultima_alerta IS NULL OR fecha_ultima_alerta < now() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE public.planes_asignados IS 'Planes de mantenimiento asignados a equipos con técnico responsable y alertas configurables';
COMMENT ON COLUMN public.planes_asignados.intervalo_codigo IS 'Código del intervalo de mantenimiento (PM1, PM2, PM3, PM4, etc.)';
COMMENT ON COLUMN public.planes_asignados.horas_alerta IS 'Número de horas antes del mantenimiento para activar alerta';
COMMENT ON COLUMN public.planes_asignados.alerta_activada IS 'Indica si la alerta ha sido activada para este mantenimiento';
COMMENT ON VIEW public.planes_asignados_detallados IS 'Vista con información completa de planes asignados incluyendo datos del equipo y plan';
