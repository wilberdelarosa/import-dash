-- =====================================================
-- SISTEMA DE TICKETS DE EQUIPOS - SCHEMA SQL
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Tabla principal de tickets
CREATE TABLE IF NOT EXISTS equipment_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación con equipo
  equipo_id INTEGER REFERENCES equipos(id) NOT NULL,
  ficha VARCHAR(50) NOT NULL,
  
  -- Información del problema
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  tipo_problema VARCHAR(50) NOT NULL CHECK (tipo_problema IN ('averia', 'falta_pieza', 'preventivo', 'correctivo', 'otro')),
  prioridad VARCHAR(20) DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
  
  -- Pieza relacionada (opcional)
  pieza_solicitada VARCHAR(255),
  numero_parte VARCHAR(100),
  cantidad_requerida INTEGER DEFAULT 1,
  
  -- Estado y proceso
  status VARCHAR(50) DEFAULT 'abierto' CHECK (status IN (
    'abierto',
    'en_cotizacion', 
    'cotizado',
    'orden_compra',
    'pieza_en_camino',
    'pieza_recibida',
    'en_reparacion',
    'cerrado',
    'cancelado'
  )),
  
  -- Cotización
  cotizacion_monto DECIMAL(12, 2),
  cotizacion_proveedor VARCHAR(255),
  cotizacion_fecha DATE,
  
  -- Orden de compra
  orden_compra_numero VARCHAR(100),
  orden_compra_fecha DATE,
  
  -- Fechas importantes
  fecha_recepcion_pieza DATE,
  fecha_inicio_reparacion DATE,
  fecha_cierre DATE,
  
  -- Responsables
  created_by VARCHAR(255) NOT NULL,
  assigned_to VARCHAR(255),
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Notas de resolución
  resolucion TEXT,
  notas_admin TEXT
);

-- 2. Tabla de adjuntos de tickets
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES equipment_tickets(id) ON DELETE CASCADE NOT NULL,
  
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('foto_problema', 'cotizacion', 'orden_compra', 'factura', 'otro')),
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  uploaded_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de historial de tickets
CREATE TABLE IF NOT EXISTS ticket_history (
  id SERIAL PRIMARY KEY,
  ticket_id UUID REFERENCES equipment_tickets(id) ON DELETE CASCADE NOT NULL,
  
  action VARCHAR(100) NOT NULL CHECK (action IN ('created', 'status_change', 'comment', 'attachment_added', 'assigned', 'updated')),
  status_from VARCHAR(50),
  status_to VARCHAR(50),
  comment TEXT,
  
  performed_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_tickets_equipo ON equipment_tickets(equipo_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON equipment_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_ficha ON equipment_tickets(ficha);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON equipment_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON equipment_tickets(prioridad);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON ticket_history(ticket_id);

-- 5. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_equipment_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_equipment_tickets_updated_at ON equipment_tickets;
CREATE TRIGGER trigger_equipment_tickets_updated_at
  BEFORE UPDATE ON equipment_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_tickets_updated_at();

-- 6. Habilitar RLS (Row Level Security)
ALTER TABLE equipment_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de acceso (permitir todo para usuarios autenticados)
-- Tickets
DROP POLICY IF EXISTS "Allow all for authenticated users" ON equipment_tickets;
CREATE POLICY "Allow all for authenticated users" ON equipment_tickets
  FOR ALL USING (auth.role() = 'authenticated');

-- Attachments
DROP POLICY IF EXISTS "Allow all for authenticated users" ON ticket_attachments;
CREATE POLICY "Allow all for authenticated users" ON ticket_attachments
  FOR ALL USING (auth.role() = 'authenticated');

-- History
DROP POLICY IF EXISTS "Allow all for authenticated users" ON ticket_history;
CREATE POLICY "Allow all for authenticated users" ON ticket_history
  FOR ALL USING (auth.role() = 'authenticated');

-- 8. Crear bucket de Storage para adjuntos de tickets (ejecutar en Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-attachments', 'ticket-attachments', false);

-- =====================================================
-- FIN DEL SCHEMA
-- Ejecuta este script en: Supabase Dashboard > SQL Editor
-- =====================================================
