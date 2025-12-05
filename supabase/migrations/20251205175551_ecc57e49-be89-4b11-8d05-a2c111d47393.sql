-- Fix function search_path mutable warnings
ALTER FUNCTION public.update_submissions_updated_at() SET search_path = public;
ALTER FUNCTION public.actualizar_inventario_post_mantenimiento() SET search_path = public;