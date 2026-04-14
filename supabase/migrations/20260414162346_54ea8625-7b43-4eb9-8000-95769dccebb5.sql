
CREATE OR REPLACE FUNCTION public.cambiar_ficha_equipo(p_old_ficha text, p_new_ficha text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_equipo_id bigint;
  v_equipo_nombre text;
BEGIN
  -- Validar que la ficha nueva no esté vacía
  IF p_new_ficha IS NULL OR trim(p_new_ficha) = '' THEN
    RETURN json_build_object('success', false, 'error', 'La nueva ficha no puede estar vacía');
  END IF;

  -- Validar que la ficha antigua exista
  SELECT id, nombre INTO v_equipo_id, v_equipo_nombre
  FROM equipos WHERE ficha = p_old_ficha;

  IF v_equipo_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No existe un equipo con la ficha ' || p_old_ficha);
  END IF;

  -- Validar que la ficha nueva no exista ya
  IF EXISTS (SELECT 1 FROM equipos WHERE ficha = p_new_ficha AND ficha != p_old_ficha) THEN
    RETURN json_build_object('success', false, 'error', 'Ya existe un equipo con la ficha ' || p_new_ficha);
  END IF;

  -- Registrar el cambio en historial ANTES de actualizar (para que quede la ficha anterior)
  INSERT INTO historial_eventos (
    tipo_evento, modulo, ficha_equipo, nombre_equipo, descripcion, 
    datos_antes, datos_despues, nivel_importancia, usuario_responsable
  ) VALUES (
    'cambio_ficha', 'equipos', p_old_ficha, v_equipo_nombre,
    'Cambio de ficha: ' || p_old_ficha || ' → ' || p_new_ficha,
    jsonb_build_object('ficha', p_old_ficha),
    jsonb_build_object('ficha', p_new_ficha),
    'warning',
    'Sistema'
  );

  -- Actualizar en todas las tablas
  UPDATE equipos SET ficha = p_new_ficha WHERE ficha = p_old_ficha;
  UPDATE mantenimientos_programados SET ficha = p_new_ficha WHERE ficha = p_old_ficha;
  UPDATE historial_eventos SET ficha_equipo = p_new_ficha WHERE ficha_equipo = p_old_ficha;
  UPDATE equipment_tickets SET ficha = p_new_ficha WHERE ficha = p_old_ficha;
  UPDATE notificaciones SET ficha_equipo = p_new_ficha WHERE ficha_equipo = p_old_ficha;
  UPDATE overrides_planes SET ficha_equipo = p_new_ficha WHERE ficha_equipo = p_old_ficha;

  RETURN json_build_object(
    'success', true, 
    'message', 'Ficha actualizada de ' || p_old_ficha || ' a ' || p_new_ficha || ' en todo el sistema',
    'equipo_id', v_equipo_id,
    'old_ficha', p_old_ficha,
    'new_ficha', p_new_ficha
  );
END;
$$;
