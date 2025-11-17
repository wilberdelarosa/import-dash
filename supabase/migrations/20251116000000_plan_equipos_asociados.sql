-- Agregar campo para marcas asociadas en planes_mantenimiento
ALTER TABLE public.planes_mantenimiento
ADD COLUMN IF NOT EXISTS marcas_asociadas TEXT[];

-- Crear tabla para equipos asociados manualmente a planes
CREATE TABLE IF NOT EXISTS public.plan_equipos_manuales (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES public.planes_mantenimiento(id) ON DELETE CASCADE,
  equipo_ficha TEXT NOT NULL,
  agregado_manualmente BOOLEAN DEFAULT true,
  excluido BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, equipo_ficha)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_plan_equipos_manuales_plan ON public.plan_equipos_manuales(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_equipos_manuales_ficha ON public.plan_equipos_manuales(equipo_ficha);
CREATE INDEX IF NOT EXISTS idx_planes_marcas_asociadas ON public.planes_mantenimiento USING GIN (marcas_asociadas);

-- Políticas de seguridad para plan_equipos_manuales
ALTER TABLE public.plan_equipos_manuales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura pública de equipos manuales" 
  ON public.plan_equipos_manuales FOR SELECT 
  USING (true);

CREATE POLICY "Permitir inserción pública de equipos manuales" 
  ON public.plan_equipos_manuales FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de equipos manuales" 
  ON public.plan_equipos_manuales FOR UPDATE 
  USING (true);

CREATE POLICY "Permitir eliminación pública de equipos manuales" 
  ON public.plan_equipos_manuales FOR DELETE 
  USING (true);

-- Comentarios para documentación
COMMENT ON TABLE public.plan_equipos_manuales IS 'Equipos agregados o excluidos manualmente de planes de mantenimiento';
COMMENT ON COLUMN public.plan_equipos_manuales.agregado_manualmente IS 'true = equipo agregado manualmente, false = equipo automático pero marcado';
COMMENT ON COLUMN public.plan_equipos_manuales.excluido IS 'true = equipo excluido del plan, false = equipo incluido';
COMMENT ON COLUMN public.planes_mantenimiento.marcas_asociadas IS 'Array de marcas adicionales que usa este plan además de la marca principal';
