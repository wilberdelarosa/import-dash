-- Actualizar función para generar notificaciones de mantenimientos con search_path seguro
CREATE OR REPLACE FUNCTION generar_notificaciones_mantenimientos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar notificaciones para mantenimientos vencidos (que no existan ya)
  INSERT INTO public.notificaciones (tipo, titulo, mensaje, ficha_equipo, nombre_equipo, nivel, accion_url, metadata)
  SELECT 
    'mantenimiento_vencido',
    'Mantenimiento Vencido: ' || nombre_equipo,
    'El equipo ' || nombre_equipo || ' tiene un mantenimiento vencido por ' || ABS(horas_km_restante) || ' unidades.',
    ficha,
    nombre_equipo,
    'critical',
    '/mantenimiento?ficha=' || ficha,
    jsonb_build_object(
      'horas_km_restante', horas_km_restante,
      'proximo_mantenimiento', proximo_mantenimiento
    )
  FROM public.mantenimientos_programados
  WHERE activo = true 
    AND horas_km_restante < 0
    AND NOT EXISTS (
      SELECT 1 FROM public.notificaciones n
      WHERE n.tipo = 'mantenimiento_vencido'
        AND n.ficha_equipo = mantenimientos_programados.ficha
        AND n.leida = false
    );
  
  -- Insertar notificaciones para mantenimientos próximos (dentro de 50 unidades)
  INSERT INTO public.notificaciones (tipo, titulo, mensaje, ficha_equipo, nombre_equipo, nivel, accion_url, metadata)
  SELECT 
    'mantenimiento_proximo',
    'Mantenimiento Próximo: ' || nombre_equipo,
    'El equipo ' || nombre_equipo || ' necesitará mantenimiento en ' || horas_km_restante || ' unidades.',
    ficha,
    nombre_equipo,
    'warning',
    '/mantenimiento?ficha=' || ficha,
    jsonb_build_object(
      'horas_km_restante', horas_km_restante,
      'proximo_mantenimiento', proximo_mantenimiento
    )
  FROM public.mantenimientos_programados
  WHERE activo = true 
    AND horas_km_restante > 0 
    AND horas_km_restante <= 50
    AND NOT EXISTS (
      SELECT 1 FROM public.notificaciones n
      WHERE n.tipo = 'mantenimiento_proximo'
        AND n.ficha_equipo = mantenimientos_programados.ficha
        AND n.leida = false
    );
END;
$$;

-- Actualizar función para generar notificaciones de stock bajo con search_path seguro
CREATE OR REPLACE FUNCTION generar_notificaciones_stock_bajo()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notificaciones (tipo, titulo, mensaje, nivel, accion_url, metadata)
  SELECT 
    'stock_bajo',
    'Stock Bajo: ' || nombre,
    'El inventario ' || nombre || ' tiene solo ' || cantidad || ' unidades disponibles.',
    CASE 
      WHEN cantidad = 0 THEN 'critical'
      WHEN cantidad <= 3 THEN 'warning'
      ELSE 'info'
    END,
    '/inventario',
    jsonb_build_object(
      'id_inventario', id,
      'cantidad', cantidad,
      'codigo', codigo_identificacion
    )
  FROM public.inventarios
  WHERE activo = true 
    AND cantidad <= 5
    AND NOT EXISTS (
      SELECT 1 FROM public.notificaciones n
      WHERE n.tipo = 'stock_bajo'
        AND (n.metadata->>'id_inventario')::bigint = inventarios.id
        AND n.leida = false
    );
END;
$$;