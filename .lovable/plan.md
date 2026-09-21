# Plan: historial de mantenimiento siempre completo y sincronizado

## Objetivo
Hacer que cada lectura y mantenimiento quede guardado de forma confiable, aparezca inmediatamente en el detalle del equipo y mantenga correcta la secuencia aunque se corrijan datos antiguos.

## Cambios
1. **Guardado confiable**
   - Dejar de ignorar errores al crear eventos del historial.
   - Validar que la actualización principal y su registro detallado terminen correctamente; si falla el historial, mostrar el error en vez de aparentar éxito.
   - Conservar en cada evento ficha, fecha, lectura real ingresada, lectura anterior, observaciones, responsable, unidad, mantenimiento asociado e insumos.

2. **Carga completa por equipo**
   - Cargar el detalle directamente por ficha, con paginación, para que no dependa del límite global de 1,000 registros.
   - Ordenar por fecha e identificador para mantener un orden estable cuando varios registros tienen la misma fecha.
   - Evitar duplicar en la línea de tiempo los mismos mantenimientos y lecturas.

3. **Secuencia y correcciones**
   - Recalcular incrementos entre registros consecutivos después de editar o eliminar.
   - Mantener como lectura actual la mayor lectura válida, sin permitir que un registro retroactivo reduzca el horómetro.
   - Recalcular último mantenimiento, próximo servicio y restante con todo el historial del equipo.

4. **Actualización inmediata**
   - Refrescar el detalle abierto cuando cambie el historial o el mantenimiento programado.
   - Mantener sincronizadas las vistas móvil y de escritorio porque ambas usan la misma fuente central.

5. **Comprobación**
   - Probar un equipo con múltiples lecturas y mantenimientos, incluyendo una fecha intermedia.
   - Verificar guardar, corregir y eliminar; confirmar que el detalle y los indicadores cambian sin cerrar la ventana.
   - Revisar que no haya errores visibles ni datos faltantes.

## Nota técnica
Se conservará `historial_eventos` como fuente histórica y `mantenimientos_programados` como resumen actual. El detalle consultará el historial completo de la ficha, mientras el resumen se reconstruirá a partir de esos eventos tras cualquier corrección.
