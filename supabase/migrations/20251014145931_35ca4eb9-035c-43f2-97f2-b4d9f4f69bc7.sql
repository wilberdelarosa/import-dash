-- Crear tabla de equipos
CREATE TABLE IF NOT EXISTS public.equipos (
  id BIGSERIAL PRIMARY KEY,
  ficha TEXT NOT NULL,
  nombre TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  numero_serie TEXT NOT NULL,
  placa TEXT NOT NULL,
  categoria TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  motivo_inactividad TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de inventarios
CREATE TABLE IF NOT EXISTS public.inventarios (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  categoria_equipo TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 0,
  movimientos JSONB DEFAULT '[]'::jsonb,
  activo BOOLEAN NOT NULL DEFAULT true,
  codigo_identificacion TEXT NOT NULL,
  empresa_suplidora TEXT NOT NULL,
  marcas_compatibles TEXT[] DEFAULT ARRAY[]::TEXT[],
  modelos_compatibles TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de mantenimientos programados
CREATE TABLE IF NOT EXISTS public.mantenimientos_programados (
  id BIGSERIAL PRIMARY KEY,
  ficha TEXT NOT NULL,
  nombre_equipo TEXT NOT NULL,
  tipo_mantenimiento TEXT NOT NULL,
  horas_km_actuales NUMERIC NOT NULL DEFAULT 0,
  fecha_ultima_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  frecuencia NUMERIC NOT NULL,
  fecha_ultimo_mantenimiento TIMESTAMP WITH TIME ZONE,
  horas_km_ultimo_mantenimiento NUMERIC NOT NULL DEFAULT 0,
  proximo_mantenimiento NUMERIC NOT NULL,
  horas_km_restante NUMERIC NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantenimientos_programados ENABLE ROW LEVEL SECURITY;

-- Políticas para acceso público (sin autenticación por ahora)
CREATE POLICY "Permitir lectura pública de equipos" ON public.equipos
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública de equipos" ON public.equipos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de equipos" ON public.equipos
  FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación pública de equipos" ON public.equipos
  FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública de inventarios" ON public.inventarios
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública de inventarios" ON public.inventarios
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de inventarios" ON public.inventarios
  FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación pública de inventarios" ON public.inventarios
  FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública de mantenimientos" ON public.mantenimientos_programados
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública de mantenimientos" ON public.mantenimientos_programados
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de mantenimientos" ON public.mantenimientos_programados
  FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación pública de mantenimientos" ON public.mantenimientos_programados
  FOR DELETE USING (true);