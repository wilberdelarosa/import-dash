-- Migración para agregar campo empresa a la tabla equipos
-- Las empresas disponibles son: ALITO GROUP SRL y ALITO EIRL

-- Paso 1: Agregar columna empresa con valor por defecto
ALTER TABLE equipos 
ADD COLUMN IF NOT EXISTS empresa TEXT DEFAULT 'ALITO GROUP SRL';

-- Paso 2: Actualizar todos los registros existentes para que tengan empresa asignada
UPDATE equipos 
SET empresa = 'ALITO GROUP SRL' 
WHERE empresa IS NULL;

-- Paso 3: Hacer la columna NOT NULL después de asignar valores
ALTER TABLE equipos 
ALTER COLUMN empresa SET NOT NULL;

-- Paso 4: Agregar constraint para validar valores permitidos
ALTER TABLE equipos 
ADD CONSTRAINT check_empresa_valida 
CHECK (empresa IN ('ALITO GROUP SRL', 'ALITO EIRL'));

-- Paso 5: Crear índice para mejorar consultas filtradas por empresa
CREATE INDEX IF NOT EXISTS idx_equipos_empresa ON equipos(empresa);

-- Verificación (comentar en producción):
-- SELECT empresa, COUNT(*) FROM equipos GROUP BY empresa;

COMMENT ON COLUMN equipos.empresa IS 'Empresa propietaria del equipo: ALITO GROUP SRL o ALITO EIRL';
