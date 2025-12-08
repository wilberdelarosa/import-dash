# 🔧 Migración Volvo - Planes de Mantenimiento

## Resumen

Esta migración agrega planes de mantenimiento completos para los equipos Volvo en tu flota.

### Equipos Volvo en la Base de Datos

| Ficha | Nombre | Modelo | Categoría |
|-------|--------|--------|-----------|
| AC-023 | MINIRETRO VOLVO | EC55D | Miniretro |
| AC-025 | MINIRETRO VOLVO | EC55D | Miniretro |
| AC-037 | MINIRETRO VOLVO | EC55D | Miniretro |
| AC-034 | EXCAVADORA 140 | 140DL | Excavadora |

### Qué se creará

| Componente | Cantidad | Detalles |
|------------|----------|----------|
| Planes de mantenimiento | 3 | EC55D, EC140DL, 140DL |
| Intervalos por plan | 4 | PM1(250h), PM2(500h), PM3(1000h), PM4(2000h) |
| Total intervalos | 12 | 4 × 3 planes |
| Kits de mantenimiento | 12 | 4 kits × 3 modelos |
| Piezas específicas | ~100 | Diferenciadas por motor (D2.6A vs D4J) |
| Vinculaciones kit-intervalo | 12 | Cada kit vinculado a su intervalo |

---

## 🚀 Instrucciones de Aplicación

### Opción 1: Script Automático (Recomendado)

```powershell
.\scripts\apply-volvo-migration.ps1
```

El script:
1. Detecta si tienes Supabase CLI
2. Si lo tienes, aplica la migración automáticamente
3. Si no, te guía paso a paso y copia el SQL al portapapeles

### Opción 2: Manual via Dashboard

1. **Abre el Dashboard de Supabase:**
   ```
   https://supabase.com/dashboard/project/ocsptehtkawcpcgckqeh/editor
   ```

2. **Ve a SQL Editor > New Query**

3. **Copia el contenido del archivo:**
   ```
   supabase\migrations\20251207_volvo_maintenance_plans.sql
   ```

4. **Pega y haz clic en "Run"**

5. **Regenera los tipos TypeScript:**
   ```powershell
   npx supabase gen types typescript --project-id ocsptehtkawcpcgckqeh > src/integrations/supabase/types.ts
   ```

### Opción 3: Supabase CLI

```powershell
# Vincular proyecto (solo primera vez)
supabase link --project-ref ocsptehtkawcpcgckqeh

# Aplicar migraciones
supabase db push

# Regenerar tipos
npx supabase gen types typescript --project-id ocsptehtkawcpcgckqeh > src/integrations/supabase/types.ts
```

---

## ✅ Verificación Post-Migración

### En Supabase Dashboard

1. Ve a **Database > Tables**
2. Verifica que `planes_mantenimiento` tenga 3 nuevos registros con marca "Volvo"
3. Verifica que `kits_mantenimiento` tenga 12 nuevos kits (VOE-EC55D-PM1, etc.)

### En la Aplicación

1. Ejecuta `npm run dev`
2. Ve a **Planificador > Planes de Mantenimiento**
3. Deberías ver:
   - ✅ Plan Mantenimiento Volvo EC55D
   - ✅ Plan Mantenimiento Volvo EC140DL
   - ✅ Plan Mantenimiento Volvo 140DL

4. Ve a **Equipos > AC-023** (o cualquier Volvo)
5. Deberías ver:
   - ✅ Plan sugerido automáticamente
   - ✅ Ciclo de mantenimiento calculado
   - ✅ Kit de piezas correspondiente

---

## 🔄 Sincronización entre Módulos

### Flujo de Datos

```
┌─────────────────────────┐
│  PlanificadorInteligente │
│  - Asigna plan a equipo │
│  - Crea override si es  │
│    diferente al sugerido│
└───────────┬─────────────┘
            │
            ▼ guarda en
┌─────────────────────────┐
│   overrides_planes      │
│   (tabla Supabase)      │
└───────────┬─────────────┘
            │
            ▼ lee desde
┌─────────────────────────┐
│   usePlanAsignado       │
│   (hook centralizado)   │
│   - Override > Sugerido │
└───────────┬─────────────┘
            │
            ▼ usa en
┌─────────────────────────┐
│ EquipoDetalleUnificado  │
│  - Muestra plan activo  │
│  - Badge si es override │
│  - Kit y piezas del PM  │
└─────────────────────────┘
```

### Hook `usePlanAsignado`

```typescript
import { usePlanAsignado } from '@/hooks/usePlanAsignado';

// En tu componente
const { 
  planAsignado,      // Plan activo
  esOverride,        // Si es manual
  motivoOverride,    // Razón del override
  scoreCoincidencia, // 0-100
  intervalos,        // PM1, PM2, etc.
} = usePlanAsignado(equipo);
```

---

## 📋 Estructura de Datos Creados

### Planes (planes_mantenimiento)

```json
{
  "nombre": "Plan Mantenimiento Volvo EC55D",
  "descripcion": "Motor D2.6A (55.4 HP). Peso operacional 5.5 ton.",
  "marca": "Volvo",
  "modelo": "EC55D",
  "categoria": "Miniretro",
  "activo": true
}
```

### Intervalos (plan_intervalos)

| Código | Horas | Descripción |
|--------|-------|-------------|
| PM1 | 250 | Cambio aceite motor, filtro, lubricación |
| PM2 | 500 | + Filtros combustible e hidráulico |
| PM3 | 1000 | + Filtros aire, aceite hidráulico |
| PM4 | 2000 | + Refrigerante, transmisión, correas |

### Kits (kits_mantenimiento)

Ejemplo para EC55D PM1:
```json
{
  "codigo": "VOE-EC55D-PM1",
  "nombre": "Kit PM1 Volvo EC55D",
  "marca": "Volvo",
  "modelo_aplicable": "EC55D",
  "categoria": "Miniretro"
}
```

### Piezas (kit_piezas)

Piezas diferenciadas por motor:
- **D2.6A** (EC55D): Capacidades más pequeñas
- **D4J** (EC140DL/140DL): Capacidades mayores

Ejemplo PM1:
| Parte | EC55D | EC140DL |
|-------|-------|---------|
| Aceite motor | 8L | 15L |
| Filtro aceite | VOE21707132 | VOE21707134 |

---

## 🛠️ Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `supabase/migrations/20251207_volvo_maintenance_plans.sql` | SQL de la migración |
| `src/hooks/usePlanAsignado.ts` | Hook centralizado de plan asignado |
| `src/hooks/useOverridesPlanes.ts` | Hook para gestionar overrides |
| `src/hooks/usePlanes.ts` | Hook principal de planes |
| `src/data/volvoMaintenance.ts` | Datos estáticos Volvo (referencia) |
| `src/lib/maintenanceCycleLogic.ts` | Lógica de ciclos PM |
| `scripts/apply-volvo-migration.ps1` | Script de aplicación |

---

## ❓ Solución de Problemas

### "relation planes_mantenimiento does not exist"
La tabla no existe. Asegúrate de haber aplicado migraciones previas primero.

### Los planes no aparecen en la UI
1. Verifica que la migración se ejecutó sin errores
2. Regenera los tipos TypeScript
3. Reinicia el servidor de desarrollo

### El plan no se asigna al equipo
1. Verifica que marca/modelo coincidan exactamente
2. Revisa la consola del navegador para logs de `usePlanAsignado`
3. Usa override manual si el modelo tiene variantes

### "duplicate key value violates unique constraint"
La migración ya fue aplicada. Usa `ON CONFLICT DO NOTHING` (ya está incluido).

---

## 📅 Historial

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-12-07 | 1.0.0 | Migración inicial con EC55D, EC140DL, 140DL |

---

*Documentación generada automáticamente el 2025-12-07*
