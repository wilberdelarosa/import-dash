-- Tabla de configuración del sistema para preferencias persistentes
CREATE TABLE IF NOT EXISTS public.configuraciones_sistema (
  id bigserial PRIMARY KEY,
  alerta_critica integer NOT NULL DEFAULT 15,
  alerta_preventiva integer NOT NULL DEFAULT 50,
  permitir_importaciones boolean NOT NULL DEFAULT true,
  notificar_email boolean NOT NULL DEFAULT true,
  notificar_whatsapp boolean NOT NULL DEFAULT false,
  notificar_dispositivo boolean NOT NULL DEFAULT true,
  correo_soporte text,
  correo_notificaciones text,
  telefono_whatsapp text,
  modo_oscuro_automatico boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Garantizar que solo exista un registro de configuración
CREATE UNIQUE INDEX IF NOT EXISTS configuraciones_sistema_singleton
  ON public.configuraciones_sistema ((true));

-- Función y trigger para mantener updated_at
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_configuraciones_updated_at ON public.configuraciones_sistema;
CREATE TRIGGER set_configuraciones_updated_at
  BEFORE UPDATE ON public.configuraciones_sistema
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Insertar fila por defecto si no existe
INSERT INTO public.configuraciones_sistema (id)
VALUES (1)
ON CONFLICT DO NOTHING;

ALTER TABLE public.configuraciones_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de configuraciones" ON public.configuraciones_sistema
  FOR SELECT USING (true);

CREATE POLICY "Permitir actualización de configuraciones" ON public.configuraciones_sistema
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Permitir inserción de configuraciones" ON public.configuraciones_sistema
  FOR INSERT WITH CHECK (true);

-- Tabla para registrar envíos externos de notificaciones
CREATE TABLE IF NOT EXISTS public.notificaciones_salientes (
  id bigserial PRIMARY KEY,
  notificacion_id bigint NOT NULL REFERENCES public.notificaciones(id) ON DELETE CASCADE,
  canal text NOT NULL,
  destino text NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente',
  mensaje text NOT NULL,
  metadata jsonb,
  intentos integer NOT NULL DEFAULT 0,
  ultimo_error text,
  enviado_en timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS notificaciones_salientes_unicas
  ON public.notificaciones_salientes (notificacion_id, canal);

ALTER TABLE public.notificaciones_salientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de salidas" ON public.notificaciones_salientes
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de salidas" ON public.notificaciones_salientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización de salidas" ON public.notificaciones_salientes
  FOR UPDATE USING (true) WITH CHECK (true);
