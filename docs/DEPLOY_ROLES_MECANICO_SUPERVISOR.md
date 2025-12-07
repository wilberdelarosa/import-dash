# Guía de Despliegue: Roles Mecánico y Supervisor

Esta guía documenta los pasos necesarios para desplegar las funcionalidades de los nuevos roles (Mecánico y Supervisor) en producción.

## 📋 Checklist Pre-Despliegue

- [ ] Acceso a Supabase Dashboard
- [ ] Permisos de administrador en el proyecto
- [ ] Copia de seguridad de la base de datos (recomendado)

---

## 1. 🗄️ Ejecutar Migraciones de Base de Datos

### Migraciones Requeridas

Las siguientes migraciones deben ejecutarse en orden:

1. **`20251205175513_d129db19-2e4e-4788-87d1-0aafea0298fa.sql`**
   - Crea tablas `maintenance_submissions` y `submission_attachments`
   - Agrega rol `mechanic` al enum `app_role`
   - Configura RLS policies
   - Crea funciones `approve_and_integrate_submission` y `reject_submission`

2. **`20251205180000_extend_approve_submission.sql`**
   - Extiende la función de aprobación para crear registros oficiales
   - Descuenta inventario automáticamente
   - Añade función `get_submission_attachments`

### Opción A: Usando Supabase CLI

```bash
# Desde la raíz del proyecto
cd supabase
npx supabase db push
```

### Opción B: Ejecución Manual en SQL Editor

1. Ir a **Supabase Dashboard** > **SQL Editor**
2. Ejecutar cada archivo de migración en orden
3. Verificar que no haya errores

---

## 2. 📦 Crear Bucket de Storage

El sistema requiere un bucket llamado `submissions` para almacenar las fotos de los reportes de mecánicos.

### Pasos:

1. Ir a **Supabase Dashboard** > **Storage**
2. Click en **"New bucket"**
3. Configurar:
   - **Name**: `submissions`
   - **Public bucket**: ❌ No (dejarlo privado)
   - **File size limit**: `10MB` (recomendado)
   - **Allowed MIME types**: `image/*`

### Configurar Políticas RLS del Bucket

En **Storage** > **Policies** > bucket `submissions`:

#### Policy 1: Mecánicos pueden subir archivos
```sql
CREATE POLICY "Mechanics can upload to submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM maintenance_submissions 
    WHERE created_by = auth.uid()
  )
);
```

#### Policy 2: Usuarios pueden ver sus propios archivos + Admin/Supervisor pueden ver todos
```sql
CREATE POLICY "Users can view submission files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (
    -- El creador del submission puede ver
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM maintenance_submissions 
      WHERE created_by = auth.uid()
    )
    -- Admin y supervisor pueden ver todo
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'supervisor')
  )
);
```

---

## 3. 👥 Asignar Roles a Usuarios

### Crear un Mecánico

```sql
-- Reemplaza 'USER_UUID' con el UUID real del usuario
INSERT INTO public.user_roles (user_id, role_id)
SELECT 'USER_UUID', id FROM public.roles WHERE name = 'mechanic';
```

### Crear un Supervisor

```sql
INSERT INTO public.user_roles (user_id, role_id)
SELECT 'USER_UUID', id FROM public.roles WHERE name = 'supervisor';
```

### Verificar Asignación

```sql
SELECT 
  u.email,
  r.name as role,
  r.description
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
ORDER BY u.email;
```

---

## 4. 🔧 Variables de Entorno

Asegúrate de que las siguientes variables estén configuradas en producción:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu-anon-key
```

---

## 5. 🏗️ Build de Producción

```bash
# Instalar dependencias
npm install

# Build de producción
npm run build

# El output estará en /dist
```

---

## 6. ✅ Verificación Post-Despliegue

### Checklist de Verificación

- [ ] **Mecánico puede**:
  - [ ] Ver dashboard con equipos pendientes
  - [ ] Crear reporte con fotos
  - [ ] Ver historial de sus reportes
  - [ ] Recibir notificación cuando se aprueba/rechaza

- [ ] **Admin puede**:
  - [ ] Ver lista de reportes pendientes
  - [ ] Aprobar reporte (se actualiza mantenimiento oficial)
  - [ ] Rechazar reporte con feedback
  - [ ] Ver fotos adjuntas

- [ ] **Supervisor puede**:
  - [ ] Ver dashboard en modo lectura
  - [ ] Ver Control de Mantenimiento (sin editar)
  - [ ] Ver banner "Modo Supervisor - Solo lectura"
  - [ ] NO puede modificar datos

### Queries de Verificación

```sql
-- Verificar que las tablas existen
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'maintenance_submissions'
);

-- Verificar funciones RPC
SELECT proname FROM pg_proc 
WHERE proname IN ('approve_and_integrate_submission', 'reject_submission', 'get_submission_attachments');

-- Verificar roles
SELECT * FROM public.roles WHERE name IN ('mechanic', 'supervisor');
```

---

## 7. 🚨 Rollback (si es necesario)

En caso de problemas, ejecutar en orden inverso:

```sql
-- 1. Eliminar funciones
DROP FUNCTION IF EXISTS public.get_submission_attachments(UUID);
DROP FUNCTION IF EXISTS public.approve_and_integrate_submission(UUID, TEXT);
DROP FUNCTION IF EXISTS public.reject_submission(UUID, TEXT);

-- 2. Eliminar triggers
DROP TRIGGER IF EXISTS on_submission_created ON public.maintenance_submissions;
DROP TRIGGER IF EXISTS update_submissions_updated_at ON public.maintenance_submissions;

-- 3. Eliminar tablas
DROP TABLE IF EXISTS public.submission_attachments;
DROP TABLE IF EXISTS public.maintenance_submissions;

-- 4. El rol 'mechanic' en el enum NO se puede eliminar fácilmente
-- (los enums de PostgreSQL no permiten DROP VALUE)
```

---

## 📚 Documentación Relacionada

- [Prompt de Especificación](./PROMPT_ROLES_MECANICO_SUPERVISOR.md) - Diseño completo de la funcionalidad
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage) - Documentación oficial de Storage
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security) - Row Level Security

---

## 🆘 Troubleshooting

### Error: "bucket not found"
- Verifica que el bucket `submissions` existe en Storage
- Asegúrate de que las políticas RLS están configuradas

### Error: "permission denied for table maintenance_submissions"
- Verifica que el usuario tiene el rol correcto asignado
- Revisa las políticas RLS de la tabla

### Fotos no se muestran
- Verifica que la política de SELECT en storage.objects está configurada
- Usa `getSignedUrl` para URLs temporales si el bucket es privado

### Supervisor puede editar
- Verifica que `isReadOnly` se está calculando correctamente en el frontend
- El supervisor NO debe tener también rol de admin
