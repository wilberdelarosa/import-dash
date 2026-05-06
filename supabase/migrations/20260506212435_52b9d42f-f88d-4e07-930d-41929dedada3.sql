
-- Fix 1: Lock down configuraciones_sistema (sensitive contact info)
DROP POLICY IF EXISTS "Allow public read access to system configuration" ON public.configuraciones_sistema;
DROP POLICY IF EXISTS "Allow public insert access to system configuration" ON public.configuraciones_sistema;
DROP POLICY IF EXISTS "Allow public update access to system configuration" ON public.configuraciones_sistema;

CREATE POLICY "Authenticated can read system config" ON public.configuraciones_sistema
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert system config" ON public.configuraciones_sistema
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update system config" ON public.configuraciones_sistema
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Lock down all USING(true) public-access business tables to authenticated users
-- equipos
DROP POLICY IF EXISTS "Permitir lectura pública de equipos" ON public.equipos;
DROP POLICY IF EXISTS "Permitir inserción pública de equipos" ON public.equipos;
DROP POLICY IF EXISTS "Permitir actualización pública de equipos" ON public.equipos;
DROP POLICY IF EXISTS "Permitir eliminación pública de equipos" ON public.equipos;
CREATE POLICY "Auth read equipos" ON public.equipos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert equipos" ON public.equipos FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update equipos" ON public.equipos FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin delete equipos" ON public.equipos FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- inventarios
DROP POLICY IF EXISTS "Permitir lectura pública de inventarios" ON public.inventarios;
DROP POLICY IF EXISTS "Permitir inserción pública de inventarios" ON public.inventarios;
DROP POLICY IF EXISTS "Permitir actualización pública de inventarios" ON public.inventarios;
DROP POLICY IF EXISTS "Permitir eliminación pública de inventarios" ON public.inventarios;
CREATE POLICY "Auth read inventarios" ON public.inventarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert inventarios" ON public.inventarios FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update inventarios" ON public.inventarios FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin delete inventarios" ON public.inventarios FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- mantenimientos_programados
DROP POLICY IF EXISTS "Permitir lectura pública de mantenimientos" ON public.mantenimientos_programados;
DROP POLICY IF EXISTS "Permitir inserción pública de mantenimientos" ON public.mantenimientos_programados;
DROP POLICY IF EXISTS "Permitir actualización pública de mantenimientos" ON public.mantenimientos_programados;
DROP POLICY IF EXISTS "Permitir eliminación pública de mantenimientos" ON public.mantenimientos_programados;
CREATE POLICY "Auth read mant" ON public.mantenimientos_programados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert mant" ON public.mantenimientos_programados FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update mant" ON public.mantenimientos_programados FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin delete mant" ON public.mantenimientos_programados FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- historial_eventos
DROP POLICY IF EXISTS "Permitir lectura pública de historial" ON public.historial_eventos;
DROP POLICY IF EXISTS "Permitir inserción pública de historial" ON public.historial_eventos;
DROP POLICY IF EXISTS "Permitir eliminación pública de historial" ON public.historial_eventos;
CREATE POLICY "Auth read historial" ON public.historial_eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert historial" ON public.historial_eventos FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admin delete historial" ON public.historial_eventos FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- notificaciones
DROP POLICY IF EXISTS "Permitir lectura pública de notificaciones" ON public.notificaciones;
DROP POLICY IF EXISTS "Permitir inserción pública de notificaciones" ON public.notificaciones;
DROP POLICY IF EXISTS "Permitir actualización pública de notificaciones" ON public.notificaciones;
DROP POLICY IF EXISTS "Permitir eliminación pública de notificaciones" ON public.notificaciones;
CREATE POLICY "Auth read notif" ON public.notificaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert notif" ON public.notificaciones FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update notif" ON public.notificaciones FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth delete notif" ON public.notificaciones FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- planes_mantenimiento
DROP POLICY IF EXISTS "Permitir lectura pública de planes" ON public.planes_mantenimiento;
DROP POLICY IF EXISTS "Permitir inserción pública de planes" ON public.planes_mantenimiento;
DROP POLICY IF EXISTS "Permitir actualización pública de planes" ON public.planes_mantenimiento;
DROP POLICY IF EXISTS "Permitir eliminación pública de planes" ON public.planes_mantenimiento;
CREATE POLICY "Auth read planes" ON public.planes_mantenimiento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write planes" ON public.planes_mantenimiento FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update planes" ON public.planes_mantenimiento FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete planes" ON public.planes_mantenimiento FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- kits_mantenimiento
DROP POLICY IF EXISTS "Permitir lectura pública de kits" ON public.kits_mantenimiento;
DROP POLICY IF EXISTS "Permitir inserción pública de kits" ON public.kits_mantenimiento;
DROP POLICY IF EXISTS "Permitir actualización pública de kits" ON public.kits_mantenimiento;
DROP POLICY IF EXISTS "Permitir eliminación pública de kits" ON public.kits_mantenimiento;
CREATE POLICY "Auth read kits" ON public.kits_mantenimiento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert kits" ON public.kits_mantenimiento FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update kits" ON public.kits_mantenimiento FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete kits" ON public.kits_mantenimiento FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- kit_piezas
DROP POLICY IF EXISTS "Permitir lectura pública de piezas kit" ON public.kit_piezas;
DROP POLICY IF EXISTS "Permitir inserción pública de piezas kit" ON public.kit_piezas;
DROP POLICY IF EXISTS "Permitir actualización pública de piezas kit" ON public.kit_piezas;
DROP POLICY IF EXISTS "Permitir eliminación pública de piezas kit" ON public.kit_piezas;
CREATE POLICY "Auth read kit_piezas" ON public.kit_piezas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert kit_piezas" ON public.kit_piezas FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update kit_piezas" ON public.kit_piezas FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete kit_piezas" ON public.kit_piezas FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- plan_intervalos
DROP POLICY IF EXISTS "Permitir lectura pública de intervalos" ON public.plan_intervalos;
DROP POLICY IF EXISTS "Permitir inserción pública de intervalos" ON public.plan_intervalos;
DROP POLICY IF EXISTS "Permitir actualización pública de intervalos" ON public.plan_intervalos;
DROP POLICY IF EXISTS "Permitir eliminación pública de intervalos" ON public.plan_intervalos;
CREATE POLICY "Auth read plan_int" ON public.plan_intervalos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert plan_int" ON public.plan_intervalos FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update plan_int" ON public.plan_intervalos FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete plan_int" ON public.plan_intervalos FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- plan_intervalo_kits
DROP POLICY IF EXISTS "Permitir lectura pública de plan_intervalo_kits" ON public.plan_intervalo_kits;
DROP POLICY IF EXISTS "Permitir inserción pública de plan_intervalo_kits" ON public.plan_intervalo_kits;
DROP POLICY IF EXISTS "Permitir actualización pública de plan_intervalo_kits" ON public.plan_intervalo_kits;
DROP POLICY IF EXISTS "Permitir eliminación pública de plan_intervalo_kits" ON public.plan_intervalo_kits;
CREATE POLICY "Auth read plan_int_kits" ON public.plan_intervalo_kits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert plan_int_kits" ON public.plan_intervalo_kits FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update plan_int_kits" ON public.plan_intervalo_kits FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete plan_int_kits" ON public.plan_intervalo_kits FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- equipo_planes
DROP POLICY IF EXISTS "Permitir lectura pública de equipo_planes" ON public.equipo_planes;
DROP POLICY IF EXISTS "Permitir inserción pública de equipo_planes" ON public.equipo_planes;
DROP POLICY IF EXISTS "Permitir actualización pública de equipo_planes" ON public.equipo_planes;
DROP POLICY IF EXISTS "Permitir eliminación pública de equipo_planes" ON public.equipo_planes;
CREATE POLICY "Auth read equipo_planes" ON public.equipo_planes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert equipo_planes" ON public.equipo_planes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update equipo_planes" ON public.equipo_planes FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin delete equipo_planes" ON public.equipo_planes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- overrides_planes
DROP POLICY IF EXISTS "Permitir lectura pública de overrides_planes" ON public.overrides_planes;
DROP POLICY IF EXISTS "Permitir inserción pública de overrides_planes" ON public.overrides_planes;
DROP POLICY IF EXISTS "Permitir actualización pública de overrides_planes" ON public.overrides_planes;
DROP POLICY IF EXISTS "Permitir eliminación pública de overrides_planes" ON public.overrides_planes;
CREATE POLICY "Auth read overrides" ON public.overrides_planes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert overrides" ON public.overrides_planes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update overrides" ON public.overrides_planes FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin delete overrides" ON public.overrides_planes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- cat_modelo_intervalo_piezas (catalog - admin write)
DROP POLICY IF EXISTS "Allow public insert to cat_modelo_intervalo_piezas" ON public.cat_modelo_intervalo_piezas;
DROP POLICY IF EXISTS "Allow public update to cat_modelo_intervalo_piezas" ON public.cat_modelo_intervalo_piezas;
CREATE POLICY "Admin insert cat_mip" ON public.cat_modelo_intervalo_piezas FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update cat_mip" ON public.cat_modelo_intervalo_piezas FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- cat_modelos (catalog - admin write)
DROP POLICY IF EXISTS "Allow public insert to cat_modelos" ON public.cat_modelos;
DROP POLICY IF EXISTS "Allow public update to cat_modelos" ON public.cat_modelos;
CREATE POLICY "Admin insert cat_modelos" ON public.cat_modelos FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update cat_modelos" ON public.cat_modelos FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- notificaciones_salientes
DROP POLICY IF EXISTS "Allow public insert to notificaciones_salientes" ON public.notificaciones_salientes;
DROP POLICY IF EXISTS "Allow public read access to notificaciones_salientes" ON public.notificaciones_salientes;
CREATE POLICY "Auth read notif_sal" ON public.notificaciones_salientes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert notif_sal" ON public.notificaciones_salientes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Fix 3: Tighten maintenance_submissions - already has good policies; ensure no broad access (no change needed - policies are owner/admin/supervisor)

-- Fix 4: Tighten equipment_tickets to admin/supervisor/creator only (removes broad authenticated read)
DROP POLICY IF EXISTS "Authenticated users can view tickets" ON public.equipment_tickets;
CREATE POLICY "Restricted ticket view" ON public.equipment_tickets FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'supervisor'::app_role)
    OR (created_by)::text = (SELECT email FROM auth.users WHERE id = auth.uid())::text
    OR (assigned_to)::text = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  );

-- Fix 5: Function search_path - add SET search_path to function missing it
CREATE OR REPLACE FUNCTION public.calcular_proximo_mantenimiento(p_horas_actuales numeric, p_plan_id bigint)
 RETURNS TABLE(intervalo_id bigint, intervalo_codigo text, intervalo_nombre text, horas_intervalo integer, horas_proximo numeric, kit_id bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    pi.id, pi.codigo, pi.nombre, pi.horas_intervalo,
    CEIL(p_horas_actuales / pi.horas_intervalo) * pi.horas_intervalo AS horas_proximo,
    pik.kit_id
  FROM public.plan_intervalos pi
  LEFT JOIN public.plan_intervalo_kits pik ON pik.plan_intervalo_id = pi.id
  WHERE pi.plan_id = p_plan_id AND pi.es_activo = true
  ORDER BY pi.orden ASC, pi.horas_intervalo ASC
  LIMIT 1;
END;
$function$;
