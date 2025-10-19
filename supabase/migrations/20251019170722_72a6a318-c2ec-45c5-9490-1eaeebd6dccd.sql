-- Tabla de historial de eventos del sistema
CREATE TABLE IF NOT EXISTS public.historial_eventos (
  id bigserial PRIMARY KEY,
  tipo_evento text NOT NULL, -- 'crear', 'actualizar', 'eliminar', 'mantenimiento_realizado', 'stock_movido', etc.
  modulo text NOT NULL, -- 'equipos', 'inventarios', 'mantenimientos', 'sistema'
  ficha_equipo text,
  nombre_equipo text,
  usuario_responsable text NOT NULL DEFAULT 'Sistema',
  descripcion text NOT NULL,
  datos_antes jsonb,
  datos_despues jsonb,
  nivel_importancia text NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  metadata jsonb, -- Datos adicionales flexibles
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para mejorar performance de consultas
CREATE INDEX idx_historial_tipo_evento ON public.historial_eventos(tipo_evento);
CREATE INDEX idx_historial_modulo ON public.historial_eventos(modulo);
CREATE INDEX idx_historial_ficha ON public.historial_eventos(ficha_equipo);
CREATE INDEX idx_historial_created_at ON public.historial_eventos(created_at DESC);
CREATE INDEX idx_historial_nivel ON public.historial_eventos(nivel_importancia);

-- Habilitar RLS
ALTER TABLE public.historial_eventos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (lectura pública para simplificar)
CREATE POLICY "Permitir lectura pública de historial"
  ON public.historial_eventos
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción pública de historial"
  ON public.historial_eventos
  FOR INSERT
  WITH CHECK (true);

-- Tabla de notificaciones/alertas
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id bigserial PRIMARY KEY,
  tipo text NOT NULL, -- 'mantenimiento_vencido', 'stock_bajo', 'equipo_inactivo', etc.
  titulo text NOT NULL,
  mensaje text NOT NULL,
  ficha_equipo text,
  nombre_equipo text,
  nivel text NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  leida boolean NOT NULL DEFAULT false,
  accion_url text, -- URL para navegar cuando se hace clic
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para notificaciones
CREATE INDEX idx_notificaciones_tipo ON public.notificaciones(tipo);
CREATE INDEX idx_notificaciones_leida ON public.notificaciones(leida);
CREATE INDEX idx_notificaciones_nivel ON public.notificaciones(nivel);
CREATE INDEX idx_notificaciones_created_at ON public.notificaciones(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notificaciones
CREATE POLICY "Permitir lectura pública de notificaciones"
  ON public.notificaciones
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción pública de notificaciones"
  ON public.notificaciones
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de notificaciones"
  ON public.notificaciones
  FOR UPDATE
  USING (true);

CREATE POLICY "Permitir eliminación pública de notificaciones"
  ON public.notificaciones
  FOR DELETE
  USING (true);

-- Función para generar notificaciones automáticas basadas en mantenimientos vencidos
CREATE OR REPLACE FUNCTION generar_notificaciones_mantenimientos()
RETURNS void
LANGUAGE plpgsql
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

-- Función para generar notificaciones de stock bajo
CREATE OR REPLACE FUNCTION generar_notificaciones_stock_bajo()
RETURNS void
LANGUAGE plpgsql
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