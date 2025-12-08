# Script para aplicar la migración de planes Volvo
Write-Host "🚀 Aplicando migración de planes Volvo..." -ForegroundColor Cyan
Write-Host ""

# Ruta de la migración
$migrationPath = "supabase\migrations\20251207_volvo_maintenance_plans.sql"

# Verificar que el archivo existe
if (-not (Test-Path $migrationPath)) {
    Write-Host "❌ No se encontró el archivo de migración: $migrationPath" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Archivo de migración encontrado: $migrationPath" -ForegroundColor Green
Write-Host ""

# Verificar si Supabase CLI está instalado
$supabaseCLI = Get-Command supabase -ErrorAction SilentlyContinue

if ($supabaseCLI) {
    Write-Host "✅ Supabase CLI detectado" -ForegroundColor Green
    Write-Host ""
    
    $choice = Read-Host "¿Deseas aplicar la migración con Supabase CLI? (s/n)"
    
    if ($choice -eq 's' -or $choice -eq 'S') {
        Write-Host ""
        Write-Host "📝 Aplicando migración SQL con Supabase CLI..." -ForegroundColor Yellow
        supabase db push
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migración aplicada exitosamente" -ForegroundColor Green
            Write-Host ""
            Write-Host "🔄 Regenerando tipos TypeScript..." -ForegroundColor Yellow
            npx supabase gen types typescript --project-id ocsptehtkawcpcgckqeh > src/integrations/supabase/types.ts
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Tipos regenerados exitosamente" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ Error aplicando migración con CLI" -ForegroundColor Red
        }
        exit 0
    }
}

# Método manual
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  INSTRUCCIONES MANUALES - Aplicar Migración Volvo" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 La migración agregará planes de mantenimiento para:" -ForegroundColor Yellow
Write-Host "   • EC55D (Miniretro) - 3 equipos: AC-023, AC-025, AC-037" -ForegroundColor White
Write-Host "   • 140DL/EC140DL (Excavadora) - 1 equipo: AC-034" -ForegroundColor White
Write-Host ""
Write-Host "👉 PASO 1: Abre el Dashboard de Supabase" -ForegroundColor Green
Write-Host "   https://supabase.com/dashboard/project/ocsptehtkawcpcgckqeh/editor" -ForegroundColor Blue
Write-Host ""
Write-Host "👉 PASO 2: Ve a SQL Editor > New Query" -ForegroundColor Green
Write-Host ""
Write-Host "👉 PASO 3: Copia el contenido del archivo:" -ForegroundColor Green
Write-Host "   $migrationPath" -ForegroundColor White
Write-Host ""
Write-Host "👉 PASO 4: Pega el SQL y haz clic en 'Run'" -ForegroundColor Green
Write-Host ""
Write-Host "👉 PASO 5: Después de ejecutar, regenera los tipos:" -ForegroundColor Green
Write-Host "   npx supabase gen types typescript --project-id ocsptehtkawcpcgckqeh > src/integrations/supabase/types.ts" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Preguntar si desea abrir el archivo
$openFile = Read-Host "¿Deseas abrir el archivo SQL en el navegador para copiar? (s/n)"

if ($openFile -eq 's' -or $openFile -eq 'S') {
    # Mostrar contenido en la consola
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  CONTENIDO SQL PARA COPIAR" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Get-Content $migrationPath
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  FIN DEL SQL - Copia todo lo anterior" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
}

# Preguntar si desea copiar al portapapeles
$copyToClipboard = Read-Host "¿Deseas copiar el SQL al portapapeles? (s/n)"

if ($copyToClipboard -eq 's' -or $copyToClipboard -eq 'S') {
    Get-Content $migrationPath | Set-Clipboard
    Write-Host ""
    Write-Host "✅ SQL copiado al portapapeles!" -ForegroundColor Green
    Write-Host "   Ahora ve a Supabase Dashboard y pégalo con Ctrl+V" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 Una vez aplicada la migración, ejecuta:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Verifica en la app:" -ForegroundColor Yellow
Write-Host "   1. Ve a Planificador > Planes de Mantenimiento" -ForegroundColor White
Write-Host "   2. Deberías ver los nuevos planes Volvo:" -ForegroundColor White
Write-Host "      - Plan Mantenimiento Volvo EC55D" -ForegroundColor White
Write-Host "      - Plan Mantenimiento Volvo EC140DL" -ForegroundColor White
Write-Host "      - Plan Mantenimiento Volvo 140DL" -ForegroundColor White
Write-Host ""
