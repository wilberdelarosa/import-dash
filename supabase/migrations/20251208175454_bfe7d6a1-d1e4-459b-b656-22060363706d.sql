
-- Corregir advertencia de seguridad: SECURITY INVOKER para la vista
DROP VIEW IF EXISTS public.equipos_con_overrides;

CREATE VIEW public.equipos_con_overrides 
WITH (security_invoker = true) AS
SELECT 
  o.ficha_equipo,
  o.plan_original_id,
  o.plan_forzado_id,
  o.motivo,
  o.usuario_email,
  o.created_at AS override_fecha,
  pm_original.nombre AS plan_original_nombre,
  pm_forzado.nombre AS plan_forzado_nombre,
  pm_forzado.marca AS plan_marca,
  pm_forzado.modelo AS plan_modelo
FROM public.overrides_planes o
LEFT JOIN public.planes_mantenimiento pm_original ON o.plan_original_id = pm_original.id
JOIN public.planes_mantenimiento pm_forzado ON o.plan_forzado_id = pm_forzado.id
WHERE o.activo = true;

COMMENT ON VIEW public.equipos_con_overrides IS 'Vista de equipos con override activo (security_invoker = true)';
