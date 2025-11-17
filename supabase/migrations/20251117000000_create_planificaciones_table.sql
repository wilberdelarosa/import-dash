-- Crear tabla para almacenar planificaciones de mantenimiento asignadas
CREATE TABLE IF NOT EXISTS public.planificaciones_mantenimiento (
    id BIGSERIAL PRIMARY KEY,
    fichaEquipo TEXT NOT NULL,
    nombreEquipo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    lecturasActuales INTEGER NOT NULL DEFAULT 0,
    proximoMP TEXT NOT NULL,
    proximasHoras INTEGER NOT NULL DEFAULT 0,
    horasRestantes INTEGER NOT NULL DEFAULT 0,
    planId BIGINT REFERENCES public.planes_mantenimiento(id) ON DELETE CASCADE,
    intervaloId BIGINT REFERENCES public.plan_intervalos(id) ON DELETE CASCADE,
    kitId BIGINT REFERENCES public.kits_mantenimiento(id) ON DELETE SET NULL,
    planNombre TEXT,
    kitNombre TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'programado', 'en_progreso', 'completado')),
    fechaProgramada DATE,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_planificaciones_ficha_equipo ON public.planificaciones_mantenimiento(fichaEquipo);
CREATE INDEX IF NOT EXISTS idx_planificaciones_estado ON public.planificaciones_mantenimiento(estado);
CREATE INDEX IF NOT EXISTS idx_planificaciones_fecha_programada ON public.planificaciones_mantenimiento(fechaProgramada);
CREATE INDEX IF NOT EXISTS idx_planificaciones_plan_id ON public.planificaciones_mantenimiento(planId);
CREATE INDEX IF NOT EXISTS idx_planificaciones_intervalo_id ON public.planificaciones_mantenimiento(intervaloId);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_planificaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_planificaciones_updated_at
    BEFORE UPDATE ON public.planificaciones_mantenimiento
    FOR EACH ROW
    EXECUTE FUNCTION update_planificaciones_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.planificaciones_mantenimiento ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Allow read access to authenticated users"
    ON public.planificaciones_mantenimiento
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para permitir inserción a usuarios autenticados
CREATE POLICY "Allow insert access to authenticated users"
    ON public.planificaciones_mantenimiento
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política para permitir actualización a usuarios autenticados
CREATE POLICY "Allow update access to authenticated users"
    ON public.planificaciones_mantenimiento
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política para permitir eliminación a usuarios autenticados
CREATE POLICY "Allow delete access to authenticated users"
    ON public.planificaciones_mantenimiento
    FOR DELETE
    TO authenticated
    USING (true);

-- Comentarios para documentación
COMMENT ON TABLE public.planificaciones_mantenimiento IS 'Almacena las planificaciones de mantenimiento asignadas a cada equipo con predicción inteligente de próximo PM';
COMMENT ON COLUMN public.planificaciones_mantenimiento.fichaEquipo IS 'Ficha identificadora del equipo';
COMMENT ON COLUMN public.planificaciones_mantenimiento.planId IS 'FK al plan de mantenimiento asignado';
COMMENT ON COLUMN public.planificaciones_mantenimiento.intervaloId IS 'FK al intervalo PM específico (PM1, PM2, etc.)';
COMMENT ON COLUMN public.planificaciones_mantenimiento.kitId IS 'FK al kit de mantenimiento sugerido/asignado';
COMMENT ON COLUMN public.planificaciones_mantenimiento.estado IS 'Estado de la planificación: pendiente, programado, en_progreso, completado';
