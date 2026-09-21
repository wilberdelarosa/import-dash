CREATE OR REPLACE FUNCTION public.approve_and_integrate_submission(p_submission_id uuid, p_admin_feedback text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_submission RECORD;
  v_historial_id INTEGER;
  v_equipo_ficha TEXT;
  v_equipo_nombre TEXT;
  v_partes_usadas JSONB;
  v_frecuencia NUMERIC;
  v_nuevo_proximo NUMERIC;
  v_mantenimiento_id BIGINT;
  v_horas_previas NUMERIC;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;

  SELECT * INTO v_submission
  FROM maintenance_submissions
  WHERE id = p_submission_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Submission no encontrado o ya procesado');
  END IF;

  SELECT ficha, nombre INTO v_equipo_ficha, v_equipo_nombre
  FROM equipos WHERE id = v_submission.equipo_id;

  SELECT id, frecuencia, horas_km_ultimo_mantenimiento
  INTO v_mantenimiento_id, v_frecuencia, v_horas_previas
  FROM mantenimientos_programados
  WHERE ficha = v_equipo_ficha AND activo = true
  ORDER BY id
  LIMIT 1;

  v_nuevo_proximo := v_submission.horas_km_actuales + COALESCE(v_frecuencia, 250);

  IF v_submission.partes_usadas IS NULL OR jsonb_typeof(v_submission.partes_usadas) <> 'array' THEN
    v_partes_usadas := '[]'::jsonb;
  ELSE
    v_partes_usadas := v_submission.partes_usadas;
  END IF;

  INSERT INTO historial_eventos (
    tipo_evento, modulo, ficha_equipo, nombre_equipo, descripcion, metadata,
    datos_antes, datos_despues, usuario_responsable, partes_consumidas
  ) VALUES (
    'mantenimiento_realizado',
    'mantenimientos',
    v_equipo_ficha,
    v_equipo_nombre,
    COALESCE(v_submission.descripcion_trabajo, 'Mantenimiento realizado por mecánico'),
    jsonb_build_object(
      'id', v_mantenimiento_id,
      'submissionId', p_submission_id,
      'ficha', v_equipo_ficha,
      'nombreEquipo', v_equipo_nombre,
      'horasKmAlMomento', v_submission.horas_km_actuales,
      'horasPrevias', COALESCE(v_horas_previas, 0),
      'incrementoDesdeUltimo', v_submission.horas_km_actuales - COALESCE(v_horas_previas, 0),
      'tipoMantenimiento', v_submission.tipo_mantenimiento,
      'filtrosUtilizados', v_partes_usadas,
      'partes_usadas', v_partes_usadas,
      'observaciones', v_submission.observaciones,
      'fechaMantenimiento', v_submission.fecha_mantenimiento,
      'proximoMantenimientoCalculado', v_nuevo_proximo,
      'unidad', 'horas'
    ),
    jsonb_build_object(
      'horasKmUltimoMantenimiento', COALESCE(v_horas_previas, 0)
    ),
    jsonb_build_object(
      'horasKmAlMomento', v_submission.horas_km_actuales,
      'incrementoDesdeUltimo', v_submission.horas_km_actuales - COALESCE(v_horas_previas, 0),
      'tipoMantenimiento', v_submission.tipo_mantenimiento,
      'filtrosUtilizados', v_partes_usadas,
      'observaciones', v_submission.observaciones,
      'fechaMantenimiento', v_submission.fecha_mantenimiento,
      'unidad', 'horas'
    ),
    (SELECT email FROM auth.users WHERE id = v_submission.created_by),
    v_partes_usadas
  )
  RETURNING id INTO v_historial_id;

  UPDATE mantenimientos_programados
  SET
    horas_km_actuales = GREATEST(horas_km_actuales, v_submission.horas_km_actuales),
    horas_km_ultimo_mantenimiento = v_submission.horas_km_actuales,
    fecha_ultimo_mantenimiento = v_submission.fecha_mantenimiento,
    fecha_ultima_actualizacion = GREATEST(fecha_ultima_actualizacion, v_submission.fecha_mantenimiento),
    proximo_mantenimiento = v_nuevo_proximo,
    horas_km_restante = v_nuevo_proximo - GREATEST(horas_km_actuales, v_submission.horas_km_actuales),
    partes_consumidas = v_partes_usadas
  WHERE id = v_mantenimiento_id;

  UPDATE maintenance_submissions
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = NOW(),
      admin_feedback = COALESCE(p_admin_feedback, 'Aprobado e integrado al sistema')
  WHERE id = p_submission_id;

  INSERT INTO notificaciones (tipo, titulo, mensaje, nivel, ficha_equipo, metadata)
  VALUES (
    'submission_approved', 'Reporte Aprobado',
    'Tu reporte de mantenimiento para ' || v_equipo_ficha || ' ha sido aprobado. Próximo servicio: ' || v_nuevo_proximo || ' hrs.',
    'info', v_equipo_ficha,
    jsonb_build_object('submission_id', p_submission_id, 'historial_id', v_historial_id, 'proximo_mantenimiento', v_nuevo_proximo)
  );

  RETURN json_build_object(
    'success', true, 'historial_id', v_historial_id,
    'message', 'Mantenimiento registrado. Próximo servicio: ' || v_nuevo_proximo || ' hrs',
    'equipo_ficha', v_equipo_ficha, 'proximo_mantenimiento', v_nuevo_proximo
  );
END;
$function$;