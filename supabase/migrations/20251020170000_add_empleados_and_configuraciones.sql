-- Crear tabla de empleados
CREATE TABLE IF NOT EXISTS public.empleados (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  cargo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  fecha_nacimiento DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  email TEXT,
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de configuraciones clave-valor
CREATE TABLE IF NOT EXISTS public.configuraciones (
  clave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuraciones ENABLE ROW LEVEL SECURITY;

-- Políticas para empleados
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'empleados' and policyname = 'Permitir lectura pública de empleados'
  ) then
    execute 'CREATE POLICY "Permitir lectura pública de empleados" ON public.empleados FOR SELECT USING (true)';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'empleados' and policyname = 'Permitir inserción pública de empleados'
  ) then
    execute 'CREATE POLICY "Permitir inserción pública de empleados" ON public.empleados FOR INSERT WITH CHECK (true)';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'empleados' and policyname = 'Permitir actualización pública de empleados'
  ) then
    execute 'CREATE POLICY "Permitir actualización pública de empleados" ON public.empleados FOR UPDATE USING (true)';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'empleados' and policyname = 'Permitir eliminación pública de empleados'
  ) then
    execute 'CREATE POLICY "Permitir eliminación pública de empleados" ON public.empleados FOR DELETE USING (true)';
  end if;
end;
$$;

-- Políticas para configuraciones
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'configuraciones' and policyname = 'Permitir lectura pública de configuraciones'
  ) then
    execute 'CREATE POLICY "Permitir lectura pública de configuraciones" ON public.configuraciones FOR SELECT USING (true)';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'configuraciones' and policyname = 'Permitir inserción pública de configuraciones'
  ) then
    execute 'CREATE POLICY "Permitir inserción pública de configuraciones" ON public.configuraciones FOR INSERT WITH CHECK (true)';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'configuraciones' and policyname = 'Permitir actualización pública de configuraciones'
  ) then
    execute 'CREATE POLICY "Permitir actualización pública de configuraciones" ON public.configuraciones FOR UPDATE USING (true)';
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'configuraciones' and policyname = 'Permitir eliminación pública de configuraciones'
  ) then
    execute 'CREATE POLICY "Permitir eliminación pública de configuraciones" ON public.configuraciones FOR DELETE USING (true)';
  end if;
end;
$$;
