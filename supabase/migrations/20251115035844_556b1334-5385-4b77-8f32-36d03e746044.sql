-- Mejorar tabla inventarios para compatibilidad con equipos
ALTER TABLE public.inventarios 
  DROP COLUMN IF EXISTS marcas_compatibles,
  DROP COLUMN IF EXISTS modelos_compatibles;

ALTER TABLE public.inventarios
  ADD COLUMN IF NOT EXISTS numero_parte text UNIQUE NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sistema text,
  ADD COLUMN IF NOT EXISTS stock_minimo integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS ubicacion text,
  ADD COLUMN IF NOT EXISTS marca_fabricante text;

-- Asegurar que las tablas de kits y planes tengan todos los campos necesarios
ALTER TABLE public.kits_mantenimiento
  ADD COLUMN IF NOT EXISTS intervalo_horas integer;

ALTER TABLE public.plan_intervalos
  ADD COLUMN IF NOT EXISTS es_activo boolean NOT NULL DEFAULT true;

-- Crear tabla para vincular equipos con planes de mantenimiento
CREATE TABLE IF NOT EXISTS public.equipo_planes (
  id bigserial PRIMARY KEY,
  equipo_id bigint NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  plan_id bigint NOT NULL REFERENCES public.planes_mantenimiento(id) ON DELETE CASCADE,
  fecha_inicio timestamp with time zone NOT NULL DEFAULT now(),
  horas_inicio numeric NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(equipo_id, plan_id)
);

-- RLS para equipo_planes
ALTER TABLE public.equipo_planes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura pública de equipo_planes"
  ON public.equipo_planes FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción pública de equipo_planes"
  ON public.equipo_planes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de equipo_planes"
  ON public.equipo_planes FOR UPDATE
  USING (true);

CREATE POLICY "Permitir eliminación pública de equipo_planes"
  ON public.equipo_planes FOR DELETE
  USING (true);

-- Mejorar mantenimientos_programados para tracking completo
ALTER TABLE public.mantenimientos_programados
  ADD COLUMN IF NOT EXISTS kit_usado_id bigint REFERENCES public.kits_mantenimiento(id),
  ADD COLUMN IF NOT EXISTS partes_consumidas jsonb DEFAULT '[]'::jsonb;

-- Mejorar historial_eventos para registrar consumo de inventario
ALTER TABLE public.historial_eventos
  ADD COLUMN IF NOT EXISTS kit_usado_id bigint REFERENCES public.kits_mantenimiento(id),
  ADD COLUMN IF NOT EXISTS partes_consumidas jsonb DEFAULT '[]'::jsonb;

-- Función para calcular próximo mantenimiento según plan
CREATE OR REPLACE FUNCTION public.calcular_proximo_mantenimiento(
  p_horas_actuales numeric,
  p_plan_id bigint
) RETURNS TABLE (
  intervalo_id bigint,
  intervalo_codigo text,
  intervalo_nombre text,
  horas_intervalo integer,
  horas_proximo numeric,
  kit_id bigint
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pi.id,
    pi.codigo,
    pi.nombre,
    pi.horas_intervalo,
    -- Calcular el próximo múltiplo del intervalo mayor a horas actuales
    CEIL(p_horas_actuales / pi.horas_intervalo) * pi.horas_intervalo AS horas_proximo,
    pik.kit_id
  FROM public.plan_intervalos pi
  LEFT JOIN public.plan_intervalo_kits pik ON pik.plan_intervalo_id = pi.id
  WHERE pi.plan_id = p_plan_id
    AND pi.es_activo = true
  ORDER BY pi.orden ASC, pi.horas_intervalo ASC
  LIMIT 1;
END;
$$;

-- Función para actualizar inventario después de mantenimiento
CREATE OR REPLACE FUNCTION public.actualizar_inventario_post_mantenimiento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parte jsonb;
  v_inventario_id bigint;
BEGIN
  -- Solo procesar si hay partes consumidas
  IF NEW.partes_consumidas IS NOT NULL AND jsonb_array_length(NEW.partes_consumidas) > 0 THEN
    -- Iterar sobre cada parte consumida
    FOR v_parte IN SELECT * FROM jsonb_array_elements(NEW.partes_consumidas)
    LOOP
      -- Buscar el item en inventario por numero_parte
      SELECT id INTO v_inventario_id
      FROM public.inventarios
      WHERE numero_parte = (v_parte->>'numero_parte')::text
      LIMIT 1;
      
      -- Si existe, actualizar el stock
      IF v_inventario_id IS NOT NULL THEN
        UPDATE public.inventarios
        SET cantidad = GREATEST(0, cantidad - (v_parte->>'cantidad')::integer)
        WHERE id = v_inventario_id;
        
        -- Verificar si quedó bajo el stock mínimo
        PERFORM 1
        FROM public.inventarios
        WHERE id = v_inventario_id
          AND cantidad <= stock_minimo;
        
        -- Si está bajo, crear notificación (si no existe ya)
        IF FOUND THEN
          INSERT INTO public.notificaciones (
            tipo,
            titulo,
            mensaje,
            nivel,
            metadata
          )
          SELECT
            'stock_bajo',
            'Stock Bajo: ' || nombre,
            'El inventario ' || nombre || ' (P/N: ' || numero_parte || ') tiene solo ' || cantidad || ' unidades.',
            CASE
              WHEN cantidad = 0 THEN 'critical'
              WHEN cantidad <= 3 THEN 'warning'
              ELSE 'info'
            END,
            jsonb_build_object(
              'inventario_id', id,
              'numero_parte', numero_parte,
              'cantidad', cantidad
            )
          FROM public.inventarios
          WHERE id = v_inventario_id
          ON CONFLICT DO NOTHING;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para actualizar inventario cuando se completa un mantenimiento
DROP TRIGGER IF EXISTS trigger_actualizar_inventario ON public.historial_eventos;
CREATE TRIGGER trigger_actualizar_inventario
  AFTER INSERT ON public.historial_eventos
  FOR EACH ROW
  WHEN (NEW.tipo_evento = 'mantenimiento_realizado')
  EXECUTE FUNCTION public.actualizar_inventario_post_mantenimiento();

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_inventarios_numero_parte ON public.inventarios(numero_parte);
CREATE INDEX IF NOT EXISTS idx_inventarios_sistema ON public.inventarios(sistema);
CREATE INDEX IF NOT EXISTS idx_kits_marca_modelo ON public.kits_mantenimiento(marca, modelo_aplicable);
CREATE INDEX IF NOT EXISTS idx_planes_marca_modelo ON public.planes_mantenimiento(marca, modelo, categoria);
CREATE INDEX IF NOT EXISTS idx_equipo_planes_equipo ON public.equipo_planes(equipo_id) WHERE activo = true;