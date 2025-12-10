-- Corregir función: linked_maintenance_id debe ser NULL ya que historial_eventos no es referenciado
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
  v_partes_usadas JSONB;
BEGIN
  -- Verificar permisos de admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;

  -- Obtener el submission pendiente
  SELECT * INTO v_submission
  FROM maintenance_submissions
  WHERE id = p_submission_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Submission no encontrado o ya procesado');
  END IF;

  -- Obtener la ficha del equipo
  SELECT ficha INTO v_equipo_ficha FROM equipos WHERE id = v_submission.equipo_id;

  -- Asegurar que partes_usadas es un array válido
  IF v_submission.partes_usadas IS NULL THEN
    v_partes_usadas := '[]'::jsonb;
  ELSIF jsonb_typeof(v_submission.partes_usadas) = 'array' THEN
    v_partes_usadas := v_submission.partes_usadas;
  ELSE
    v_partes_usadas := '[]'::jsonb;
  END IF;

  -- Insertar en historial_eventos
  INSERT INTO historial_eventos (
    tipo_evento, modulo, ficha_equipo, descripcion, metadata, usuario_responsable, partes_consumidas
  ) VALUES (
    'mantenimiento_realizado',
    'mantenimientos',
    v_equipo_ficha,
    COALESCE(v_submission.descripcion_trabajo, 'Mantenimiento realizado por mecánico'),
    jsonb_build_object(
      'submission_id', p_submission_id,
      'horas_km_actuales', v_submission.horas_km_actuales,
      'tipo_mantenimiento', v_submission.tipo_mantenimiento,
      'partes_usadas', v_partes_usadas,
      'observaciones', v_submission.observaciones,
      'fecha_mantenimiento', v_submission.fecha_mantenimiento
    ),
    (SELECT email FROM auth.users WHERE id = v_submission.created_by),
    v_partes_usadas
  )
  RETURNING id INTO v_historial_id;

  -- ACTUALIZAR mantenimientos_programados con las nuevas horas
  UPDATE mantenimientos_programados
  SET 
    horas_km_actuales = v_submission.horas_km_actuales,
    horas_km_ultimo_mantenimiento = v_submission.horas_km_actuales,
    fecha_ultimo_mantenimiento = v_submission.fecha_mantenimiento,
    fecha_ultima_actualizacion = NOW(),
    horas_km_restante = proximo_mantenimiento - v_submission.horas_km_actuales,
    partes_consumidas = v_partes_usadas
  WHERE ficha = v_equipo_ficha AND activo = true;

  -- Actualizar el submission (linked_maintenance_id se deja NULL ya que es FK a mantenimientos_programados, no historial)
  UPDATE maintenance_submissions
  SET 
    status = 'approved', 
    reviewed_by = auth.uid(), 
    reviewed_at = NOW(),
    admin_feedback = COALESCE(p_admin_feedback, 'Aprobado e integrado al sistema')
  WHERE id = p_submission_id;

  -- Crear notificación para el mecánico
  INSERT INTO notificaciones (tipo, titulo, mensaje, nivel, ficha_equipo, metadata)
  VALUES (
    'submission_approved',
    'Reporte Aprobado',
    'Tu reporte de mantenimiento para ' || v_equipo_ficha || ' ha sido aprobado e integrado al sistema.',
    'info',
    v_equipo_ficha,
    jsonb_build_object('submission_id', p_submission_id, 'historial_id', v_historial_id)
  );

  RETURN json_build_object(
    'success', true, 
    'historial_id', v_historial_id, 
    'message', 'Submission aprobado e integrado correctamente',
    'equipo_ficha', v_equipo_ficha
  );
END;
$function$;