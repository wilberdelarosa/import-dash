# 🔍 Comparación: Main vs Fallo01

## ❌ Problema Identificado en Fallo01
La rama `fallo01` NO carga datos porque la base de datos de Supabase conectada tiene **tablas incorrectas**.

## 📊 Análisis de Diferencias

### 1. **Configuración de Base de Datos (.env)**
**AMBAS RAMAS USAN EL MISMO ARCHIVO `.env`**:
- Proyecto Supabase: `ocsptehtkawcpcgckqeh`
- URL: `https://ocsptehtkawcpcgckqeh.supabase.co`

⚠️ **El archivo `.env` NO se versiona en git (está en `.gitignore`)**, por lo que ambas ramas comparten la misma configuración.

### 2. **Migraciones de Base de Datos**

#### **Fallo01** tiene:
- ✅ 35 archivos de migración
- Primera migración: `20251014145931_35ca4eb9` - Crea tablas básicas (equipos, inventarios, mantenimientos_programados)

#### **Main** tiene:
- ✅ **19 migraciones ADICIONALES** (2,036 inserciones de código nuevo)
- Migraciones extra incluyen:
  - Sistema de tickets (`equipment_tickets`, `equipment_tickets_schema.sql`)
  - Sistema de roles y permisos
  - Envío de submissions por mecánicos
  - Tablas de empresas en equipos
  - Planes de mantenimiento Volvo
  - Y más...

### 3. **Definición de Tipos TypeScript** (`src/integrations/supabase/types.ts`)

#### **Main tiene**:
✅ Definiciones de tablas:
- `equipos`
- `inventarios`
- `mantenimientos_programados`
- `historial_eventos`
- `equipment_tickets` (nueva)
- `cat_codigos_pieza`
- `cat_intervalos_mantenimiento`
- Y 10+ tablas más del sistema completo

#### **Fallo01 tiene**:
❓ (No verificado aún, pero probablemente faltan definiciones de tipos)

### 4. **Estado de la Base de Datos REAL en Supabase**

#### Proyecto: `ocsptehtkawcpcgckqeh`
❌ **Tablas actuales (INCORRECTAS para el sistema)**:
```
- empresas
- sucursales  
- usuarios
- clientes
- productos_servicios
- facturas
- proformas
- conduces
- pagos
- secuencias_ncf
```

✅ **Tablas esperadas (para el sistema de mantenimiento)**:
```
- equipos
- inventarios
- mantenimientos_programados
- historial_eventos
- equipment_tickets
- cat_codigos_pieza
- etc.
```

## 🎯 Conclusión

### ¿Por qué Main funciona y Fallo01 no?

**RESPUESTA**: ¡Ninguna de las dos funciona realmente!

Ambas ramas apuntan a la misma base de datos de Supabase (`ocsptehtkawcpcgckqeh`), que contiene **tablas de un sistema de facturación**, NO del sistema de mantenimiento de equipos.

### Lo que REALMENTE pasó:

1. **En algún momento**, alguien:
   - Conectó el proyecto a un Supabase **EQUIVOCADO**
   - O las migraciones **NUNCA se aplicaron** al proyecto Supabase
   
2. **La rama Main**:
   - Tiene MÁS código y migraciones preparadas
   - Pero **también falla** si intentas cargar datos (porque las tablas no existen)
   - Probablemente tiene mejor manejo de errores que no lo hace evidente
   
3. **La rama Fallo01**:
   - Tiene MENOS migraciones
   - Muestra el error más claramente al usuario

## 🛠️ Soluciones Posibles

### Opción 1: Aplicar Migraciones al Proyecto Actual
```bash
# Instalar Supabase CLI
npm install -g supabase

# Aplicar migraciones
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.ocsptehtkawcpcgckqeh.supabase.co:5432/postgres"
```

### Opción 2: Crear Nuevo Proyecto Supabase
1. Ir a https://supabase.com/dashboard
2. Crear nuevo proyecto para "Sistema de Mantenimiento"
3. Aplicar todas las migraciones en orden
4. Actualizar el archivo `.env` con las nuevas credenciales

### Opción 3: Conectar a un Proyecto Diferente
Si existe otro proyecto Supabase con las tablas correctas:
1. Obtener las credenciales del proyecto correcto
2. Actualizar `.env`:
   ```
   VITE_SUPABASE_PROJECT_ID="NUEVO_ID"
   VITE_SUPABASE_URL="https://NUEVO_ID.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="NUEVA_KEY"
   ```

## 📝 Recomendación

**PASO INMEDIATO**:
1. Verificar si existe otro proyecto Supabase con las tablas correctas
2. Si NO existe, aplicar todas las migraciones de la carpeta `supabase/migrations/` al proyecto actual
3. Verificar que las tablas se crearon correctamente

**PARA EVITAR CONFUSIÓN EN EL FUTURO**:
- Documentar qué proyecto Supabase debe usarse
- Crear un script de setup que verifique las tablas antes de iniciar la app
- Agregar validación en el código que avise si las tablas no existen
