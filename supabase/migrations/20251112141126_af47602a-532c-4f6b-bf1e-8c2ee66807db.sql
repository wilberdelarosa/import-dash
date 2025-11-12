-- Crear tabla para intervalos de mantenimiento Caterpillar (PM1-PM4)
CREATE TABLE public.cat_intervalos_mantenimiento (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE, -- 'PM1', 'PM2', 'PM3', 'PM4'
  nombre TEXT NOT NULL,
  horas_intervalo INTEGER NOT NULL, -- 250, 500, 1000, 2000
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insertar los 4 intervalos estándar de Caterpillar
INSERT INTO public.cat_intervalos_mantenimiento (codigo, nombre, horas_intervalo, descripcion) VALUES
('PM1', 'Servicio 250 horas', 250, 'Muestras de fluidos (aceite motor, hidráulico, refrigerante), inspección de fugas, correas y mangueras'),
('PM2', 'Servicio 500 horas', 500, 'Cambio aceite y filtro motor, filtros combustible primario/secundario, filtros aire'),
('PM3', 'Servicio 1000 horas', 1000, 'PM2 + filtros hidráulicos, transmisión, aceite transmisión final y motor giro (excavadoras)'),
('PM4', 'Servicio 2000 horas', 2000, 'PM3 + filtro secador A/C, juntas tapa válvulas, respiradero depósito hidráulico');

-- Crear tabla para modelos Caterpillar con sus especificaciones
CREATE TABLE public.cat_modelos (
  id BIGSERIAL PRIMARY KEY,
  modelo TEXT NOT NULL, -- '320', '416F', '305E2', etc.
  categoria TEXT NOT NULL, -- 'Excavadora', 'Retroexcavadora', 'Minicargador', etc.
  serie_desde TEXT, -- 'HEX00001'
  serie_hasta TEXT, -- 'HEX10000'
  motor TEXT, -- 'C7.1', 'C9.3', etc.
  capacidad_aceite_motor NUMERIC(5,2), -- Litros
  capacidad_hidraulico NUMERIC(6,2), -- Litros
  capacidad_refrigerante NUMERIC(5,2), -- Litros
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insertar modelos principales
INSERT INTO public.cat_modelos (modelo, categoria, serie_desde, serie_hasta, motor, capacidad_aceite_motor, capacidad_hidraulico, capacidad_refrigerante, notas) VALUES
('320', 'Excavadora', 'HEX00001', 'HEX10000', 'C7.1', 15, 180, 20, 'Series iniciales'),
('320', 'Excavadora', 'HEX10001', NULL, 'C7.1', 15, 180, 20, 'Series recientes con filtros actualizados'),
('326', 'Excavadora', NULL, NULL, 'C7.1', 15, 190, 22, 'Excavadora mediana'),
('333', 'Excavadora', NULL, NULL, 'C9.3', 18, 220, 25, 'Excavadora grande'),
('313', 'Excavadora', NULL, NULL, 'C4.4', 12, 150, 18, 'Excavadora compacta'),
('416F', 'Retroexcavadora', NULL, NULL, 'C4.4', 8, 85, 14, 'Serie F actualizada'),
('305E2', 'Mini Excavadora', NULL, NULL, 'C2.2', 5, 42, 8, 'Mini excavadora 5 ton'),
('216B3', 'Minicargador', NULL, NULL, '3024C', 4.5, 38, 7, 'Serie B3'),
('232D', 'Minicargador', NULL, NULL, '3024D', 5, 42, 8, 'Serie D actualizada'),
('236D', 'Minicargador', NULL, NULL, '3024D', 5, 45, 8, 'Serie D grande'),
('CB2.7', 'Rodillo Compactador', NULL, NULL, 'C1.5', 6, 40, 9, 'Compactador 2.7 ton'),
('CB10', 'Rodillo Compactador', NULL, NULL, 'C3.3', 10, 75, 12, 'Compactador 10 ton');

-- Crear tabla para códigos de pieza (filtros, sellos, etc.)
CREATE TABLE public.cat_codigos_pieza (
  id BIGSERIAL PRIMARY KEY,
  numero_parte TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'Filtro Aceite', 'Filtro Combustible', 'Filtro Hidraulico', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insertar códigos de pieza principales
INSERT INTO public.cat_codigos_pieza (numero_parte, descripcion, tipo) VALUES
-- Filtros aceite motor
('322-3155', 'Filtro aceite motor series HEX00001-HEX10000', 'Filtro Aceite Motor'),
('523-4987', 'Filtro aceite motor series HEX10001+', 'Filtro Aceite Motor'),
('7W-2326', 'Filtro aceite motor 416F/305', 'Filtro Aceite Motor'),
('220-1523', 'Filtro aceite motor minicargadores 216B/232D', 'Filtro Aceite Motor'),
-- Filtros combustible
('479-4131', 'Filtro combustible primario excavadoras', 'Filtro Combustible Primario'),
('509-5694', 'Filtro combustible primario series recientes', 'Filtro Combustible Primario'),
('363-6572', 'Filtro combustible primario 416F/minicargadores', 'Filtro Combustible Primario'),
('360-8960', 'Filtro combustible secundario universal', 'Filtro Combustible Secundario'),
('525-6206', 'Filtro combustible en línea/estrainer', 'Filtro Combustible'),
('067-6987', 'Filtro combustible CB2.7', 'Filtro Combustible'),
-- Filtros aire
('346-6687', 'Filtro aire primario 416F', 'Filtro Aire Primario'),
('123-2367', 'Filtro aire primario minicargadores serie B', 'Filtro Aire Primario'),
('123-2368', 'Filtro aire secundario minicargadores serie B', 'Filtro Aire Secundario'),
('146-7473', 'Filtro aire primario rodillos', 'Filtro Aire Primario'),
('146-7474', 'Filtro aire secundario rodillos', 'Filtro Aire Secundario'),
-- Filtros hidráulicos
('362-1163', 'Filtro hidráulico 416F/305/minicargadores', 'Filtro Hidraulico'),
('102-2828', 'Filtro hidráulico minicargadores modelo D', 'Filtro Hidraulico'),
('363-5746', 'Filtro hidráulico rodillos', 'Filtro Hidraulico'),
-- Filtros transmisión
('119-4740', 'Filtro transmisión 416F', 'Filtro Transmision'),
-- Sellos y juntas
('5P-6718', 'Sello aceite 416F', 'Sello'),
('6S-3002', 'Retén carcasa 416F', 'Sello'),
('2M-9780', 'Retén carcasa secundario 416F', 'Sello'),
-- Grasa
('452-6006', 'Grasa Cat recomendada', 'Grasa');

-- Crear tabla de relación: qué piezas se usan en qué modelo para qué intervalo
CREATE TABLE public.cat_modelo_intervalo_piezas (
  id BIGSERIAL PRIMARY KEY,
  modelo_id BIGINT REFERENCES public.cat_modelos(id) ON DELETE CASCADE,
  intervalo_id BIGINT REFERENCES public.cat_intervalos_mantenimiento(id) ON DELETE CASCADE,
  pieza_id BIGINT REFERENCES public.cat_codigos_pieza(id) ON DELETE CASCADE,
  cantidad INTEGER DEFAULT 1,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(modelo_id, intervalo_id, pieza_id)
);

-- Insertar relaciones para Excavadora 320 (series iniciales HEX00001-HEX10000)
WITH modelo_320_old AS (SELECT id FROM public.cat_modelos WHERE modelo = '320' AND serie_desde = 'HEX00001'),
     pm2 AS (SELECT id FROM public.cat_intervalos_mantenimiento WHERE codigo = 'PM2'),
     pm3 AS (SELECT id FROM public.cat_intervalos_mantenimiento WHERE codigo = 'PM3')
INSERT INTO public.cat_modelo_intervalo_piezas (modelo_id, intervalo_id, pieza_id, cantidad) VALUES
-- PM2 (500h): aceite motor + combustible + aire
((SELECT id FROM modelo_320_old), (SELECT id FROM pm2), (SELECT id FROM public.cat_codigos_pieza WHERE numero_parte = '322-3155'), 1),
((SELECT id FROM modelo_320_old), (SELECT id FROM pm2), (SELECT id FROM public.cat_codigos_pieza WHERE numero_parte = '479-4131'), 1),
((SELECT id FROM modelo_320_old), (SELECT id FROM pm2), (SELECT id FROM public.cat_codigos_pieza WHERE numero_parte = '360-8960'), 1),
((SELECT id FROM modelo_320_old), (SELECT id FROM pm2), (SELECT id FROM public.cat_codigos_pieza WHERE numero_parte = '525-6206'), 1),
-- PM3 (1000h): añadir filtros hidráulicos
((SELECT id FROM modelo_320_old), (SELECT id FROM pm3), (SELECT id FROM public.cat_codigos_pieza WHERE numero_parte = '362-1163'), 2);

-- Insertar relaciones para 416F
WITH modelo_416f AS (SELECT id FROM public.cat_modelos WHERE modelo = '416F'),
     pm2 AS (SELECT id FROM public.cat_intervalos_mantenimiento WHERE codigo = 'PM2'),
     pm3 AS (SELECT id FROM public.cat_intervalos_mantenimiento WHERE codigo = 'PM3')
INSERT INTO public.cat_modelo_intervalo_piezas (modelo_id, intervalo_id, pieza_id, cantidad) VALUES
-- PM2 (500h)
((SELECT id FROM modelo_416f), (SELECT id FROM pm2), (SELECT id FROM public.cat_codigos_pieza WHERE numero_parte = '7W-2326'), 1),
((SELECT id FROM modelo_416f), (SELECT id FROM pm2), (SELECT id FROM public.cat_codigos_pieza WHERE numero_parte = '363-6572'), 1),
((SELECT id FROM modelo_416f), (SELECT id FROM pm2), (SELECT id FROM public.cat_codigos_pieza WHERE numero_parte = '360-8960'), 1),
((SELECT id FROM modelo_416f), (SELECT id FROM pm2), (SELECT id FROM public.cat_codigos_pieza WHERE numero_parte = '346-6687'), 1),
((SELECT id FROM modelo_416f), (SELECT id FROM pm2), (SELECT id FROM public.cat_codigos_pieza WHERE numero_parte = '119-4740'), 1),
-- PM3 (1000h)
((SELECT id FROM modelo_416f), (SELECT id FROM pm3), (SELECT id FROM public.cat_codigos_pieza WHERE numero_parte = '362-1163'), 1);

-- Enable RLS en todas las tablas
ALTER TABLE public.cat_intervalos_mantenimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_codigos_pieza ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_modelo_intervalo_piezas ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
CREATE POLICY "Allow public read access to cat_intervalos_mantenimiento"
ON public.cat_intervalos_mantenimiento FOR SELECT USING (true);

CREATE POLICY "Allow public read access to cat_modelos"
ON public.cat_modelos FOR SELECT USING (true);

CREATE POLICY "Allow public read access to cat_codigos_pieza"
ON public.cat_codigos_pieza FOR SELECT USING (true);

CREATE POLICY "Allow public read access to cat_modelo_intervalo_piezas"
ON public.cat_modelo_intervalo_piezas FOR SELECT USING (true);

-- Políticas de escritura pública (para gestión desde la app)
CREATE POLICY "Allow public insert to cat_modelos"
ON public.cat_modelos FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to cat_modelos"
ON public.cat_modelos FOR UPDATE USING (true);

CREATE POLICY "Allow public insert to cat_modelo_intervalo_piezas"
ON public.cat_modelo_intervalo_piezas FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to cat_modelo_intervalo_piezas"
ON public.cat_modelo_intervalo_piezas FOR UPDATE USING (true);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_cat_modelos_modelo ON public.cat_modelos(modelo);
CREATE INDEX idx_cat_modelos_categoria ON public.cat_modelos(categoria);
CREATE INDEX idx_cat_codigos_tipo ON public.cat_codigos_pieza(tipo);
CREATE INDEX idx_cat_mip_modelo ON public.cat_modelo_intervalo_piezas(modelo_id);
CREATE INDEX idx_cat_mip_intervalo ON public.cat_modelo_intervalo_piezas(intervalo_id);