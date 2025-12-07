-- Cambiar el valor por defecto de empresa a ALITO EIRL
ALTER TABLE equipos ALTER COLUMN empresa SET DEFAULT 'ALITO EIRL';

-- Actualizar equipos que tengan ALITO GROUP SRL a ALITO EIRL (solo si el usuario lo desea)
-- UPDATE equipos SET empresa = 'ALITO EIRL' WHERE empresa = 'ALITO GROUP SRL';

-- Agregar VENDIDO al constraint si no está
ALTER TABLE equipos DROP CONSTRAINT IF EXISTS check_empresa_valida;
ALTER TABLE equipos ADD CONSTRAINT check_empresa_valida 
CHECK (empresa IN ('ALITO GROUP SRL', 'ALITO EIRL', 'VENDIDO'));