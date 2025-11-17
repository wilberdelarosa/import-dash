# Sistema de Importación de Datos Caterpillar

## Descripción

Este módulo permite importar automáticamente kits de mantenimiento y planes de mantenimiento planificado (PM) para equipos Caterpillar. Los datos están basados en la documentación oficial de Caterpillar y cubren los intervalos estándar de mantenimiento: 250h, 500h, 1000h y 2000h.

## Modelos Incluidos

### Minicargadores
- 216B3LRC
- 236DLRC
- 236D3LRC
- 232D3LRC

### Retroexcavadoras
- 416F2STLRC
- 416-07LRC

### Excavadoras
- 320-07
- 333-07
- 326-07

### Miniexcavadoras
- 313-05GC
- 305-07CR

### Compactadores
- CB2.7LRC
- CB2.7-03GC
- CS10GCLRC
- CS11GCLRC

## Estructura de Datos

Cada modelo incluye:

1. **Kits de Mantenimiento (PM1-PM4)**
   - PM1 (250 horas): Mantenimiento básico
   - PM2 (500 horas): Mantenimiento intermedio
   - PM3 (1000 horas): Mantenimiento mayor
   - PM4 (2000 horas): Mantenimiento completo

2. **Filtros por Sistema**
   - Motor: Filtros de aceite de motor
   - Combustible: Filtros primarios y secundarios
   - Hidráulico: Filtros de aceite hidráulico y retorno
   - Aire: Filtros primarios y secundarios
   - Transmisión: Filtros de transmisión (cuando aplica)

## Cómo Usar

### Paso 1: Acceder al Importador
1. Inicia sesión en la aplicación
2. Ve a la navegación superior
3. Haz clic en **"Importar CAT"**

### Paso 2: Revisar los Datos
- En la página de importación verás:
  - Estadísticas de los datos a importar
  - Vista previa de todos los modelos y kits
  - Detalles de cada filtro incluido

### Paso 3: Iniciar la Importación
1. Haz clic en el botón **"Iniciar importación"**
2. El sistema mostrará el progreso en tiempo real:
   - Modelo actual siendo procesado
   - Número de kits creados
   - Número de planes creados
   - Errores (si los hay)

### Paso 4: Verificar los Resultados
Después de la importación:
1. Ve a **"Kits Mant."** para ver todos los kits creados
2. Ve a **"Planes Mant."** para ver los planes con sus intervalos
3. Cada kit estará vinculado automáticamente a su intervalo correspondiente

## Características del Sistema

### Kits de Mantenimiento
- Código único: `CAT-{MODELO}-{PM-HORAS}`
- Ejemplo: `CAT-216B3LRC-PM1-250H`
- Incluye todas las piezas (filtros) necesarias
- Cantidades específicas por filtro
- Información del sistema (Motor, Combustible, etc.)

### Planes de Mantenimiento
- Plan por modelo con 4 intervalos (PM1-PM4)
- Tareas predefinidas según el intervalo
- Vinculación automática de kits a intervalos
- Orden secuencial de intervalos

### Evita Duplicados
- El sistema verifica si un kit ya existe antes de crearlo
- Si un kit existe, solo se vincula al intervalo correspondiente
- Los planes siempre se crean nuevos

## Datos Técnicos

### Ejemplo: Caterpillar 216B3LRC

**PM1 - 250 Horas**
- Filtro de aceite de motor (220-1523)

**PM2 - 500 Horas**
- Filtro de aceite de motor (220-1523)
- Filtro primario de combustible (363-6572)
- Filtro secundario de combustible (360-8960)

**PM3 - 1000 Horas**
- Todos los filtros del PM2 +
- Filtro de aceite hidráulico (102-2828)
- Filtro de aire primario (123-2367)

**PM4 - 2000 Horas**
- Todos los filtros del PM3 +
- Filtro de aire secundario (123-2368)

## Tareas Incluidas por Intervalo

### PM1 y PM2
- Cambio de filtros según kit
- Inspección visual de fugas
- Revisión de niveles de fluidos
- Muestreo de aceite (S•O•S)

### PM2 y PM4 Adicionales
- Inspección de correas y mangueras
- Revisión de tensión de orugas/presión de neumáticos

### PM3 y PM4 Adicionales
- Cambio de aceite hidráulico
- Inspección de sistemas hidráulicos

## Resolución de Problemas

### Error: "Ya existe un kit con ese código"
- **Causa**: El kit ya fue importado previamente
- **Solución**: El sistema continuará con el siguiente kit automáticamente

### Error: "El kit ya está asignado a este intervalo"
- **Causa**: La vinculación entre kit e intervalo ya existe
- **Solución**: No se requiere acción, el sistema continúa

### La importación se detiene
- **Revisa la consola del navegador** (F12 → Console)
- **Verifica la conexión a Supabase**
- **Asegúrate de tener permisos** para crear kits y planes

## Mantenimiento de los Datos

### Actualizar Filtros
Si necesitas actualizar los números de parte:
1. Edita el archivo: `src/data/caterpillarMaintenanceData.ts`
2. Busca el modelo específico
3. Actualiza los `partNumber` o `description`
4. Ejecuta una nueva importación

### Agregar Nuevos Modelos
Para agregar un nuevo modelo:
```typescript
{
  model: 'NUEVO-MODELO',
  category: 'Minicargador', // o la categoría correspondiente
  pmKits: [
    {
      code: 'PM1-250H',
      name: 'PM1 - 250 Horas',
      hours: 250,
      filters: [
        { 
          partNumber: 'XXX-XXXX', 
          description: 'Descripción del filtro', 
          system: 'Motor', 
          quantity: 1 
        },
        // Más filtros...
      ],
    },
    // PM2, PM3, PM4...
  ],
}
```

## Referencias

Los datos de mantenimiento están basados en:
- Documentación oficial de Caterpillar
- Manuales de Operación y Mantenimiento (OMM)
- Guías de Mantenimiento Planificado de Caterpillar
- Sistema S•O•S (Scheduled Oil Sampling)

## Soporte

Para problemas o preguntas:
1. Revisa este documento
2. Consulta los logs de importación
3. Verifica las tablas de Supabase:
   - `kits_mantenimiento`
   - `kit_piezas`
   - `planes_mantenimiento`
   - `plan_intervalos`
   - `plan_intervalo_kits`
