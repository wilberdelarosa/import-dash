-- =====================================================
-- Migración: Sistema de Overrides de Planes
-- Fecha: 2025-11-18
-- Descripción: Permite asignación manual de planes cuando
--              la sugerencia automática no es adecuada
-- =====================================================

-- Crear tabla de overrides
CREATE TABLE IF NOT EXISTS overrides_planes (
  id BIGSERIAL PRIMARY KEY,
  ficha_equipo VARCHAR NOT NULL,
  plan_original_id BIGINT REFERENCES planes_mantenimiento(id) ON DELETE SET NULL,
  plan_forzado_id BIGINT NOT NULL REFERENCES planes_mantenimiento(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  usuario_email VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  activo BOOLEAN DEFAULT true
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_overrides_ficha ON overrides_planes(ficha_equipo);
CREATE INDEX IF NOT EXISTS idx_overrides_plan_forzado ON overrides_planes(plan_forzado_id);
CREATE INDEX IF NOT EXISTS idx_overrides_activo ON overrides_planes(activo) WHERE activo = true;

-- Comentarios
COMMENT ON TABLE overrides_planes IS 'Registro de asignaciones manuales de planes cuando la sugerencia automática no aplica';
COMMENT ON COLUMN overrides_planes.ficha_equipo IS 'Ficha del equipo que tiene override';
COMMENT ON COLUMN overrides_planes.plan_original_id IS 'Plan que el sistema sugirió originalmente (puede ser NULL)';
COMMENT ON COLUMN overrides_planes.plan_forzado_id IS 'Plan que el usuario eligió manualmente';
COMMENT ON COLUMN overrides_planes.motivo IS 'Razón por la cual se hizo el override';
COMMENT ON COLUMN overrides_planes.usuario_email IS 'Email del usuario que hizo el cambio';
COMMENT ON COLUMN overrides_planes.activo IS 'Si el override sigue activo o fue revertido';

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_overrides_planes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_overrides_planes_updated_at
  BEFORE UPDATE ON overrides_planes
  FOR EACH ROW
  EXECUTE FUNCTION update_overrides_planes_updated_at();

-- =====================================================
-- Mejoras a tabla planificaciones_mantenimiento
-- =====================================================

-- Agregar campos para rutas predictivas
DO $$ 
BEGIN
  -- Verificar y agregar columnas si no existen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planificaciones_mantenimiento' 
    AND column_name = 'numero_ruta'
  ) THEN
    ALTER TABLE planificaciones_mantenimiento 
    ADD COLUMN numero_ruta INTEGER;
    
    COMMENT ON COLUMN planificaciones_mantenimiento.numero_ruta IS 'Posición en la ruta (1-8 para las próximas 8 rutas planificadas)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planificaciones_mantenimiento' 
    AND column_name = 'ciclo_numero'
  ) THEN
    ALTER TABLE planificaciones_mantenimiento 
    ADD COLUMN ciclo_numero INTEGER;
    
    COMMENT ON COLUMN planificaciones_mantenimiento.ciclo_numero IS 'Número de ciclo completo (MP1-MP4 = 1 ciclo)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planificaciones_mantenimiento' 
    AND column_name = 'es_override'
  ) THEN
    ALTER TABLE planificaciones_mantenimiento 
    ADD COLUMN es_override BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN planificaciones_mantenimiento.es_override IS 'Indica si esta planificación usa un plan con override manual';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planificaciones_mantenimiento' 
    AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE planificaciones_mantenimiento 
    ADD COLUMN plan_id BIGINT REFERENCES planes_mantenimiento(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN planificaciones_mantenimiento.plan_id IS 'Referencia al plan de mantenimiento usado';
  END IF;
END $$;

-- Índices para optimizar consultas de rutas
CREATE INDEX IF NOT EXISTS idx_plan_ruta ON planificaciones_mantenimiento(ficha_equipo, numero_ruta);
CREATE INDEX IF NOT EXISTS idx_plan_ciclo ON planificaciones_mantenimiento(ficha_equipo, ciclo_numero);
CREATE INDEX IF NOT EXISTS idx_plan_id ON planificaciones_mantenimiento(plan_id);

-- =====================================================
-- Vista materializada: Equipos con Overrides Activos
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS equipos_con_overrides AS
SELECT 
  op.ficha_equipo,
  op.plan_original_id,
  op.plan_forzado_id,
  op.motivo,
  op.usuario_email,
  op.created_at as override_fecha,
  p_original.nombre as plan_original_nombre,
  p_forzado.nombre as plan_forzado_nombre,
  p_forzado.marca as plan_marca,
  p_forzado.modelo as plan_modelo
FROM overrides_planes op
LEFT JOIN planes_mantenimiento p_original ON op.plan_original_id = p_original.id
INNER JOIN planes_mantenimiento p_forzado ON op.plan_forzado_id = p_forzado.id
WHERE op.activo = true;

-- Índices en la vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_equipos_overrides_ficha ON equipos_con_overrides(ficha_equipo);

COMMENT ON MATERIALIZED VIEW equipos_con_overrides IS 'Vista rápida de equipos con overrides activos';

-- Función para refrescar la vista
CREATE OR REPLACE FUNCTION refresh_equipos_con_overrides()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY equipos_con_overrides;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-refrescar la vista cuando cambian overrides
CREATE OR REPLACE FUNCTION trigger_refresh_equipos_overrides()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_equipos_con_overrides();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_overrides_refresh
  AFTER INSERT OR UPDATE OR DELETE ON overrides_planes
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_equipos_overrides();

-- =====================================================
-- Función RPC: Obtener override activo para un equipo
-- =====================================================

CREATE OR REPLACE FUNCTION get_override_activo(p_ficha_equipo VARCHAR)
RETURNS TABLE (
  id BIGINT,
  plan_original_id BIGINT,
  plan_forzado_id BIGINT,
  motivo TEXT,
  usuario_email VARCHAR,
  created_at TIMESTAMPTZ,
  plan_forzado_nombre VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    op.id,
    op.plan_original_id,
    op.plan_forzado_id,
    op.motivo,
    op.usuario_email,
    op.created_at,
    p.nombre as plan_forzado_nombre
  FROM overrides_planes op
  INNER JOIN planes_mantenimiento p ON op.plan_forzado_id = p.id
  WHERE op.ficha_equipo = p_ficha_equipo 
    AND op.activo = true
  ORDER BY op.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_override_activo IS 'Obtiene el override activo de un equipo (si existe)';

-- =====================================================
-- Políticas RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE overrides_planes ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden leer
CREATE POLICY "Usuarios autenticados pueden leer overrides"
  ON overrides_planes FOR SELECT
  TO authenticated
  USING (true);

-- Política: Todos los usuarios autenticados pueden insertar
CREATE POLICY "Usuarios autenticados pueden crear overrides"
  ON overrides_planes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: Usuarios pueden actualizar (para desactivar overrides)
CREATE POLICY "Usuarios autenticados pueden actualizar overrides"
  ON overrides_planes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Datos de prueba (opcional - comentar en producción)
-- =====================================================

-- Ejemplo de override para equipo de prueba
-- INSERT INTO overrides_planes (ficha_equipo, plan_forzado_id, motivo, usuario_email)
-- VALUES ('DEMO-001', 1, 'Opera en condiciones extremas, requiere MP más frecuentes', 'admin@alitogroup.com');

-- =====================================================
-- Verificación
-- =====================================================

-- Verificar que todo se creó correctamente
DO $$
DECLARE
  tabla_count INTEGER;
  vista_count INTEGER;
  funcion_count INTEGER;
BEGIN
  -- Contar tablas
  SELECT COUNT(*) INTO tabla_count
  FROM information_schema.tables
  WHERE table_name = 'overrides_planes';
  
  -- Contar vistas
  SELECT COUNT(*) INTO vista_count
  FROM pg_matviews
  WHERE matviewname = 'equipos_con_overrides';
  
  -- Contar funciones
  SELECT COUNT(*) INTO funcion_count
  FROM pg_proc
  WHERE proname = 'get_override_activo';
  
  -- Reportar
  RAISE NOTICE '✅ Migración completada:';
  RAISE NOTICE '   - Tabla overrides_planes: % (esperado: 1)', tabla_count;
  RAISE NOTICE '   - Vista equipos_con_overrides: % (esperado: 1)', vista_count;
  RAISE NOTICE '   - Función get_override_activo: % (esperado: 1)', funcion_count;
  
  IF tabla_count = 1 AND vista_count = 1 AND funcion_count = 1 THEN
    RAISE NOTICE '✅ Todas las estructuras creadas correctamente';
  ELSE
    RAISE WARNING '⚠️ Algunas estructuras no se crearon. Revisa los logs.';
  END IF;
END $$;
