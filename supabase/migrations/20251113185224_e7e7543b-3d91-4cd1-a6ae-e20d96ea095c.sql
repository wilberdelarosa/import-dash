-- Tabla de planes de mantenimiento (plantillas reutilizables)
CREATE TABLE public.planes_mantenimiento (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de intervalos dentro de cada plan (PM1, PM2, PM3, PM4, etc.)
CREATE TABLE public.plan_intervalos (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES public.planes_mantenimiento(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL, -- PM1, PM2, PM3, PM4
  nombre TEXT NOT NULL,
  horas_intervalo INTEGER NOT NULL,
  descripcion TEXT,
  tareas JSONB DEFAULT '[]'::jsonb,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de kits de mantenimiento
CREATE TABLE public.kits_mantenimiento (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  marca TEXT,
  modelo_aplicable TEXT,
  categoria TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de piezas dentro de cada kit
CREATE TABLE public.kit_piezas (
  id BIGSERIAL PRIMARY KEY,
  kit_id BIGINT NOT NULL REFERENCES public.kits_mantenimiento(id) ON DELETE CASCADE,
  numero_parte TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  tipo TEXT NOT NULL, -- filtro, aceite, repuesto, etc.
  cantidad INTEGER NOT NULL DEFAULT 1,
  unidad TEXT DEFAULT 'unidad',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla relacional: vincular intervalos de plan con kits necesarios
CREATE TABLE public.plan_intervalo_kits (
  id BIGSERIAL PRIMARY KEY,
  plan_intervalo_id BIGINT NOT NULL REFERENCES public.plan_intervalos(id) ON DELETE CASCADE,
  kit_id BIGINT NOT NULL REFERENCES public.kits_mantenimiento(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_intervalo_id, kit_id)
);

-- Añadir columna en mantenimientos_programados para vincular a un plan
ALTER TABLE public.mantenimientos_programados
ADD COLUMN plan_id BIGINT REFERENCES public.planes_mantenimiento(id) ON DELETE SET NULL,
ADD COLUMN intervalo_codigo TEXT,
ADD COLUMN proximo_intervalo_codigo TEXT;

-- RLS Policies
ALTER TABLE public.planes_mantenimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_intervalos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits_mantenimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_piezas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_intervalo_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura pública de planes" ON public.planes_mantenimiento FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública de planes" ON public.planes_mantenimiento FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública de planes" ON public.planes_mantenimiento FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública de planes" ON public.planes_mantenimiento FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública de intervalos" ON public.plan_intervalos FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública de intervalos" ON public.plan_intervalos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública de intervalos" ON public.plan_intervalos FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública de intervalos" ON public.plan_intervalos FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública de kits" ON public.kits_mantenimiento FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública de kits" ON public.kits_mantenimiento FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública de kits" ON public.kits_mantenimiento FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública de kits" ON public.kits_mantenimiento FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública de piezas kit" ON public.kit_piezas FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública de piezas kit" ON public.kit_piezas FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública de piezas kit" ON public.kit_piezas FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública de piezas kit" ON public.kit_piezas FOR DELETE USING (true);

CREATE POLICY "Permitir lectura pública de plan_intervalo_kits" ON public.plan_intervalo_kits FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública de plan_intervalo_kits" ON public.plan_intervalo_kits FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública de plan_intervalo_kits" ON public.plan_intervalo_kits FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública de plan_intervalo_kits" ON public.plan_intervalo_kits FOR DELETE USING (true);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_plan_intervalos_plan_id ON public.plan_intervalos(plan_id);
CREATE INDEX idx_kit_piezas_kit_id ON public.kit_piezas(kit_id);
CREATE INDEX idx_plan_intervalo_kits_plan_intervalo_id ON public.plan_intervalo_kits(plan_intervalo_id);
CREATE INDEX idx_plan_intervalo_kits_kit_id ON public.plan_intervalo_kits(kit_id);
CREATE INDEX idx_mantenimientos_programados_plan_id ON public.mantenimientos_programados(plan_id);