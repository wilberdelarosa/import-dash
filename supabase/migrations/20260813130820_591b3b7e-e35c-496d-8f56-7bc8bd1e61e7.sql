
-- 1) Email del usuario actual sin exponer auth.users
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;

DROP POLICY IF EXISTS "Restricted ticket view" ON public.equipment_tickets;
CREATE POLICY "Restricted ticket view"
ON public.equipment_tickets FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor')
  OR created_by::text = public.current_user_email()
  OR assigned_to::text = public.current_user_email()
);

DROP POLICY IF EXISTS "Users can update tickets" ON public.equipment_tickets;
CREATE POLICY "Users can update tickets"
ON public.equipment_tickets FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor')
  OR created_by::text = public.current_user_email()
);

-- 2) Realtime: replica identity + publicacion
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'equipos','mantenimientos_programados','inventarios','historial_eventos',
    'notificaciones','maintenance_submissions','overrides_planes','equipo_planes',
    'planes_mantenimiento','plan_intervalos','plan_intervalo_kits',
    'kits_mantenimiento','kit_piezas','equipment_tickets','ticket_history'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- 3) Continuidad: mantenimientos de equipos inactivos/vendidos
CREATE OR REPLACE FUNCTION public.sync_mantenimientos_equipo_estado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.activo = false OR NEW.empresa = 'VENDIDO' THEN
    UPDATE public.mantenimientos_programados
       SET activo = false
     WHERE ficha = NEW.ficha AND activo = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_mantenimientos_equipo_estado ON public.equipos;
CREATE TRIGGER trg_sync_mantenimientos_equipo_estado
AFTER UPDATE OF activo, empresa ON public.equipos
FOR EACH ROW EXECUTE FUNCTION public.sync_mantenimientos_equipo_estado();

UPDATE public.mantenimientos_programados m
   SET activo = false
  FROM public.equipos e
 WHERE e.ficha = m.ficha AND m.activo = true
   AND (e.activo = false OR e.empresa = 'VENDIDO');
