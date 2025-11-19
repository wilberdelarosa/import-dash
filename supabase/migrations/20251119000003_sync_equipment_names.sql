-- Trigger para sincronizar automáticamente el nombre del equipo
-- en la tabla mantenimientos_programados cuando se actualiza en equipos

-- Función que actualiza el nombre_equipo en mantenimientos_programados
CREATE OR REPLACE FUNCTION sync_equipment_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se actualiza el nombre de un equipo, propagar el cambio
  IF NEW.nombre IS DISTINCT FROM OLD.nombre THEN
    UPDATE mantenimientos_programados
    SET nombre_equipo = NEW.nombre
    WHERE ficha = NEW.ficha;
    
    RAISE NOTICE 'Sincronizado nombre para ficha %: % -> %', 
      NEW.ficha, OLD.nombre, NEW.nombre;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger en la tabla equipos
DROP TRIGGER IF EXISTS trigger_sync_equipment_name ON equipos;

CREATE TRIGGER trigger_sync_equipment_name
  AFTER UPDATE ON equipos
  FOR EACH ROW
  WHEN (OLD.nombre IS DISTINCT FROM NEW.nombre)
  EXECUTE FUNCTION sync_equipment_name();

-- Comentarios de documentación
COMMENT ON FUNCTION sync_equipment_name() IS 
  'Sincroniza automáticamente el nombre_equipo en mantenimientos_programados cuando se actualiza el nombre en equipos';

COMMENT ON TRIGGER trigger_sync_equipment_name ON equipos IS 
  'Trigger que mantiene sincronizados los nombres de equipos entre las tablas equipos y mantenimientos_programados';
