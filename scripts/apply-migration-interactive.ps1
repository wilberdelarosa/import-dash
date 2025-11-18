# 🚀 Script Interactivo para Aplicar Migración planes_asignados
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$PROJECT_ID = "ocsptehtkawcpcgckqeh"
$MIGRATION_FILE = "supabase\migrations\20241117000000_planes_asignados.sql"
$TYPES_OUTPUT = "src\integrations\supabase\types.ts"

# Colores y formato
function Write-Title {
    param([string]$Text)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Number, [string]$Text)
    Write-Host "$Number  $Text" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

function Write-Info {
    param([string]$Text)
    Write-Host "   $Text" -ForegroundColor White
}

# Banner principal
Clear-Host
Write-Title "APLICAR MIGRACIÓN PLANES_ASIGNADOS"

Write-Host "⚠️  Los errores de TypeScript son NORMALES hasta aplicar esta migración" -ForegroundColor Yellow
Write-Host ""

# Verificar que existe el archivo
if (!(Test-Path $MIGRATION_FILE)) {
    Write-Error "No se encuentra el archivo de migración"
    Write-Info "Buscando: $MIGRATION_FILE"
    exit 1
}

Write-Success "Archivo de migración encontrado"

# Menú de opciones
Write-Host ""
Write-Host "📋 SELECCIONA UN MÉTODO:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1️⃣  Método Manual (Dashboard) - RECOMENDADO ⭐" -ForegroundColor White
Write-Host "       → Más fácil y visual" -ForegroundColor DarkGray
Write-Host "       → No requiere configuración adicional" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   2️⃣  Método Automático (CLI)" -ForegroundColor White
Write-Host "       → Requiere Supabase CLI instalado" -ForegroundColor DarkGray
Write-Host "       → Requiere autenticación previa" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   3️⃣  Ver instrucciones completas" -ForegroundColor White
Write-Host ""
Write-Host "   0️⃣  Cancelar" -ForegroundColor DarkGray
Write-Host ""

$opcion = Read-Host "Selecciona una opción (1, 2, 3 o 0)"

switch ($opcion) {
    "1" {
        # ═══════════════════════════════════════════════════════════════
        # MÉTODO MANUAL (DASHBOARD)
        # ═══════════════════════════════════════════════════════════════
        
        Write-Title "MÉTODO MANUAL - SUPABASE DASHBOARD"
        
        Write-Step "1️⃣ " "Abrir Supabase Dashboard"
        Write-Info "Se abrirá tu navegador con el SQL Editor..."
        Start-Sleep -Seconds 2
        Start-Process "https://supabase.com/dashboard/project/$PROJECT_ID/sql/new"
        
        Write-Host ""
        Write-Step "2️⃣ " "Copiar el SQL de la migración"
        Write-Info "Abriendo el archivo en el portapapeles..."
        Get-Content $MIGRATION_FILE | Set-Clipboard
        Write-Success "SQL copiado al portapapeles"
        
        Write-Host ""
        Write-Step "3️⃣ " "En el Dashboard de Supabase:"
        Write-Info "a) Pega el SQL en el editor (Ctrl+V)"
        Write-Info "b) Haz clic en el botón 'Run' o presiona Ctrl+Enter"
        Write-Info "c) Espera el mensaje 'Success'"
        
        Write-Host ""
        Write-Step "4️⃣ " "Verifica que se crearon:"
        Write-Info "- Tabla: planes_asignados"
        Write-Info "- Vista: planes_asignados_detallados"
        Write-Info "- Función: activar_alertas_mantenimiento"
        
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        $continuar = Read-Host "¿Ya ejecutaste el SQL en el Dashboard? (s/n)"
        
        if ($continuar -ne "s") {
            Write-Host ""
            Write-Host "⏸️  Proceso pausado" -ForegroundColor Yellow
            Write-Info "Ejecuta este script nuevamente cuando hayas aplicado la migración"
            exit 0
        }
        
        # Regenerar tipos
        Write-Host ""
        Write-Title "REGENERANDO TIPOS TYPESCRIPT"
        Write-Info "Ejecutando: npx supabase gen types typescript..."
        Write-Host ""
        
        try {
            $types = npx supabase gen types typescript --project-id $PROJECT_ID 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                $types | Out-File -FilePath $TYPES_OUTPUT -Encoding UTF8
                Write-Success "Tipos regenerados exitosamente"
                Write-Info "Archivo: $TYPES_OUTPUT"
            } else {
                throw "Error al regenerar tipos"
            }
        } catch {
            Write-Error "Error al regenerar tipos"
            Write-Host ""
            Write-Host "⚠️  Intenta manualmente:" -ForegroundColor Yellow
            Write-Info "npx supabase gen types typescript --project-id $PROJECT_ID > $TYPES_OUTPUT"
            exit 1
        }
        
        # Éxito
        Write-Host ""
        Write-Title "🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE"
        
        Write-Success "Tabla planes_asignados creada"
        Write-Success "Vista planes_asignados_detallados creada"
        Write-Success "Función activar_alertas_mantenimiento creada"
        Write-Success "Tipos TypeScript actualizados"
        
        Write-Host ""
        Write-Host "📝 PRÓXIMOS PASOS:" -ForegroundColor Cyan
        Write-Info "1. Los 6 errores de TypeScript deberían desaparecer"
        Write-Info "2. Si persisten, reinicia TypeScript Server:"
        Write-Info "   Ctrl+Shift+P → 'TypeScript: Restart TS Server'"
        Write-Info "3. Ejecuta: npm run dev"
        Write-Info "4. Ve al tab 'Planes Asignados' en la app"
        Write-Info "5. Prueba asignar un plan de mantenimiento"
        
        Write-Host ""
        Write-Host "✨ ¡Todo listo para usar el sistema de planes asignados!" -ForegroundColor Green
        Write-Host ""
    }
    
    "2" {
        # ═══════════════════════════════════════════════════════════════
        # MÉTODO AUTOMÁTICO (CLI)
        # ═══════════════════════════════════════════════════════════════
        
        Write-Title "MÉTODO AUTOMÁTICO - SUPABASE CLI"
        
        # Verificar CLI
        if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
            Write-Error "Supabase CLI no está instalado"
            Write-Host ""
            Write-Info "Instalar con: npm install -g supabase"
            Write-Host ""
            $instalar = Read-Host "¿Quieres instalarlo ahora? (s/n)"
            
            if ($instalar -eq "s") {
                Write-Info "Instalando Supabase CLI..."
                npm install -g supabase
                
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "Error al instalar Supabase CLI"
                    exit 1
                }
                
                Write-Success "Supabase CLI instalado"
            } else {
                Write-Info "Usa el Método Manual (opción 1) o instala la CLI"
                exit 0
            }
        }
        
        Write-Success "Supabase CLI encontrado"
        
        # Aplicar migración
        Write-Host ""
        Write-Info "Aplicando migración..."
        supabase db push
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Error al aplicar migración con CLI"
            Write-Host ""
            Write-Info "Posibles causas:"
            Write-Info "- No has vinculado el proyecto (supabase link)"
            Write-Info "- No estás autenticado (supabase login)"
            Write-Host ""
            Write-Info "Usa el Método Manual (opción 1) como alternativa"
            exit 1
        }
        
        Write-Success "Migración aplicada"
        
        # Regenerar tipos
        Write-Host ""
        Write-Info "Regenerando tipos..."
        npx supabase gen types typescript --project-id $PROJECT_ID | Out-File -FilePath $TYPES_OUTPUT -Encoding UTF8
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Tipos actualizados"
            Write-Host ""
            Write-Title "🎉 ¡COMPLETADO!"
            Write-Info "Ejecuta: npm run dev"
        } else {
            Write-Error "Error al regenerar tipos"
        }
    }
    
    "3" {
        # ═══════════════════════════════════════════════════════════════
        # VER INSTRUCCIONES
        # ═══════════════════════════════════════════════════════════════
        
        Write-Title "ABRIENDO INSTRUCCIONES COMPLETAS"
        
        $instruccionesFile = "APLICAR_MIGRACION_INSTRUCCIONES.md"
        
        if (Test-Path $instruccionesFile) {
            Write-Info "Abriendo: $instruccionesFile"
            Start-Process $instruccionesFile
        } else {
            Write-Error "No se encuentra el archivo de instrucciones"
            Write-Info "Busca: $instruccionesFile"
        }
    }
    
    "0" {
        Write-Host ""
        Write-Host "👋 Proceso cancelado" -ForegroundColor Yellow
        Write-Host ""
        exit 0
    }
    
    default {
        Write-Error "Opción inválida"
        Write-Info "Ejecuta el script nuevamente y selecciona 1, 2, 3 o 0"
        exit 1
    }
}

Write-Host ""
