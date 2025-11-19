-- Migración para eliminar el equipo duplicado AC-051 (232D) y mantener solo el AC-051 (216B)
-- El equipo válido es el MINICARGADOR 216B que actualmente tiene la ficha AC-051
-- El equipo a eliminar es el MINICARGADOR 232D que está inactivo

-- Paso 1: Eliminar todos los registros relacionados con AC-051 (232D) del equipo inactivo
-- Solo eliminamos registros del mantenimiento programado id=42 que corresponde al 232D inactivo

-- Eliminar mantenimientos realizados del equipo 232D (id=42)
DELETE FROM mantenimientos_realizados 
WHERE ficha = 'AC-051' 
  AND id IN (
    SELECT mr.id 
    FROM mantenimientos_realizados mr
    WHERE mr.ficha = 'AC-051'
      AND mr.fecha_mantenimiento < '2025-07-01'  -- Los registros más antiguos son del 232D
  );

-- Eliminar actualizaciones de horas del equipo 232D inactivo
-- Mantenemos solo las actualizaciones del 216B (las más recientes después de julio)
DELETE FROM actualizaciones_horas_km 
WHERE ficha = 'AC-051' 
  AND fecha < '2025-07-01';  -- Eliminar registros antiguos del 232D

-- Eliminar el mantenimiento programado del equipo 232D (id=42, el inactivo)
DELETE FROM mantenimientos_programados 
WHERE id = 42 
  AND ficha = 'AC-051' 
  AND nombre_equipo = 'MINICARGADOR 232D'
  AND activo = false;

-- Eliminar el equipo 232D de la tabla equipos (id=48)
DELETE FROM equipos 
WHERE id = 48 
  AND ficha = 'AC-051' 
  AND nombre = 'MINICARGADOR 232D';

-- Paso 2: Verificar que solo queda el registro correcto (216B)
-- SELECT * FROM equipos WHERE ficha = 'AC-051';
-- SELECT * FROM mantenimientos_programados WHERE ficha = 'AC-051';

-- Resultado esperado:
-- - Solo debe quedar el MINICARGADOR 216B con ficha AC-051
-- - Todos los registros históricos antiguos del 232D estarán eliminados
-- - Se conservan solo las actualizaciones del 216B desde julio 2025
