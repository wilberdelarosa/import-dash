-- =============================================
-- MIGRACIÓN COMPLETA: Correcciones de BD
-- =============================================

-- TAREA 1: Agregar columna empresa a equipos
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS empresa TEXT DEFAULT 'ALITO GROUP SRL';
UPDATE equipos SET empresa = 'ALITO GROUP SRL' WHERE empresa IS NULL;
ALTER TABLE equipos ALTER COLUMN empresa SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_equipos_empresa ON equipos(empresa);
COMMENT ON COLUMN equipos.empresa IS 'Empresa propietaria del equipo: ALITO GROUP SRL o ALITO EIRL';

-- TAREA 3: Crear/actualizar funciones RPC para submissions
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
  v_submission RECORD;
  v_maintenance_id INTEGER;
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

  INSERT INTO historial_eventos (
    tipo_evento, modulo, ficha_equipo, descripcion, metadata, usuario_responsable
  ) VALUES (
    'mantenimiento_realizado',
    'mantenimientos',
    (SELECT ficha FROM equipos WHERE id = v_submission.equipo_id),
    v_submission.descripcion_trabajo,
    jsonb_build_object(
      'submission_id', p_submission_id,
      'horas_km_actuales', v_submission.horas_km_actuales,
      'tipo_mantenimiento', v_submission.tipo_mantenimiento,
      'partes_usadas', v_submission.partes_usadas,
      'observaciones', v_submission.observaciones
    ),
    (SELECT email FROM auth.users WHERE id = v_submission.created_by)
  )
  RETURNING id INTO v_maintenance_id;

  UPDATE maintenance_submissions
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = NOW(),
      admin_feedback = p_admin_feedback, linked_maintenance_id = v_maintenance_id
  WHERE id = p_submission_id;

  RETURN json_build_object('success', true, 'maintenance_id', v_maintenance_id, 'message', 'Submission aprobado e integrado correctamente');
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_submission(
  p_submission_id UUID,
  p_feedback TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM maintenance_submissions WHERE id = p_submission_id AND status = 'pending') THEN
    RETURN json_build_object('success', false, 'error', 'Submission no encontrado o ya procesado');
  END IF;

  UPDATE maintenance_submissions
  SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = NOW(), admin_feedback = p_feedback
  WHERE id = p_submission_id;

  RETURN json_build_object('success', true, 'message', 'Submission rechazado');
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_and_integrate_submission(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_submission(UUID, TEXT) TO authenticated;

-- TAREA 5: Función get_users_with_emails
CREATE OR REPLACE FUNCTION public.get_users_with_emails()
RETURNS TABLE (id UUID, email TEXT, created_at TIMESTAMPTZ, last_sign_in_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.id, au.email, au.created_at, au.last_sign_in_at
  FROM auth.users au ORDER BY au.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_users_with_emails() TO authenticated;

-- TAREA 6: Crear bucket de storage para submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('submissions', 'submissions', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para el bucket submissions
CREATE POLICY "Authenticated users can upload submission files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'submissions');

CREATE POLICY "Users can view own submission files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'submissions');