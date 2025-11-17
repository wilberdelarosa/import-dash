-- Optimización de índices para mejorar performance de carga de Planes y Kits
-- Fecha: 2025-11-16

-- Índices para planes_mantenimiento
CREATE INDEX IF NOT EXISTS idx_planes_mantenimiento_marca ON planes_mantenimiento(marca);
CREATE INDEX IF NOT EXISTS idx_planes_mantenimiento_modelo ON planes_mantenimiento(modelo);
CREATE INDEX IF NOT EXISTS idx_planes_mantenimiento_activo ON planes_mantenimiento(activo);

-- Índices para plan_intervalos
CREATE INDEX IF NOT EXISTS idx_plan_intervalos_plan_id ON plan_intervalos(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_intervalos_orden ON plan_intervalos(plan_id, orden);

-- Índices para plan_intervalo_kits
CREATE INDEX IF NOT EXISTS idx_plan_intervalo_kits_intervalo ON plan_intervalo_kits(plan_intervalo_id);
CREATE INDEX IF NOT EXISTS idx_plan_intervalo_kits_kit ON plan_intervalo_kits(kit_id);

-- Índices para kits_mantenimiento
CREATE INDEX IF NOT EXISTS idx_kits_mantenimiento_marca ON kits_mantenimiento(marca);
CREATE INDEX IF NOT EXISTS idx_kits_mantenimiento_activo ON kits_mantenimiento(activo);
CREATE INDEX IF NOT EXISTS idx_kits_mantenimiento_codigo ON kits_mantenimiento(codigo);

-- Índices para kit_piezas
CREATE INDEX IF NOT EXISTS idx_kit_piezas_kit_id ON kit_piezas(kit_id);

-- Índices compuestos para queries comunes
CREATE INDEX IF NOT EXISTS idx_planes_marca_activo ON planes_mantenimiento(marca, activo);
CREATE INDEX IF NOT EXISTS idx_kits_marca_activo ON kits_mantenimiento(marca, activo);

-- Estadísticas para el query planner
ANALYZE planes_mantenimiento;
ANALYZE plan_intervalos;
ANALYZE plan_intervalo_kits;
ANALYZE kits_mantenimiento;
ANALYZE kit_piezas;
