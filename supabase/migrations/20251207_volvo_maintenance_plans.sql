-- =====================================================
-- PLANES DE MANTENIMIENTO VOLVO CONSTRUCTION EQUIPMENT
-- Migración: 2025-12-07
-- Incluye: Planes, Intervalos, Kits y Piezas para modelos Volvo
-- 
-- ⚠️ MODELOS ESPECÍFICOS EN LA BASE DE DATOS:
--   - EC55D (Miniretro) - AC-023, AC-025, AC-037 (3 unidades)
--   - 140DL/EC140DL (Excavadora) - AC-034 (1 unidad)
-- =====================================================

-- =====================================================
-- PARTE 1: PLANES DE MANTENIMIENTO VOLVO
-- Solo para modelos existentes: EC55D y 140DL/EC140DL
-- =====================================================

-- Plan para Miniretro EC55D (3 unidades: AC-023, AC-025, AC-037)
INSERT INTO planes_mantenimiento (nombre, descripcion, marca, modelo, categoria, activo)
VALUES (
  'Plan Mantenimiento Volvo EC55D',
  'Plan de mantenimiento preventivo para miniretro compacta Volvo EC55D. Motor Volvo D2.6A (55.4 HP). Peso operacional 5.5 ton. Ciclo completo PM1-PM4.',
  'Volvo',
  'EC55D',
  'Miniretro',
  true
) ON CONFLICT DO NOTHING;

-- Plan para Excavadora EC140DL (equipo AC-034 está registrado como "140DL")
-- Creamos plan para ambas variantes del nombre del modelo
INSERT INTO planes_mantenimiento (nombre, descripcion, marca, modelo, categoria, activo)
VALUES (
  'Plan Mantenimiento Volvo EC140DL',
  'Plan de mantenimiento preventivo para excavadora mediana Volvo EC140DL/140DL. Motor Volvo D4J (104 HP). Peso operacional 14.5 ton. Ciclo completo PM1-PM4.',
  'Volvo',
  'EC140DL',
  'Excavadora',
  true
) ON CONFLICT DO NOTHING;

-- Plan con nombre alternativo "140DL" (como está registrado el equipo AC-034)
INSERT INTO planes_mantenimiento (nombre, descripcion, marca, modelo, categoria, activo)
VALUES (
  'Plan Mantenimiento Volvo 140DL',
  'Plan de mantenimiento preventivo para excavadora Volvo 140DL (alias EC140DL). Motor Volvo D4J (104 HP). Peso operacional 14.5 ton. Ciclo completo PM1-PM4.',
  'Volvo',
  '140DL',
  'Excavadora',
  true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- PARTE 2: INTERVALOS DE MANTENIMIENTO
-- PM1 (250h), PM2 (500h), PM3 (1000h), PM4 (2000h)
-- =====================================================

DO $$
DECLARE
  plan_record RECORD;
BEGIN
  -- Iterar sobre cada plan Volvo recién creado
  FOR plan_record IN 
    SELECT id, modelo FROM planes_mantenimiento 
    WHERE marca = 'Volvo' AND activo = true
  LOOP
    -- Insertar PM1 (250h) - Mantenimiento básico
    INSERT INTO plan_intervalos (plan_id, codigo, nombre, horas_intervalo, descripcion, orden, tareas)
    VALUES (
      plan_record.id,
      'PM1',
      'Mantenimiento PM1 - 250 horas',
      250,
      'Mantenimiento preventivo básico: cambio de aceite motor y filtros básicos.',
      1,
      ARRAY[
        'Cambiar aceite de motor',
        'Reemplazar filtro de aceite motor',
        'Verificar niveles de refrigerante',
        'Inspeccionar mangueras y conexiones',
        'Lubricar puntos de engrase (13 puntos)',
        'Verificar tensión de orugas',
        'Inspeccionar sistema de escape',
        'Verificar luces y alarmas',
        'Inspección visual general del equipo'
      ]
    )
    ON CONFLICT DO NOTHING;

    -- Insertar PM2 (500h) - Incluye PM1 + combustible e hidráulico
    INSERT INTO plan_intervalos (plan_id, codigo, nombre, horas_intervalo, descripcion, orden, tareas)
    VALUES (
      plan_record.id,
      'PM2',
      'Mantenimiento PM2 - 500 horas',
      500,
      'Mantenimiento intermedio: incluye PM1 más filtros de combustible e hidráulico.',
      2,
      ARRAY[
        'Realizar todas las tareas de PM1',
        'Cambiar filtro de combustible primario (separador)',
        'Cambiar filtro de combustible secundario',
        'Cambiar filtro hidráulico de retorno',
        'Inspeccionar correas de accesorios',
        'Verificar sistema de frenos',
        'Revisar sistema eléctrico y batería',
        'Limpiar radiador y enfriador hidráulico',
        'Verificar nivel de aceite de mando final',
        'Inspeccionar cilindros hidráulicos'
      ]
    )
    ON CONFLICT DO NOTHING;

    -- Insertar PM3 (1000h) - Incluye PM2 + aire y aceite hidráulico
    INSERT INTO plan_intervalos (plan_id, codigo, nombre, horas_intervalo, descripcion, orden, tareas)
    VALUES (
      plan_record.id,
      'PM3',
      'Mantenimiento PM3 - 1000 horas',
      1000,
      'Mantenimiento mayor: incluye PM1+PM2 más filtros de aire y aceite hidráulico.',
      3,
      ARRAY[
        'Realizar todas las tareas de PM2',
        'Cambiar filtro de aire primario',
        'Cambiar filtro de aire secundario (seguridad)',
        'Cambiar aceite hidráulico (muestra para análisis)',
        'Cambiar aceite de mandos finales',
        'Inspeccionar sistema de enfriamiento completo',
        'Verificar juego de válvulas del motor',
        'Análisis de aceite motor e hidráulico',
        'Inspeccionar cucharón y dientes',
        'Verificar estructura y soldaduras'
      ]
    )
    ON CONFLICT DO NOTHING;

    -- Insertar PM4 (2000h) - Servicio completo
    INSERT INTO plan_intervalos (plan_id, codigo, nombre, horas_intervalo, descripcion, orden, tareas)
    VALUES (
      plan_record.id,
      'PM4',
      'Mantenimiento PM4 - 2000 horas',
      2000,
      'Mantenimiento completo: incluye todos los servicios anteriores más cambio de refrigerante y transmisión.',
      4,
      ARRAY[
        'Realizar todas las tareas de PM3',
        'Cambiar refrigerante del motor (VCS)',
        'Cambiar aceite de transmisión/reductor',
        'Reemplazar correas de accesorios',
        'Cambiar filtro de succión hidráulico',
        'Inspección completa de componentes principales',
        'Verificar y ajustar cilindros hidráulicos',
        'Calibrar sistema de control',
        'Inspeccionar sellos y o-rings',
        'Prueba de rendimiento completa',
        'Verificar presiones del sistema hidráulico'
      ]
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Intervalos PM1-PM4 creados para plan: %', plan_record.modelo;
  END LOOP;
END $$;

-- =====================================================
-- PARTE 3: KITS DE MANTENIMIENTO VOLVO
-- Solo modelos: EC55D, EC140DL, 140DL
-- =====================================================

-- =========================
-- KITS PARA EC55D (Miniretro - 3 unidades)
-- Números de parte específicos para motor Volvo D2.6A
-- =========================

INSERT INTO kits_mantenimiento (codigo, nombre, descripcion, marca, modelo_aplicable, categoria, activo)
VALUES 
  ('VOE-EC55D-PM1', 'Kit PM1 Volvo EC55D', 'Kit de servicio 250 horas para miniretro Volvo EC55D. Motor D2.6A.', 'Volvo', 'EC55D', 'Miniretro', true),
  ('VOE-EC55D-PM2', 'Kit PM2 Volvo EC55D', 'Kit de servicio 500 horas para miniretro Volvo EC55D. Motor D2.6A.', 'Volvo', 'EC55D', 'Miniretro', true),
  ('VOE-EC55D-PM3', 'Kit PM3 Volvo EC55D', 'Kit de servicio 1000 horas para miniretro Volvo EC55D. Motor D2.6A.', 'Volvo', 'EC55D', 'Miniretro', true),
  ('VOE-EC55D-PM4', 'Kit PM4 Volvo EC55D', 'Kit de servicio 2000 horas para miniretro Volvo EC55D. Motor D2.6A.', 'Volvo', 'EC55D', 'Miniretro', true)
ON CONFLICT DO NOTHING;

-- =========================
-- KITS PARA EC140DL (Excavadora)
-- Números de parte específicos para motor Volvo D4J
-- =========================

INSERT INTO kits_mantenimiento (codigo, nombre, descripcion, marca, modelo_aplicable, categoria, activo)
VALUES 
  ('VOE-EC140DL-PM1', 'Kit PM1 Volvo EC140DL', 'Kit de servicio 250 horas para excavadora Volvo EC140DL. Motor D4J.', 'Volvo', 'EC140DL', 'Excavadora', true),
  ('VOE-EC140DL-PM2', 'Kit PM2 Volvo EC140DL', 'Kit de servicio 500 horas para excavadora Volvo EC140DL. Motor D4J.', 'Volvo', 'EC140DL', 'Excavadora', true),
  ('VOE-EC140DL-PM3', 'Kit PM3 Volvo EC140DL', 'Kit de servicio 1000 horas para excavadora Volvo EC140DL. Motor D4J.', 'Volvo', 'EC140DL', 'Excavadora', true),
  ('VOE-EC140DL-PM4', 'Kit PM4 Volvo EC140DL', 'Kit de servicio 2000 horas para excavadora Volvo EC140DL. Motor D4J.', 'Volvo', 'EC140DL', 'Excavadora', true)
ON CONFLICT DO NOTHING;

-- =========================
-- KITS PARA 140DL (Alias - como está registrado AC-034)
-- Mismos números de parte que EC140DL
-- =========================

INSERT INTO kits_mantenimiento (codigo, nombre, descripcion, marca, modelo_aplicable, categoria, activo)
VALUES 
  ('VOE-140DL-PM1', 'Kit PM1 Volvo 140DL', 'Kit de servicio 250 horas para excavadora Volvo 140DL. Motor D4J.', 'Volvo', '140DL', 'Excavadora', true),
  ('VOE-140DL-PM2', 'Kit PM2 Volvo 140DL', 'Kit de servicio 500 horas para excavadora Volvo 140DL. Motor D4J.', 'Volvo', '140DL', 'Excavadora', true),
  ('VOE-140DL-PM3', 'Kit PM3 Volvo 140DL', 'Kit de servicio 1000 horas para excavadora Volvo 140DL. Motor D4J.', 'Volvo', '140DL', 'Excavadora', true),
  ('VOE-140DL-PM4', 'Kit PM4 Volvo 140DL', 'Kit de servicio 2000 horas para excavadora Volvo 140DL. Motor D4J.', 'Volvo', '140DL', 'Excavadora', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- PARTE 4: PIEZAS DE LOS KITS VOLVO
-- Números de parte oficiales Volvo (VOE prefix)
-- =====================================================

DO $$
DECLARE
  kit_record RECORD;
  modelo_actual TEXT;
BEGIN
  -- =========================================
  -- PIEZAS PARA KITS PM1 (250 horas)
  -- =========================================
  FOR kit_record IN 
    SELECT id, codigo, modelo_aplicable FROM kits_mantenimiento 
    WHERE marca = 'Volvo' AND codigo LIKE '%-PM1'
  LOOP
    modelo_actual := kit_record.modelo_aplicable;
    
    -- Piezas comunes PM1 + específicas por modelo
    IF modelo_actual = 'EC55D' THEN
      -- EC55D - Motor D2.6A (más pequeño)
      INSERT INTO kit_piezas (kit_id, numero_parte, descripcion, tipo, cantidad, unidad, notas)
      VALUES
        (kit_record.id, 'VOE21707132', 'Filtro de aceite motor', 'Filtro', 1, 'unidad', 'Filtro de aceite para motor D2.6A'),
        (kit_record.id, 'VOE20998807', 'Aceite motor VDS-4.5 15W-40', 'Lubricante', 8, 'litros', 'Capacidad carter EC55D: 7.5L'),
        (kit_record.id, 'VOE14503824', 'Arandela de drenaje cobre', 'Varios', 1, 'unidad', 'Reemplazar en cada cambio'),
        (kit_record.id, 'VOE-GRASA-01', 'Grasa multiusos EP2', 'Lubricante', 1, 'kg', 'Para puntos de engrase')
      ON CONFLICT DO NOTHING;
    ELSE
      -- EC140DL / 140DL - Motor D4J (más grande)
      INSERT INTO kit_piezas (kit_id, numero_parte, descripcion, tipo, cantidad, unidad, notas)
      VALUES
        (kit_record.id, 'VOE21707134', 'Filtro de aceite motor', 'Filtro', 1, 'unidad', 'Filtro de aceite para motor D4J'),
        (kit_record.id, 'VOE20998807', 'Aceite motor VDS-4.5 15W-40', 'Lubricante', 15, 'litros', 'Capacidad carter EC140DL: 14L'),
        (kit_record.id, 'VOE14503824', 'Arandela de drenaje cobre', 'Varios', 1, 'unidad', 'Reemplazar en cada cambio'),
        (kit_record.id, 'VOE-GRASA-01', 'Grasa multiusos EP2', 'Lubricante', 2, 'kg', 'Para puntos de engrase')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- =========================================
  -- PIEZAS PARA KITS PM2 (500 horas)
  -- =========================================
  FOR kit_record IN 
    SELECT id, codigo, modelo_aplicable FROM kits_mantenimiento 
    WHERE marca = 'Volvo' AND codigo LIKE '%-PM2'
  LOOP
    modelo_actual := kit_record.modelo_aplicable;
    
    IF modelo_actual = 'EC55D' THEN
      INSERT INTO kit_piezas (kit_id, numero_parte, descripcion, tipo, cantidad, unidad, notas)
      VALUES
        (kit_record.id, 'VOE21707132', 'Filtro de aceite motor', 'Filtro', 1, 'unidad', 'Filtro de aceite para motor D2.6A'),
        (kit_record.id, 'VOE20998807', 'Aceite motor VDS-4.5 15W-40', 'Lubricante', 8, 'litros', 'Capacidad carter EC55D: 7.5L'),
        (kit_record.id, 'VOE21380488', 'Filtro combustible primario', 'Filtro', 1, 'unidad', 'Separador agua/combustible'),
        (kit_record.id, 'VOE21380475', 'Filtro combustible secundario', 'Filtro', 1, 'unidad', 'Filtro fino de combustible'),
        (kit_record.id, 'VOE14539482', 'Filtro hidráulico retorno', 'Filtro', 1, 'unidad', 'Filtro del tanque hidráulico'),
        (kit_record.id, 'VOE14503824', 'Arandela de drenaje cobre', 'Varios', 2, 'unidad', 'Para motor e hidráulico'),
        (kit_record.id, 'VOE-GRASA-01', 'Grasa multiusos EP2', 'Lubricante', 1, 'kg', 'Para puntos de engrase')
      ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO kit_piezas (kit_id, numero_parte, descripcion, tipo, cantidad, unidad, notas)
      VALUES
        (kit_record.id, 'VOE21707134', 'Filtro de aceite motor', 'Filtro', 1, 'unidad', 'Filtro de aceite para motor D4J'),
        (kit_record.id, 'VOE20998807', 'Aceite motor VDS-4.5 15W-40', 'Lubricante', 15, 'litros', 'Capacidad carter EC140DL: 14L'),
        (kit_record.id, 'VOE21380489', 'Filtro combustible primario', 'Filtro', 1, 'unidad', 'Separador agua/combustible D4J'),
        (kit_record.id, 'VOE21380476', 'Filtro combustible secundario', 'Filtro', 1, 'unidad', 'Filtro fino de combustible D4J'),
        (kit_record.id, 'VOE14539483', 'Filtro hidráulico retorno', 'Filtro', 1, 'unidad', 'Filtro del tanque hidráulico'),
        (kit_record.id, 'VOE14503824', 'Arandela de drenaje cobre', 'Varios', 2, 'unidad', 'Para motor e hidráulico'),
        (kit_record.id, 'VOE-GRASA-01', 'Grasa multiusos EP2', 'Lubricante', 2, 'kg', 'Para puntos de engrase')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- =========================================
  -- PIEZAS PARA KITS PM3 (1000 horas)
  -- =========================================
  FOR kit_record IN 
    SELECT id, codigo, modelo_aplicable FROM kits_mantenimiento 
    WHERE marca = 'Volvo' AND codigo LIKE '%-PM3'
  LOOP
    modelo_actual := kit_record.modelo_aplicable;
    
    IF modelo_actual = 'EC55D' THEN
      INSERT INTO kit_piezas (kit_id, numero_parte, descripcion, tipo, cantidad, unidad, notas)
      VALUES
        (kit_record.id, 'VOE21707132', 'Filtro de aceite motor', 'Filtro', 1, 'unidad', 'Filtro de aceite para motor D2.6A'),
        (kit_record.id, 'VOE20998807', 'Aceite motor VDS-4.5 15W-40', 'Lubricante', 8, 'litros', 'Capacidad carter EC55D: 7.5L'),
        (kit_record.id, 'VOE21380488', 'Filtro combustible primario', 'Filtro', 1, 'unidad', 'Separador agua/combustible'),
        (kit_record.id, 'VOE21380475', 'Filtro combustible secundario', 'Filtro', 1, 'unidad', 'Filtro fino de combustible'),
        (kit_record.id, 'VOE14539482', 'Filtro hidráulico retorno', 'Filtro', 1, 'unidad', 'Filtro del tanque hidráulico'),
        (kit_record.id, 'VOE11110668', 'Filtro de aire primario', 'Filtro', 1, 'unidad', 'Elemento exterior'),
        (kit_record.id, 'VOE11110669', 'Filtro de aire secundario', 'Filtro', 1, 'unidad', 'Elemento de seguridad interior'),
        (kit_record.id, 'VOE15067098', 'Aceite hidráulico ISO VG 46', 'Lubricante', 25, 'litros', 'Capacidad tanque EC55D: 45L (parcial)'),
        (kit_record.id, 'VOE15067099', 'Aceite mando final 80W-90', 'Lubricante', 2, 'litros', 'Por cada mando final'),
        (kit_record.id, 'VOE14503824', 'Arandela de drenaje cobre', 'Varios', 4, 'unidad', 'Para todos los sistemas'),
        (kit_record.id, 'VOE-GRASA-01', 'Grasa multiusos EP2', 'Lubricante', 2, 'kg', 'Para puntos de engrase')
      ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO kit_piezas (kit_id, numero_parte, descripcion, tipo, cantidad, unidad, notas)
      VALUES
        (kit_record.id, 'VOE21707134', 'Filtro de aceite motor', 'Filtro', 1, 'unidad', 'Filtro de aceite para motor D4J'),
        (kit_record.id, 'VOE20998807', 'Aceite motor VDS-4.5 15W-40', 'Lubricante', 15, 'litros', 'Capacidad carter EC140DL: 14L'),
        (kit_record.id, 'VOE21380489', 'Filtro combustible primario', 'Filtro', 1, 'unidad', 'Separador agua/combustible D4J'),
        (kit_record.id, 'VOE21380476', 'Filtro combustible secundario', 'Filtro', 1, 'unidad', 'Filtro fino de combustible D4J'),
        (kit_record.id, 'VOE14539483', 'Filtro hidráulico retorno', 'Filtro', 1, 'unidad', 'Filtro del tanque hidráulico'),
        (kit_record.id, 'VOE11110670', 'Filtro de aire primario', 'Filtro', 1, 'unidad', 'Elemento exterior D4J'),
        (kit_record.id, 'VOE11110671', 'Filtro de aire secundario', 'Filtro', 1, 'unidad', 'Elemento de seguridad interior'),
        (kit_record.id, 'VOE15067098', 'Aceite hidráulico ISO VG 46', 'Lubricante', 60, 'litros', 'Capacidad tanque EC140DL: 110L (parcial)'),
        (kit_record.id, 'VOE15067099', 'Aceite mando final 80W-90', 'Lubricante', 4, 'litros', 'Por cada mando final'),
        (kit_record.id, 'VOE14503824', 'Arandela de drenaje cobre', 'Varios', 4, 'unidad', 'Para todos los sistemas'),
        (kit_record.id, 'VOE-GRASA-01', 'Grasa multiusos EP2', 'Lubricante', 3, 'kg', 'Para puntos de engrase')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- =========================================
  -- PIEZAS PARA KITS PM4 (2000 horas)
  -- =========================================
  FOR kit_record IN 
    SELECT id, codigo, modelo_aplicable FROM kits_mantenimiento 
    WHERE marca = 'Volvo' AND codigo LIKE '%-PM4'
  LOOP
    modelo_actual := kit_record.modelo_aplicable;
    
    IF modelo_actual = 'EC55D' THEN
      INSERT INTO kit_piezas (kit_id, numero_parte, descripcion, tipo, cantidad, unidad, notas)
      VALUES
        (kit_record.id, 'VOE21707132', 'Filtro de aceite motor', 'Filtro', 1, 'unidad', 'Filtro de aceite para motor D2.6A'),
        (kit_record.id, 'VOE20998807', 'Aceite motor VDS-4.5 15W-40', 'Lubricante', 8, 'litros', 'Capacidad carter EC55D: 7.5L'),
        (kit_record.id, 'VOE21380488', 'Filtro combustible primario', 'Filtro', 1, 'unidad', 'Separador agua/combustible'),
        (kit_record.id, 'VOE21380475', 'Filtro combustible secundario', 'Filtro', 1, 'unidad', 'Filtro fino de combustible'),
        (kit_record.id, 'VOE14539482', 'Filtro hidráulico retorno', 'Filtro', 1, 'unidad', 'Filtro del tanque hidráulico'),
        (kit_record.id, 'VOE14519261', 'Filtro hidráulico succión', 'Filtro', 1, 'unidad', 'Filtro de succión de bomba'),
        (kit_record.id, 'VOE11110668', 'Filtro de aire primario', 'Filtro', 1, 'unidad', 'Elemento exterior'),
        (kit_record.id, 'VOE11110669', 'Filtro de aire secundario', 'Filtro', 1, 'unidad', 'Elemento de seguridad interior'),
        (kit_record.id, 'VOE15067098', 'Aceite hidráulico ISO VG 46', 'Lubricante', 45, 'litros', 'Cambio completo tanque EC55D'),
        (kit_record.id, 'VOE15067099', 'Aceite mando final 80W-90', 'Lubricante', 2, 'litros', 'Por cada mando final'),
        (kit_record.id, 'VOE20879727', 'Refrigerante VCS concentrado', 'Refrigerante', 8, 'litros', 'Mezclar 50/50 con agua destilada'),
        (kit_record.id, 'VOE22574389', 'Aceite reductor/swing', 'Lubricante', 3, 'litros', 'Para reductor de giro'),
        (kit_record.id, 'VOE21408351', 'Correa de accesorios', 'Correa', 1, 'unidad', 'Correa alternador/ventilador'),
        (kit_record.id, 'VOE14503824', 'Arandela de drenaje cobre', 'Varios', 6, 'unidad', 'Para todos los sistemas'),
        (kit_record.id, 'VOE-GRASA-01', 'Grasa multiusos EP2', 'Lubricante', 2, 'kg', 'Para puntos de engrase')
      ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO kit_piezas (kit_id, numero_parte, descripcion, tipo, cantidad, unidad, notas)
      VALUES
        (kit_record.id, 'VOE21707134', 'Filtro de aceite motor', 'Filtro', 1, 'unidad', 'Filtro de aceite para motor D4J'),
        (kit_record.id, 'VOE20998807', 'Aceite motor VDS-4.5 15W-40', 'Lubricante', 15, 'litros', 'Capacidad carter EC140DL: 14L'),
        (kit_record.id, 'VOE21380489', 'Filtro combustible primario', 'Filtro', 1, 'unidad', 'Separador agua/combustible D4J'),
        (kit_record.id, 'VOE21380476', 'Filtro combustible secundario', 'Filtro', 1, 'unidad', 'Filtro fino de combustible D4J'),
        (kit_record.id, 'VOE14539483', 'Filtro hidráulico retorno', 'Filtro', 1, 'unidad', 'Filtro del tanque hidráulico'),
        (kit_record.id, 'VOE14519262', 'Filtro hidráulico succión', 'Filtro', 1, 'unidad', 'Filtro de succión de bomba D4J'),
        (kit_record.id, 'VOE11110670', 'Filtro de aire primario', 'Filtro', 1, 'unidad', 'Elemento exterior D4J'),
        (kit_record.id, 'VOE11110671', 'Filtro de aire secundario', 'Filtro', 1, 'unidad', 'Elemento de seguridad interior'),
        (kit_record.id, 'VOE15067098', 'Aceite hidráulico ISO VG 46', 'Lubricante', 110, 'litros', 'Cambio completo tanque EC140DL'),
        (kit_record.id, 'VOE15067099', 'Aceite mando final 80W-90', 'Lubricante', 4, 'litros', 'Por cada mando final'),
        (kit_record.id, 'VOE20879727', 'Refrigerante VCS concentrado', 'Refrigerante', 15, 'litros', 'Mezclar 50/50 con agua destilada'),
        (kit_record.id, 'VOE22574390', 'Aceite reductor/swing', 'Lubricante', 6, 'litros', 'Para reductor de giro'),
        (kit_record.id, 'VOE21408352', 'Correa de accesorios', 'Correa', 1, 'unidad', 'Correa alternador/ventilador D4J'),
        (kit_record.id, 'VOE14503824', 'Arandela de drenaje cobre', 'Varios', 6, 'unidad', 'Para todos los sistemas'),
        (kit_record.id, 'VOE-GRASA-01', 'Grasa multiusos EP2', 'Lubricante', 3, 'kg', 'Para puntos de engrase')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Piezas insertadas para todos los kits Volvo';
END $$;

-- =====================================================
-- PARTE 5: VINCULAR KITS A INTERVALOS
-- Relaciona cada kit con su intervalo correspondiente
-- =====================================================

DO $$
DECLARE
  plan_record RECORD;
  intervalo_record RECORD;
  kit_record RECORD;
  vinculaciones INT := 0;
BEGIN
  -- Para cada plan Volvo
  FOR plan_record IN 
    SELECT id, modelo FROM planes_mantenimiento 
    WHERE marca = 'Volvo' AND activo = true
  LOOP
    -- Para cada intervalo del plan
    FOR intervalo_record IN 
      SELECT id, codigo FROM plan_intervalos 
      WHERE plan_id = plan_record.id
    LOOP
      -- Buscar el kit correspondiente (mismo modelo, mismo código PM)
      FOR kit_record IN 
        SELECT id, codigo FROM kits_mantenimiento 
        WHERE marca = 'Volvo' 
          AND modelo_aplicable = plan_record.modelo
          AND codigo LIKE '%-' || intervalo_record.codigo
      LOOP
        -- Insertar la vinculación
        INSERT INTO plan_intervalo_kits (plan_intervalo_id, kit_id)
        VALUES (intervalo_record.id, kit_record.id)
        ON CONFLICT DO NOTHING;
        
        vinculaciones := vinculaciones + 1;
        RAISE NOTICE 'Vinculado: Plan % | Intervalo % -> Kit %', 
          plan_record.modelo, intervalo_record.codigo, kit_record.codigo;
      END LOOP;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Total vinculaciones kit-intervalo: %', vinculaciones;
END $$;

-- =====================================================
-- PARTE 6: VERIFICACIÓN Y ESTADÍSTICAS
-- =====================================================

-- Actualizar estadísticas de tablas
ANALYZE planes_mantenimiento;
ANALYZE plan_intervalos;
ANALYZE kits_mantenimiento;
ANALYZE kit_piezas;
ANALYZE plan_intervalo_kits;

-- Resumen de la migración
DO $$
DECLARE
  planes_count INT;
  intervalos_count INT;
  kits_count INT;
  piezas_count INT;
  vinculaciones_count INT;
BEGIN
  SELECT COUNT(*) INTO planes_count FROM planes_mantenimiento WHERE marca = 'Volvo';
  SELECT COUNT(*) INTO intervalos_count FROM plan_intervalos pi 
    JOIN planes_mantenimiento pm ON pi.plan_id = pm.id WHERE pm.marca = 'Volvo';
  SELECT COUNT(*) INTO kits_count FROM kits_mantenimiento WHERE marca = 'Volvo';
  SELECT COUNT(*) INTO piezas_count FROM kit_piezas kp 
    JOIN kits_mantenimiento km ON kp.kit_id = km.id WHERE km.marca = 'Volvo';
  SELECT COUNT(*) INTO vinculaciones_count FROM plan_intervalo_kits pik
    JOIN plan_intervalos pi ON pik.plan_intervalo_id = pi.id
    JOIN planes_mantenimiento pm ON pi.plan_id = pm.id WHERE pm.marca = 'Volvo';
    
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'MIGRACIÓN VOLVO COMPLETADA';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Modelos incluidos:';
  RAISE NOTICE '  - EC55D (Miniretro) - 3 equipos: AC-023, AC-025, AC-037';
  RAISE NOTICE '  - EC140DL/140DL (Excavadora) - 1 equipo: AC-034';
  RAISE NOTICE '-----------------------------------------------------';
  RAISE NOTICE 'Estadísticas:';
  RAISE NOTICE '  - % planes de mantenimiento', planes_count;
  RAISE NOTICE '  - % intervalos (PM1-PM4 por plan)', intervalos_count;
  RAISE NOTICE '  - % kits de mantenimiento', kits_count;
  RAISE NOTICE '  - % piezas en total', piezas_count;
  RAISE NOTICE '  - % vinculaciones kit-intervalo', vinculaciones_count;
  RAISE NOTICE '=====================================================';
END $$;
