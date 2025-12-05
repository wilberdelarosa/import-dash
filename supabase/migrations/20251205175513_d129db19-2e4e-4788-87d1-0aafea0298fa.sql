-- =============================================
-- MIGRACIÓN: Roles Mecánico y Supervisor
-- =============================================

-- 1. Agregar 'mechanic' al enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mechanic';

-- 2. Tabla de submissions de mantenimiento (propuestas del mecánico)
CREATE TABLE IF NOT EXISTS public.maintenance_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipo_id INTEGER NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  
  -- Datos del mantenimiento
  fecha_mantenimiento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  horas_km_actuales INTEGER NOT NULL,
  tipo_mantenimiento TEXT,
  descripcion_trabajo TEXT,
  observaciones TEXT,
  
  -- Partes utilizadas (JSON array)
  partes_usadas JSONB DEFAULT '[]'::jsonb,
  
  -- Estado del flujo
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'integrated')),
  
  -- Revisión del admin
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_feedback TEXT,
  
  -- Vinculación con mantenimiento oficial (después de integrar)
  linked_maintenance_id INTEGER REFERENCES public.mantenimientos_programados(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de adjuntos (fotos, documentos)
CREATE TABLE IF NOT EXISTS public.submission_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.maintenance_submissions(id) ON DELETE CASCADE,
  
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_submissions_created_by ON public.maintenance_submissions(created_by);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.maintenance_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_equipo ON public.maintenance_submissions(equipo_id);
CREATE INDEX IF NOT EXISTS idx_attachments_submission ON public.submission_attachments(submission_id);

-- 5. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_submissions_updated_at ON public.maintenance_submissions;
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.maintenance_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_submissions_updated_at();

-- 6. Enable RLS
ALTER TABLE public.maintenance_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_attachments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies para maintenance_submissions

-- Mecánicos pueden insertar sus propios submissions
CREATE POLICY "Mechanics can insert own submissions"
  ON public.maintenance_submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Usuarios pueden ver sus propios submissions; admin y supervisor pueden ver todos
CREATE POLICY "Users can view submissions"
  ON public.maintenance_submissions
  FOR SELECT TO authenticated
  USING (
    auth.uid() = created_by
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'supervisor')
  );

-- Solo admins pueden actualizar submissions
CREATE POLICY "Admins can update submissions"
  ON public.maintenance_submissions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 8. RLS Policies para submission_attachments

-- Mecánicos pueden insertar adjuntos en sus propios submissions
CREATE POLICY "Users can insert own attachments"
  ON public.submission_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.maintenance_submissions ms
      WHERE ms.id = submission_id AND ms.created_by = auth.uid()
    )
  );

-- Usuarios pueden ver adjuntos de sus submissions; admin/supervisor pueden ver todos
CREATE POLICY "Users can view attachments"
  ON public.submission_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.maintenance_submissions ms
      WHERE ms.id = submission_id AND ms.created_by = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'supervisor')
  );

-- 9. Función RPC: Aprobar e integrar submission
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
BEGIN
  -- Verificar que el usuario es admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo administradores pueden aprobar submissions';
  END IF;

  -- Obtener submission
  SELECT * INTO v_submission FROM maintenance_submissions WHERE id = p_submission_id;

  IF v_submission IS NULL THEN
    RAISE EXCEPTION 'Submission no encontrada';
  END IF;

  IF v_submission.status != 'pending' THEN
    RAISE EXCEPTION 'Solo se pueden aprobar submissions pendientes';
  END IF;

  v_mechanic_id := v_submission.created_by;

  -- Obtener datos del equipo
  SELECT * INTO v_equipo FROM equipos WHERE id = v_submission.equipo_id;

  -- Actualizar submission como integrada
  UPDATE maintenance_submissions SET
    status = 'integrated',
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    admin_feedback = p_admin_feedback
  WHERE id = p_submission_id;

  -- Crear notificación para el mecánico
  INSERT INTO notificaciones (tipo, nivel, titulo, mensaje, ficha_equipo, nombre_equipo, metadata)
  VALUES (
    'submission_approved',
    'info',
    'Reporte Aprobado',
    'Tu reporte de mantenimiento ha sido aprobado e integrado al sistema.',
    v_equipo.ficha,
    v_equipo.nombre,
    jsonb_build_object('submission_id', p_submission_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Submission aprobada e integrada correctamente'
  );
END;
$$;

-- 10. Función para rechazar submission
CREATE OR REPLACE FUNCTION public.reject_submission(
  p_submission_id UUID,
  p_feedback TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission maintenance_submissions%ROWTYPE;
  v_equipo RECORD;
BEGIN
  -- Verificar admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo administradores pueden rechazar submissions';
  END IF;

  SELECT * INTO v_submission FROM maintenance_submissions WHERE id = p_submission_id;

  IF v_submission IS NULL OR v_submission.status != 'pending' THEN
    RAISE EXCEPTION 'Submission no válida para rechazo';
  END IF;

  -- Obtener datos del equipo
  SELECT * INTO v_equipo FROM equipos WHERE id = v_submission.equipo_id;

  UPDATE maintenance_submissions SET
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    admin_feedback = p_feedback
  WHERE id = p_submission_id;

  -- Notificar al mecánico
  INSERT INTO notificaciones (tipo, nivel, titulo, mensaje, ficha_equipo, nombre_equipo, metadata)
  VALUES (
    'submission_rejected',
    'warning',
    'Reporte Rechazado',
    'Tu reporte necesita correcciones: ' || p_feedback,
    v_equipo.ficha,
    v_equipo.nombre,
    jsonb_build_object('submission_id', p_submission_id, 'feedback', p_feedback)
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Submission rechazada correctamente'
  );
END;
$$;

-- 11. Trigger para notificar admins cuando se crea un submission
CREATE OR REPLACE FUNCTION public.notify_admins_new_submission()
RETURNS TRIGGER AS $$
DECLARE
  v_equipo RECORD;
BEGIN
  -- Obtener datos del equipo
  SELECT * INTO v_equipo FROM equipos WHERE id = NEW.equipo_id;

  -- Crear notificación para admins
  INSERT INTO notificaciones (tipo, nivel, titulo, mensaje, ficha_equipo, nombre_equipo, metadata)
  VALUES (
    'new_submission',
    'info',
    'Nuevo Reporte de Mecánico',
    'Se ha recibido un nuevo reporte de mantenimiento para revisión.',
    v_equipo.ficha,
    v_equipo.nombre,
    jsonb_build_object('submission_id', NEW.id, 'equipo_id', NEW.equipo_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_submission_created ON public.maintenance_submissions;
CREATE TRIGGER on_submission_created
  AFTER INSERT ON public.maintenance_submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_submission();

-- 12. Crear bucket de storage para submissions (si no existe se crea manualmente)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false) ON CONFLICT DO NOTHING;