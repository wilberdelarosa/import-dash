-- Create configuraciones_sistema table for system configuration
CREATE TABLE public.configuraciones_sistema (
  id INTEGER PRIMARY KEY DEFAULT 1,
  alerta_critica INTEGER NOT NULL DEFAULT 15,
  alerta_preventiva INTEGER NOT NULL DEFAULT 50,
  permitir_importaciones BOOLEAN NOT NULL DEFAULT true,
  notificar_email BOOLEAN NOT NULL DEFAULT true,
  notificar_whatsapp BOOLEAN NOT NULL DEFAULT false,
  notificar_dispositivo BOOLEAN NOT NULL DEFAULT true,
  correo_soporte TEXT,
  correo_notificaciones TEXT,
  telefono_whatsapp TEXT,
  modo_oscuro_automatico BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT single_config_row CHECK (id = 1)
);

-- Enable RLS on configuraciones_sistema
ALTER TABLE public.configuraciones_sistema ENABLE ROW LEVEL SECURITY;

-- Allow public read access to configuration
CREATE POLICY "Allow public read access to system configuration"
ON public.configuraciones_sistema
FOR SELECT
USING (true);

-- Allow public update access to configuration
CREATE POLICY "Allow public update access to system configuration"
ON public.configuraciones_sistema
FOR UPDATE
USING (true);

-- Allow public insert access to configuration
CREATE POLICY "Allow public insert access to system configuration"
ON public.configuraciones_sistema
FOR INSERT
WITH CHECK (true);

-- Insert default configuration
INSERT INTO public.configuraciones_sistema (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Create notificaciones_salientes table for tracking external notifications
CREATE TABLE public.notificaciones_salientes (
  id BIGSERIAL PRIMARY KEY,
  notificacion_id BIGINT REFERENCES public.notificaciones(id) ON DELETE CASCADE,
  canal TEXT NOT NULL CHECK (canal IN ('email', 'whatsapp')),
  destinatario TEXT NOT NULL,
  contenido TEXT NOT NULL,
  enviado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notificaciones_salientes
ALTER TABLE public.notificaciones_salientes ENABLE ROW LEVEL SECURITY;

-- Allow public access to notificaciones_salientes
CREATE POLICY "Allow public insert to notificaciones_salientes"
ON public.notificaciones_salientes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public read access to notificaciones_salientes"
ON public.notificaciones_salientes
FOR SELECT
USING (true);

-- Create index for performance
CREATE INDEX idx_notificaciones_salientes_notificacion_id 
ON public.notificaciones_salientes(notificacion_id);

CREATE INDEX idx_notificaciones_salientes_canal 
ON public.notificaciones_salientes(canal);