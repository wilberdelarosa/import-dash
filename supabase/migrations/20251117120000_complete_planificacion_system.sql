-- =====================================================
-- SISTEMA COMPLETO DE PLANIFICACIÓN DE MANTENIMIENTO
-- =====================================================

-- 1. Tabla de alertas configurables por equipo
CREATE TABLE IF NOT EXISTS public.alertas_mantenimiento (
    id BIGSERIAL PRIMARY KEY,
    ficha_equipo TEXT NOT NULL,
    nombre_equipo TEXT NOT NULL,
    intervalo_mp TEXT NOT NULL, -- PM1, PM2, PM3, PM4
    horas_alerta INTEGER NOT NULL DEFAULT 50, -- Horas antes para alertar
    tecnico_responsable TEXT,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    ultima_notificacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ficha_equipo, intervalo_mp)
);

-- 2. Mejorar tabla de planificaciones (si ya existe, esto la actualiza)
DO $$ 
BEGIN
    -- Agregar columnas si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'planificaciones_mantenimiento' 
                   AND column_name = 'tecnico_responsable') THEN
        ALTER TABLE public.planificaciones_mantenimiento 
        ADD COLUMN tecnico_responsable TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'planificaciones_mantenimiento' 
                   AND column_name = 'horas_alerta') THEN
        ALTER TABLE public.planificaciones_mantenimiento 
        ADD COLUMN horas_alerta INTEGER DEFAULT 50;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'planificaciones_mantenimiento' 
                   AND column_name = 'alerta_enviada') THEN
        ALTER TABLE public.planificaciones_mantenimiento 
        ADD COLUMN alerta_enviada BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'planificaciones_mantenimiento' 
                   AND column_name = 'fecha_alerta') THEN
        ALTER TABLE public.planificaciones_mantenimiento 
        ADD COLUMN fecha_alerta TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Tabla de asociación automática equipo-plan basada en modelo
CREATE TABLE IF NOT EXISTS public.equipos_planes_auto (
    id BIGSERIAL PRIMARY KEY,
    modelo TEXT NOT NULL,
    marca TEXT NOT NULL,
    categoria TEXT,
    plan_id BIGINT REFERENCES public.planes_mantenimiento(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(modelo, marca, plan_id)
);

-- 4. Vista materializada para equipos con sus planes sugeridos
CREATE MATERIALIZED VIEW IF NOT EXISTS public.equipos_con_planes_sugeridos AS
SELECT 
    e.id as equipo_id,
    e.ficha,
    e.nombre,
    e.marca,
    e.modelo,
    e.categoria,
    e.numero_serie,
    epa.plan_id as plan_sugerido_id,
    p.nombre as plan_sugerido_nombre,
    p.descripcion as plan_sugerido_descripcion,
    mp.horas_km_actuales,
    mp.proximo_mantenimiento,
    mp.horas_km_restante
FROM public.equipos e
LEFT JOIN public.equipos_planes_auto epa ON e.modelo = epa.modelo AND e.marca = epa.marca
LEFT JOIN public.planes_mantenimiento p ON epa.plan_id = p.id
LEFT JOIN public.mantenimientos_programados mp ON e.ficha = mp.ficha
WHERE e.activo = TRUE;

-- Índice para la vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_equipos_planes_sugeridos_equipo ON public.equipos_con_planes_sugeridos(equipo_id);
CREATE INDEX IF NOT EXISTS idx_equipos_planes_sugeridos_modelo ON public.equipos_con_planes_sugeridos(modelo);
CREATE INDEX IF NOT EXISTS idx_equipos_planes_sugeridos_plan ON public.equipos_con_planes_sugeridos(plan_sugerido_id);

-- 5. Función para refrescar la vista materializada
CREATE OR REPLACE FUNCTION refresh_equipos_planes_sugeridos()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.equipos_con_planes_sugeridos;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers para refrescar automáticamente
DROP TRIGGER IF EXISTS trigger_refresh_equipos_planes_equipos ON public.equipos;
CREATE TRIGGER trigger_refresh_equipos_planes_equipos
    AFTER INSERT OR UPDATE OR DELETE ON public.equipos
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_equipos_planes_sugeridos();

DROP TRIGGER IF EXISTS trigger_refresh_equipos_planes_auto ON public.equipos_planes_auto;
CREATE TRIGGER trigger_refresh_equipos_planes_auto
    AFTER INSERT OR UPDATE OR DELETE ON public.equipos_planes_auto
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_equipos_planes_sugeridos();

-- 6. Índices para alertas
CREATE INDEX IF NOT EXISTS idx_alertas_ficha_equipo ON public.alertas_mantenimiento(ficha_equipo);
CREATE INDEX IF NOT EXISTS idx_alertas_activa ON public.alertas_mantenimiento(activa);
CREATE INDEX IF NOT EXISTS idx_alertas_intervalo ON public.alertas_mantenimiento(intervalo_mp);

-- 7. Índices adicionales para planificaciones
CREATE INDEX IF NOT EXISTS idx_planificaciones_tecnico ON public.planificaciones_mantenimiento(tecnico_responsable);
CREATE INDEX IF NOT EXISTS idx_planificaciones_alerta ON public.planificaciones_mantenimiento(alerta_enviada);

-- 8. Trigger para actualizar updated_at en alertas
CREATE OR REPLACE FUNCTION update_alertas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_alertas_updated_at ON public.alertas_mantenimiento;
CREATE TRIGGER trigger_update_alertas_updated_at
    BEFORE UPDATE ON public.alertas_mantenimiento
    FOR EACH ROW
    EXECUTE FUNCTION update_alertas_updated_at();

-- 9. Función para detectar equipos que necesitan alerta
CREATE OR REPLACE FUNCTION get_equipos_requieren_alerta()
RETURNS TABLE (
    ficha_equipo TEXT,
    nombre_equipo TEXT,
    intervalo_mp TEXT,
    horas_actuales INTEGER,
    horas_objetivo INTEGER,
    horas_restantes INTEGER,
    tecnico_responsable TEXT,
    debe_alertar BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.ficha_equipo,
        a.nombre_equipo,
        a.intervalo_mp,
        mp.horas_km_actuales::INTEGER,
        mp.proximo_mantenimiento::INTEGER,
        mp.horas_km_restante::INTEGER,
        a.tecnico_responsable,
        (mp.horas_km_restante <= a.horas_alerta AND a.activa) as debe_alertar
    FROM public.alertas_mantenimiento a
    LEFT JOIN public.mantenimientos_programados mp ON a.ficha_equipo = mp.ficha
    WHERE a.activa = TRUE
    AND mp.horas_km_restante IS NOT NULL
    AND mp.horas_km_restante <= a.horas_alerta
    ORDER BY mp.horas_km_restante ASC;
END;
$$ LANGUAGE plpgsql;

-- 10. RLS para nuevas tablas
ALTER TABLE public.alertas_mantenimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos_planes_auto ENABLE ROW LEVEL SECURITY;

-- Políticas para alertas_mantenimiento
CREATE POLICY "Allow read access to authenticated users"
    ON public.alertas_mantenimiento FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Allow insert access to authenticated users"
    ON public.alertas_mantenimiento FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update access to authenticated users"
    ON public.alertas_mantenimiento FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete access to authenticated users"
    ON public.alertas_mantenimiento FOR DELETE
    TO authenticated USING (true);

-- Políticas para equipos_planes_auto
CREATE POLICY "Allow read access to authenticated users"
    ON public.equipos_planes_auto FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Allow insert access to authenticated users"
    ON public.equipos_planes_auto FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update access to authenticated users"
    ON public.equipos_planes_auto FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete access to authenticated users"
    ON public.equipos_planes_auto FOR DELETE
    TO authenticated USING (true);

-- 11. Comentarios de documentación
COMMENT ON TABLE public.alertas_mantenimiento IS 'Configuración de alertas personalizadas por equipo e intervalo';
COMMENT ON TABLE public.equipos_planes_auto IS 'Asociación automática de equipos a planes según modelo/marca';
COMMENT ON COLUMN public.alertas_mantenimiento.horas_alerta IS 'Cuántas horas antes del mantenimiento se debe alertar';
COMMENT ON COLUMN public.alertas_mantenimiento.activa IS 'Si la alerta está activa o pausada';
COMMENT ON FUNCTION get_equipos_requieren_alerta() IS 'Devuelve equipos que están dentro del rango de alerta configurado';

-- 12. Datos iniciales de ejemplo (opcional)
-- Asociar excavadoras Caterpillar 320 a un plan ejemplo
-- INSERT INTO public.equipos_planes_auto (modelo, marca, categoria, plan_id)
-- SELECT '320', 'Caterpillar', 'Excavadora', id
-- FROM public.planes_mantenimiento
-- WHERE codigo = 'CAT-320-STD'
-- ON CONFLICT (modelo, marca, plan_id) DO NOTHING;

-- Refrescar vista al final
REFRESH MATERIALIZED VIEW CONCURRENTLY public.equipos_con_planes_sugeridos;
