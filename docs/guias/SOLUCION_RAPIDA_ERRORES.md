# ⚡ Guía Rápida: Solucionar Errores TypeScript

## 🎯 Problema
Estás viendo 6 errores de TypeScript en `usePlanesAsignados.ts`:
```
'planes_asignados' is not assignable to parameter type...
```

## ✅ Solución en 3 Pasos (5 minutos)

### 1️⃣ Ejecutar Script Interactivo
```powershell
.\scripts\apply-migration-interactive.ps1
```
- Selecciona opción **1** (Dashboard - RECOMENDADO)
- El script copiará el SQL automáticamente
- Tu navegador se abrirá en el SQL Editor

### 2️⃣ En el Dashboard de Supabase
1. **Pega** el SQL (Ctrl+V) - ya está en tu portapapeles
2. **Ejecuta** (botón "Run" o Ctrl+Enter)
3. **Espera** el mensaje "Success"

### 3️⃣ Confirma y Listo
1. Vuelve a la terminal del script
2. Escribe **"s"** y presiona Enter
3. El script regenerará los tipos automáticamente

## 🎉 Resultado
- ✅ Los 6 errores desaparecen
- ✅ El código compila sin problemas
- ✅ Los planes se guardan en Supabase
- ✅ El tab "Planes Asignados" funciona

---

## 🔧 Método Alternativo (Manual Completo)

Si prefieres hacerlo paso a paso sin el script:

1. **Abrir Dashboard**
   - Ir a: https://supabase.com/dashboard/project/ocsptehtkawcpcgckqeh/sql/new

2. **Copiar SQL**
   - Abrir: `supabase\migrations\20241117000000_planes_asignados.sql`
   - Copiar todo el contenido

3. **Ejecutar SQL**
   - Pegar en el SQL Editor
   - Click en "Run"

4. **Regenerar Tipos**
   ```powershell
   npx supabase gen types typescript --project-id ocsptehtkawcpcgckqeh > src/integrations/supabase/types.ts
   ```

5. **Reiniciar TypeScript Server**
   - Presiona `Ctrl+Shift+P` en VS Code
   - Ejecuta: "TypeScript: Restart TS Server"

---

## ❓ FAQ

**P: ¿Por qué tengo estos errores?**
R: La tabla `planes_asignados` no existe aún en tu base de datos. El código está correcto, solo falta crear la tabla.

**P: ¿Los datos se perderán?**
R: No. La migración solo CREA tablas nuevas, no modifica ni elimina datos existentes.

**P: ¿Puedo revertir la migración?**
R: Sí, pero no es necesario. La tabla es independiente y no afecta las demás.

**P: ¿Los errores desaparecerán solos?**
R: Sí, automáticamente después de regenerar los tipos TypeScript.

**P: ¿Cuánto tiempo toma?**
R: 5 minutos en total (incluye ejecutar SQL + regenerar tipos).

---

## 📚 Documentación Completa

Para más detalles, ver: `APLICAR_MIGRACION_INSTRUCCIONES.md`

---

**💡 Tip**: Usa el script interactivo, es más rápido y automático.
