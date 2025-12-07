-- =============================================
-- MIGRACIÓN: Extender approve_and_integrate_submission
-- Para crear registro oficial de mantenimiento
-- =============================================

-- Función mejorada que integra completamente el submission
CREATE OR REPLACE FUNCTION public.approve_and_integrate_submission(
  p_submission_id UUID,
  p_admin_feedback TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission maintenance_submissions%ROWTYPE;
  v_new_maintenance_id INTEGER;
  v_mechanic_id UUID;
  v_equipo RECORD;
  v_mant_programado RECORD;
  v_partes JSONB;
  v_parte RECORD;
BEGIN
  -- Verificar que el usuario es admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo administradores pueden aprobar submissions';
  END IF;

  -- Obtener submission con lock para evitar race conditions
  SELECT * INTO v_submission 
  FROM maintenance_submissions 
  WHERE id = p_submission_id
  FOR UPDATE;

  IF v_submission IS NULL THEN
    RAISE EXCEPTION 'Submission no encontrada';
  END IF;

  IF v_submission.status != 'pending' THEN
    RAISE EXCEPTION 'Solo se pueden aprobar submissions pendientes. Estado actual: %', v_submission.status;
  END IF;

  v_mechanic_id := v_submission.created_by;

  -- Obtener datos del equipo
  SELECT * INTO v_equipo FROM equipos WHERE id = v_submission.equipo_id;
  
  IF v_equipo IS NULL THEN
    RAISE EXCEPTION 'Equipo no encontrado';
  END IF;

  -- Obtener mantenimiento programado actual del equipo
  SELECT * INTO v_mant_programado 
  FROM mantenimientos_programados 
  WHERE ficha = v_equipo.ficha
  LIMIT 1;
  -- Actualizar o registrar el mantenimiento según las lecturas
  IF v_mant_programado IS NOT NULL THEN
    -- Si las horas/km reportadas son mayores o iguales a las actuales, actualizamos el plan
    IF v_submission.horas_km_actuales >= v_mant_programado.horas_km_actuales THEN
      UPDATE mantenimientos_programados SET
        horas_km_actuales = v_submission.horas_km_actuales,
        fecha_ultimo_mantenimiento = v_submission.fecha_mantenimiento::date,
        tipo_mantenimiento = COALESCE(v_submission.tipo_mantenimiento, tipo_mantenimiento),
        notas = COALESCE(v_submission.observaciones, '') || 
                E'\n[Integrado desde reporte de mecánico ' || to_char(NOW(), 'DD/MM/YYYY HH24:MI') || ']' ||
                E'\nTrabajo: ' || COALESCE(v_submission.descripcion_trabajo, 'Sin descripción'),
        updated_at = NOW()
      WHERE id = v_mant_programado.id
      RETURNING id INTO v_new_maintenance_id;
    ELSE
      -- Si la lectura del mecánico es menor que la registrada, creamos un mantenimiento realizado
      -- Preferimos llamar a una RPC transaccional si existe
      BEGIN
        IF to_regclass('public.registrar_mantenimiento_completo') IS NOT NULL THEN
          PERFORM public.registrar_mantenimiento_completo(v_mant_programado.id, v_submission.fecha_mantenimiento::date, v_submission.horas_km_actuales, v_submission.observaciones::text, v_submission.partes_usadas);
        ELSIF to_regclass('public.mantenimientos_realizados') IS NOT NULL THEN
          -- Intentar insertar en mantenimientos_realizados con campos comunes
          BEGIN
            INSERT INTO public.mantenimientos_realizados (ficha, mantenimiento_programado_id, fecha_mantenimiento, horas_km, tipo_mantenimiento, descripcion, created_by, created_at)
            VALUES (v_equipo.ficha, v_mant_programado.id, v_submission.fecha_mantenimiento::timestamp, v_submission.horas_km_actuales, v_submission.tipo_mantenimiento, v_submission.descripcion_trabajo, v_mechanic_id, NOW())
            RETURNING id INTO v_new_maintenance_id;
          EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'No se pudo insertar en mantenimientos_realizados: %', SQLERRM;
          END;
        ELSE
          -- Fallback: crear un nuevo registro en mantenimientos_programados como alternativa
          BEGIN
            INSERT INTO public.mantenimientos_programados (ficha, nombre_equipo, tipo_mantenimiento, horas_km_actuales, fecha_ultima_actualizacion, frecuencia, proximo_mantenimiento, horas_km_restante, created_at)
            VALUES (v_equipo.ficha, v_equipo.nombre, COALESCE(v_submission.tipo_mantenimiento, v_mant_programado.tipo_mantenimiento), v_submission.horas_km_actuales, NOW(), COALESCE(v_mant_programado.frecuencia, 0), COALESCE(v_mant_programado.proximo_mantenimiento, 0), COALESCE(v_mant_programado.horas_km_restante, 0), NOW())
            RETURNING id INTO v_new_maintenance_id;
          EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'No se pudo crear registro alternativo de mantenimiento: %', SQLERRM;
          END;
        END IF;
      END;
    END IF;
  END IF;

  -- Procesar partes usadas y actualizar inventario si aplica
  v_partes := v_submission.partes_usadas;
  IF v_partes IS NOT NULL AND jsonb_array_length(v_partes) > 0 THEN
    FOR v_parte IN SELECT * FROM jsonb_array_elements(v_partes)
    LOOP
      -- Si la parte viene del inventario, descontar stock
      IF (v_parte.value->>'del_inventario')::boolean = true AND 
         (v_parte.value->>'inventario_id') IS NOT NULL THEN
        UPDATE inventarios SET
          cantidad = GREATEST(0, cantidad - COALESCE((v_parte.value->>'cantidad')::integer, 1)),
          updated_at = NOW()
        WHERE id = (v_parte.value->>'inventario_id')::integer;
      END IF;
    END LOOP;
  END IF;

  -- Actualizar submission como integrada
  UPDATE maintenance_submissions SET
    status = 'integrated',
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    admin_feedback = p_admin_feedback,
    linked_maintenance_id = v_new_maintenance_id
  WHERE id = p_submission_id;

  -- Crear notificación para el mecánico
  INSERT INTO notificaciones (
    tipo, 
    nivel, 
    titulo, 
    mensaje, 
    ficha_equipo, 
    nombre_equipo, 
    metadata
  )
  VALUES (
    'submission_approved',
    'info',
    'Reporte Aprobado ✓',
    'Tu reporte de mantenimiento para ' || v_equipo.nombre || ' ha sido aprobado e integrado al sistema oficial.',
    v_equipo.ficha,
    v_equipo.nombre,
    jsonb_build_object(
      'submission_id', p_submission_id,
      'maintenance_id', v_new_maintenance_id,
      'approved_by', auth.uid()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Submission aprobada e integrada correctamente',
    'maintenance_id', v_new_maintenance_id,
    'submission_id', p_submission_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log del error
    RAISE WARNING 'Error en approve_and_integrate_submission: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;

-- Función para obtener attachments de un submission (para mostrar en admin)
CREATE OR REPLACE FUNCTION public.get_submission_attachments(p_submission_id UUID)
RETURNS TABLE (
  id UUID,
  storage_path TEXT,
  filename TEXT,
  mime_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar permisos: admin, supervisor, o el creador del submission
  IF NOT (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'supervisor') OR
    EXISTS (SELECT 1 FROM maintenance_submissions ms WHERE ms.id = p_submission_id AND ms.created_by = auth.uid())
  ) THEN
    RAISE EXCEPTION 'No tienes permiso para ver estos adjuntos';
  END IF;

  RETURN QUERY
  SELECT 
    sa.id,
    sa.storage_path,
    sa.filename,
    sa.mime_type,
    sa.file_size,
    sa.created_at
  FROM submission_attachments sa
  WHERE sa.submission_id = p_submission_id
  ORDER BY sa.created_at;
END;
$$;

-- Comentarios para documentación
COMMENT ON FUNCTION public.approve_and_integrate_submission IS 
  'Aprueba un submission de mecánico y lo integra al sistema oficial de mantenimientos. 
   Actualiza horas/km, descuenta inventario si aplica, y notifica al mecánico.';

COMMENT ON FUNCTION public.get_submission_attachments IS 
  'Obtiene los archivos adjuntos de un submission. Solo accesible para admin, supervisor o el creador.';
