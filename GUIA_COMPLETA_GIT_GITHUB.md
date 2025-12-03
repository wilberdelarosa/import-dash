# 📚 Guía Completa de Git y GitHub - De Básico a Avanzado

## 📖 Tabla de Contenidos

1. [Conceptos Fundamentales](#conceptos-fundamentales)
2. [Nivel Básico - Primeros Pasos](#nivel-básico)
3. [Nivel Intermedio - Trabajo Diario](#nivel-intermedio)
4. [Nivel Avanzado - Gestión Compleja](#nivel-avanzado)
5. [Casos de Uso Comunes](#casos-de-uso-comunes)
6. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Conceptos Fundamentales

### ¿Qué es Git?
Sistema de control de versiones distribuido que permite rastrear cambios en archivos y coordinar trabajo entre múltiples desarrolladores.

### ¿Qué es GitHub?
Plataforma web que aloja repositorios Git y facilita la colaboración mediante características como pull requests, issues, y GitHub Actions.

### Conceptos Clave
- **Repository (Repo)**: Carpeta que contiene tu proyecto y su historial de cambios
- **Commit**: Snapshot (fotografía) de tus archivos en un momento específico
- **Branch (Rama)**: Línea de desarrollo independiente
- **Remote**: Versión del repositorio alojada en un servidor (ej: GitHub)
- **Clone**: Copia local de un repositorio remoto
- **Fork**: Copia de un repositorio en tu cuenta de GitHub

---

## 🌱 Nivel Básico - Primeros Pasos

### 1. Configuración Inicial

#### Configurar tu identidad (OBLIGATORIO primera vez)
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```
**Explicación**: Establece tu nombre y email que aparecerán en todos tus commits.

#### Ver la configuración actual
```bash
git config --list
```

#### Configurar editor predeterminado
```bash
git config --global core.editor "code --wait"  # VS Code
git config --global core.editor "notepad"       # Notepad (Windows)
```

---

### 2. Crear y Clonar Repositorios

#### Inicializar un nuevo repositorio local
```bash
git init
```
**Uso**: Crea una carpeta `.git` en tu directorio actual.  
**Cuándo usarlo**: Cuando empiezas un proyecto nuevo desde cero.

#### Clonar un repositorio existente
```bash
git clone https://github.com/usuario/repositorio.git
```
**Explicación**: Descarga una copia completa del repositorio con todo su historial.  
**Cuándo usarlo**: Cuando quieres trabajar en un proyecto existente.

#### Clonar en una carpeta específica
```bash
git clone https://github.com/usuario/repo.git nombre-carpeta
```

---

### 3. Comandos Básicos del Flujo de Trabajo

#### Ver el estado de tus archivos
```bash
git status
```
**Explicación**: Muestra qué archivos están modificados, staged (preparados), o sin seguimiento.  
**Cuándo usarlo**: Constantemente, es el comando más usado.

#### Agregar archivos al staging area
```bash
git add archivo.txt              # Agregar un archivo específico
git add .                        # Agregar TODOS los archivos modificados
git add *.js                     # Agregar todos los archivos .js
git add carpeta/                 # Agregar toda una carpeta
```
**Explicación**: Prepara los archivos para el commit. Es como decir "quiero incluir estos cambios en mi próximo snapshot".

#### Quitar archivos del staging area
```bash
git reset archivo.txt            # Quitar archivo específico
git reset .                      # Quitar todos los archivos
```

#### Crear un commit
```bash
git commit -m "Mensaje descriptivo del cambio"
```
**Explicación**: Guarda permanentemente los cambios staged en el historial.  
**Buenas prácticas de mensajes**:
- ✅ "feat: Agregar login de usuarios"
- ✅ "fix: Corregir error en cálculo de totales"
- ✅ "docs: Actualizar README con instrucciones"
- ❌ "cambios"
- ❌ "fix"

#### Commit con todos los archivos modificados (skip staging)
```bash
git commit -am "Mensaje"
```
**⚠️ Advertencia**: Solo funciona con archivos que ya están tracked (no archivos nuevos).

#### Ver el historial de commits
```bash
git log                          # Historial completo
git log --oneline                # Versión compacta (recomendado)
git log --graph --all            # Ver todas las ramas en forma de árbol
git log -n 5                     # Ver últimos 5 commits
git log --author="Nombre"        # Commits de un autor específico
```

---

### 4. Trabajo con Repositorios Remotos

#### Ver repositorios remotos
```bash
git remote -v
```
**Explicación**: Muestra las URLs de los repositorios remotos configurados (origin, upstream, etc.).

#### Agregar un repositorio remoto
```bash
git remote add origin https://github.com/usuario/repo.git
```
**Cuándo usarlo**: Después de `git init` cuando quieres conectar tu repo local con GitHub.

#### Cambiar la URL del remoto
```bash
git remote set-url origin https://github.com/usuario/nuevo-repo.git
```

#### Subir cambios al repositorio remoto
```bash
git push origin main             # Subir a la rama main
git push origin nombre-rama      # Subir a una rama específica
```
**Explicación**: Envía tus commits locales al servidor remoto (GitHub).

#### Subir y crear rama remota automáticamente
```bash
git push -u origin nombre-rama
```
**Explicación**: `-u` (o `--set-upstream`) configura tracking para futuros push/pull.

#### Descargar cambios del remoto
```bash
git pull origin main             # Descargar y fusionar cambios
```
**Explicación**: Equivalente a `git fetch` + `git merge`.

#### Solo descargar cambios (sin fusionar)
```bash
git fetch origin
```
**Cuándo usarlo**: Cuando quieres ver qué cambios hay sin aplicarlos todavía.

---

## 🚀 Nivel Intermedio - Trabajo Diario

### 5. Trabajo con Ramas (Branches)

#### Ver todas las ramas
```bash
git branch                       # Ramas locales
git branch -r                    # Ramas remotas
git branch -a                    # Todas las ramas (locales y remotas)
```

#### Crear una nueva rama
```bash
git branch nombre-rama
```
**Explicación**: Crea una rama pero NO cambia a ella.

#### Cambiar a una rama
```bash
git checkout nombre-rama         # Método tradicional
git switch nombre-rama           # Método moderno (Git 2.23+)
```

#### Crear y cambiar a una rama en un solo comando
```bash
git checkout -b nombre-rama      # Método tradicional
git switch -c nombre-rama        # Método moderno
```
**Uso común**: Cuando empiezas una nueva feature.

#### Renombrar una rama
```bash
git branch -m nuevo-nombre       # Renombrar la rama actual
git branch -m viejo nuevo        # Renombrar otra rama
```

#### Eliminar una rama local
```bash
git branch -d nombre-rama        # Eliminación segura (solo si está fusionada)
git branch -D nombre-rama        # Forzar eliminación (¡cuidado!)
```

#### Eliminar una rama remota
```bash
git push origin --delete nombre-rama
```
**Cuándo usarlo**: Después de fusionar un pull request y ya no necesitas la rama.

---

### 6. Fusionar Cambios (Merge)

#### Fusionar una rama en la actual
```bash
git checkout main                # Cambiar a la rama destino
git merge nombre-rama            # Fusionar nombre-rama en main
```
**Explicación**: Combina los cambios de `nombre-rama` en tu rama actual.

#### Fusionar sin fast-forward (crear commit de merge)
```bash
git merge --no-ff nombre-rama
```
**Cuándo usarlo**: Para mantener un historial más claro de cuándo se fusionaron features.

#### Abortar un merge conflictivo
```bash
git merge --abort
```
**Cuándo usarlo**: Cuando hay conflictos y decides no continuar con el merge.

---

### 7. Resolver Conflictos

Cuando hay conflictos, Git marca las secciones problemáticas:

```
<<<<<<< HEAD
Tu cambio actual
=======
Cambio que estás intentando fusionar
>>>>>>> nombre-rama
```

**Pasos para resolver**:
1. Abrir el archivo conflictivo
2. Editar manualmente para decidir qué cambios mantener
3. Eliminar los marcadores (`<<<<<<<`, `=======`, `>>>>>>>`)
4. Agregar el archivo resuelto: `git add archivo.txt`
5. Completar el merge: `git commit`

---

### 8. Deshacer Cambios

#### Descartar cambios NO staged en un archivo
```bash
git checkout -- archivo.txt      # Método tradicional
git restore archivo.txt          # Método moderno
```
**⚠️ Advertencia**: Los cambios se perderán permanentemente.

#### Descartar TODOS los cambios no staged
```bash
git checkout .
git restore .
```

#### Ver diferencias antes de commit
```bash
git diff                         # Cambios no staged
git diff --staged                # Cambios staged (preparados para commit)
git diff main..otra-rama         # Diferencias entre ramas
```

#### Modificar el último commit
```bash
git commit --amend -m "Nuevo mensaje"
```
**Cuándo usarlo**: Olvidaste agregar un archivo o escribiste mal el mensaje.  
**⚠️ Advertencia**: NO uses esto si ya hiciste push (cambia el historial).

#### Deshacer el último commit (manteniendo cambios)
```bash
git reset --soft HEAD~1
```
**Explicación**: Deshace el commit pero deja los archivos staged.

#### Deshacer el último commit (descartando cambios)
```bash
git reset --hard HEAD~1
```
**⚠️ PELIGRO**: Los cambios se perderán permanentemente.

#### Revertir un commit específico (crear commit inverso)
```bash
git revert abc1234
```
**Explicación**: Crea un nuevo commit que deshace los cambios de abc1234.  
**Cuándo usarlo**: Cuando ya hiciste push y necesitas revertir algo públicamente.

---

### 9. Stash - Guardar Trabajo Temporal

#### Guardar cambios temporalmente
```bash
git stash
git stash save "Descripción del trabajo en progreso"
```
**Cuándo usarlo**: Tienes cambios sin commit pero necesitas cambiar de rama urgentemente.

#### Ver lista de stashes
```bash
git stash list
```

#### Recuperar el stash más reciente
```bash
git stash pop                    # Aplicar y eliminar del stash
git stash apply                  # Aplicar pero mantener en stash
```

#### Aplicar un stash específico
```bash
git stash apply stash@{2}
```

#### Eliminar un stash
```bash
git stash drop stash@{0}
git stash clear                  # Eliminar TODOS los stashes
```

---

## 🎓 Nivel Avanzado - Gestión Compleja

### 10. Rebase - Reescribir Historial

#### Rebase básico
```bash
git checkout feature-branch
git rebase main
```
**Explicación**: Mueve tu rama feature encima de los últimos cambios de main, creando un historial lineal.

**Diferencia con Merge**:
- **Merge**: Crea un commit de fusión (historial ramificado)
- **Rebase**: Reaplica commits encima de otra rama (historial lineal)

#### Rebase interactivo (editar commits pasados)
```bash
git rebase -i HEAD~3             # Editar últimos 3 commits
```
**Opciones en el editor**:
- `pick`: Mantener commit
- `reword`: Cambiar mensaje
- `edit`: Modificar commit
- `squash`: Fusionar con commit anterior
- `drop`: Eliminar commit

**⚠️ REGLA DE ORO**: NUNCA hagas rebase de commits que ya hiciste push a un repositorio compartido.

---

### 11. Cherry-pick - Aplicar Commits Específicos

#### Aplicar un commit específico a la rama actual
```bash
git cherry-pick abc1234
```
**Cuándo usarlo**: Quieres un commit específico de otra rama sin fusionar toda la rama.

#### Cherry-pick de múltiples commits
```bash
git cherry-pick abc1234 def5678 ghi9012
```

---

### 12. Trabajo con Tags (Etiquetas)

#### Ver todas las tags
```bash
git tag
git tag -l "v1.*"                # Buscar tags que coincidan
```

#### Crear una tag ligera
```bash
git tag v1.0.0
```

#### Crear una tag anotada (recomendado)
```bash
git tag -a v1.0.0 -m "Versión 1.0.0 - Release inicial"
```

#### Subir tags al remoto
```bash
git push origin v1.0.0           # Subir una tag específica
git push origin --tags           # Subir TODAS las tags
```

#### Eliminar una tag
```bash
git tag -d v1.0.0                # Local
git push origin --delete v1.0.0  # Remoto
```

---

### 13. Git Reflog - Recuperar Commits Perdidos

#### Ver historial de referencias
```bash
git reflog
```
**Explicación**: Muestra TODOS los movimientos de HEAD, incluso commits "eliminados".

#### Recuperar un commit perdido
```bash
git reflog                       # Encuentra el hash del commit perdido
git checkout abc1234             # Vuelve a ese commit
git branch recuperada abc1234    # Crea una rama para guardarlo
```

---

### 14. Git Blame - Rastrear Cambios por Línea

#### Ver quién modificó cada línea
```bash
git blame archivo.txt
git blame -L 10,20 archivo.txt   # Solo líneas 10-20
```
**Cuándo usarlo**: Para entender por qué se hizo un cambio específico.

---

### 15. Submódulos (Submodules)

#### Agregar un submódulo
```bash
git submodule add https://github.com/user/repo.git ruta/al/submodulo
```

#### Clonar un repo con submódulos
```bash
git clone --recurse-submodules https://github.com/user/repo.git
```

#### Actualizar submódulos
```bash
git submodule update --init --recursive
```

---

### 16. Trabajo Avanzado con Remotos

#### Sincronizar fork con el repositorio original
```bash
# 1. Agregar el repositorio upstream
git remote add upstream https://github.com/usuario-original/repo.git

# 2. Descargar cambios
git fetch upstream

# 3. Fusionar cambios en tu main
git checkout main
git merge upstream/main

# 4. Subir a tu fork
git push origin main
```

#### Push forzado (con seguridad)
```bash
git push --force-with-lease origin rama
```
**Explicación**: Más seguro que `--force` porque no sobrescribe si alguien más hizo push.

---

## 💼 Casos de Uso Comunes

### Caso 1: Empezar un Nuevo Proyecto Local y Subirlo a GitHub

```bash
# 1. Crear repositorio local
mkdir mi-proyecto
cd mi-proyecto
git init

# 2. Crear archivos y hacer primer commit
echo "# Mi Proyecto" > README.md
git add .
git commit -m "Initial commit"

# 3. Crear repo en GitHub (por web)

# 4. Conectar y subir
git remote add origin https://github.com/usuario/mi-proyecto.git
git branch -M main
git push -u origin main
```

---

### Caso 2: Trabajar en una Nueva Feature

```bash
# 1. Actualizar main
git checkout main
git pull origin main

# 2. Crear rama para feature
git checkout -b feature/nueva-funcionalidad

# 3. Trabajar y hacer commits
git add .
git commit -m "feat: Implementar nueva funcionalidad"

# 4. Subir rama
git push -u origin feature/nueva-funcionalidad

# 5. Crear Pull Request en GitHub

# 6. Después de aprobar PR, actualizar local
git checkout main
git pull origin main
git branch -d feature/nueva-funcionalidad
```

---

### Caso 3: Arreglar un Bug Urgente (Hotfix)

```bash
# 1. Crear rama desde main
git checkout main
git pull origin main
git checkout -b hotfix/bug-critico

# 2. Arreglar el bug
git add .
git commit -m "fix: Corregir bug crítico en login"

# 3. Subir y mergear rápidamente
git push -u origin hotfix/bug-critico

# 4. Después del merge
git checkout main
git pull origin main
git branch -d hotfix/bug-critico
```

---

### Caso 4: Contribuir a un Proyecto Open Source

```bash
# 1. Fork del proyecto en GitHub (por web)

# 2. Clonar tu fork
git clone https://github.com/tu-usuario/proyecto.git
cd proyecto

# 3. Agregar upstream (repo original)
git remote add upstream https://github.com/usuario-original/proyecto.git

# 4. Crear rama para tu contribución
git checkout -b fix/typo-en-docs

# 5. Hacer cambios y commit
git add .
git commit -m "docs: Corregir typo en README"

# 6. Subir a tu fork
git push origin fix/typo-en-docs

# 7. Crear Pull Request desde GitHub

# 8. Mantener fork actualizado
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

---

### Caso 5: Revertir un Commit que ya está en Producción

```bash
# 1. Encontrar el hash del commit problemático
git log --oneline

# 2. Revertir (NO usar reset si está en remoto)
git revert abc1234

# 3. Subir el commit de reversión
git push origin main
```

---

### Caso 6: Limpiar Historial antes de Hacer PR

```bash
# Supongamos que tienes 5 commits pequeños que quieres unir

# 1. Rebase interactivo
git rebase -i HEAD~5

# 2. En el editor, cambiar 'pick' por 'squash' en los commits a unir
# pick abc1234 Primer commit
# squash def5678 Fix typo
# squash ghi9012 Otro fix
# squash jkl3456 Más fixes
# pick mno7890 Commit importante separado

# 3. Guardar y editar mensaje del commit combinado

# 4. Push forzado (solo si es tu rama)
git push --force-with-lease origin tu-rama
```

---

## ✅ Mejores Prácticas

### 1. Mensajes de Commit

**Formato recomendado** (Conventional Commits):
```
tipo(scope): descripción corta

Descripción detallada (opcional)

Fixes #123
```

**Tipos comunes**:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formato, punto y coma faltante, etc
- `refactor`: Refactorización de código
- `test`: Agregar tests
- `chore`: Tareas de mantenimiento

**Ejemplos**:
```bash
git commit -m "feat(auth): agregar login con Google"
git commit -m "fix(cart): corregir cálculo de total con descuentos"
git commit -m "docs: actualizar guía de instalación"
```

---

### 2. Estrategia de Ramas

#### Git Flow (Proyectos complejos)
- `main`: Código en producción
- `develop`: Integración de features
- `feature/*`: Nuevas funcionalidades
- `release/*`: Preparación de releases
- `hotfix/*`: Fixes urgentes

#### GitHub Flow (Proyectos simples)
- `main`: Código siempre deployable
- `feature/*`: Todo lo demás

---

### 3. Cuándo Hacer Pull/Push

**Haz pull ANTES de empezar a trabajar**:
```bash
git checkout main
git pull origin main
git checkout -b tu-rama
```

**Haz push frecuentemente**:
```bash
git push origin tu-rama
```
✅ Backup automático  
✅ Colaboradores pueden ver tu progreso  
✅ CI/CD puede ejecutar tests

---

### 4. .gitignore Esencial

Crear archivo `.gitignore`:
```
# Node.js
node_modules/
npm-debug.log
.env

# IDEs
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
*.log
```

---

### 5. Comandos para NO Usar en Repos Compartidos

❌ `git push --force` (usa `--force-with-lease`)  
❌ `git rebase` en commits ya pusheados  
❌ `git reset --hard` en ramas compartidas  

---

## 🆘 Comandos de Emergencia

### "Ayuda, borré algo importante"
```bash
git reflog
git checkout abc1234
```

### "Hice commit en la rama equivocada"
```bash
# Si no hiciste push todavía:
git log                          # Anotar hash del commit
git reset --hard HEAD~1          # Quitar commit de rama actual
git checkout rama-correcta
git cherry-pick abc1234          # Aplicar en rama correcta
```

### "Hay conflictos y no sé qué hacer"
```bash
git merge --abort                # O git rebase --abort
```

### "Accidentalmente hice commit de contraseñas"
```bash
# 1. Quitar del último commit
git reset --soft HEAD~1
git restore --staged archivo-con-password

# 2. Si ya hiciste push (GRAVE)
# - Cambiar la contraseña INMEDIATAMENTE
# - Usar git filter-branch o BFG Repo-Cleaner para limpiar historial
# - Considerar crear repo nuevo
```

---

## 🔑 Atajos de Configuración Útiles

```bash
# Alias útiles
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm "commit -m"
git config --global alias.lg "log --oneline --graph --all"

# Ahora puedes usar:
git st
git co main
git lg
```

---

## 📊 Resumen de Comandos por Frecuencia

### Uso Diario
```bash
git status
git add .
git commit -m "mensaje"
git push
git pull
git checkout -b nueva-rama
```

### Uso Semanal
```bash
git branch
git merge
git log
git diff
```

### Uso Mensual
```bash
git rebase
git stash
git tag
git cherry-pick
```

### Uso Ocasional
```bash
git reflog
git revert
git blame
git reset
```

---

## 🎯 Conclusión

Esta guía cubre desde los conceptos básicos hasta técnicas avanzadas de Git. La clave es:

1. **Empezar simple**: Domina `add`, `commit`, `push`, `pull`
2. **Practicar con ramas**: Es seguro experimentar
3. **Leer los mensajes de error**: Git generalmente te dice qué hacer
4. **Usar `git status`** constantemente
5. **No temer pedir ayuda**: La comunidad Git es enorme

¡Recuerda que todos los expertos empezaron como principiantes! 🚀
