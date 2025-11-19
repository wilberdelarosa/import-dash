# Script para eliminar el equipo duplicado AC-051 (232D)
# Mantiene solo el MINICARGADOR 216B

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ELIMINACIÓN DE EQUIPO DUPLICADO AC-051" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Cargar variables de entorno de Supabase
$envFile = ".\public\Deno.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
    Write-Host "✓ Variables de entorno cargadas desde Deno.env" -ForegroundColor Green
} else {
    Write-Host "✗ No se encontró el archivo Deno.env" -ForegroundColor Red
    exit 1
}

$supabaseUrl = $env:SUPABASE_URL
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "✗ Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "INFORMACIÓN DEL PROBLEMA:" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Yellow
Write-Host "Existe un duplicado en la ficha AC-051:" -ForegroundColor White
Write-Host "  • AC-051 (232D) - INACTIVO - Este será ELIMINADO ❌" -ForegroundColor Red
Write-Host "  • AC-051 (216B) - ACTIVO - Este se mantendrá ✓" -ForegroundColor Green
Write-Host ""

# Confirmar antes de proceder
Write-Host "ADVERTENCIA: Esta operación eliminará permanentemente:" -ForegroundColor Yellow
Write-Host "  1. El equipo AC-051 MINICARGADOR 232D (id=48)" -ForegroundColor White
Write-Host "  2. Su mantenimiento programado (id=42)" -ForegroundColor White
Write-Host "  3. Todos sus registros históricos anteriores a julio 2025" -ForegroundColor White
Write-Host ""

$confirmacion = Read-Host "¿Estás seguro de continuar? (escribe 'SI' para confirmar)"

if ($confirmacion -ne "SI") {
    Write-Host "Operación cancelada por el usuario." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Ejecutando migración..." -ForegroundColor Cyan
Write-Host ""

# Leer el archivo SQL
$sqlFile = ".\supabase\migrations\20251119_eliminar_ac051_duplicado.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "✗ No se encontró el archivo de migración: $sqlFile" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $sqlFile -Raw

# Ejecutar cada statement SQL
$statements = $sqlContent -split ';' | Where-Object { $_.Trim() -and $_.Trim() -notmatch '^--' }

$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
}

$successCount = 0
$errorCount = 0

foreach ($statement in $statements) {
    $cleanStatement = $statement.Trim()
    if (-not $cleanStatement) { continue }
    
    Write-Host "Ejecutando: $($cleanStatement.Substring(0, [Math]::Min(60, $cleanStatement.Length)))..." -ForegroundColor Gray
    
    try {
        # Usar la API de PostgREST para ejecutar SQL
        $body = @{
            query = $cleanStatement
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec" -Method Post -Headers $headers -Body $body -ErrorAction Stop | Out-Null
        Write-Host "  ✓ Éxito" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "RESUMEN DE LA MIGRACIÓN" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Operaciones exitosas: $successCount" -ForegroundColor Green
Write-Host "Operaciones fallidas: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($errorCount -eq 0) {
    Write-Host "✓ Migración completada exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "RESULTADO:" -ForegroundColor Cyan
    Write-Host "  • El equipo AC-051 (232D) ha sido eliminado" -ForegroundColor Green
    Write-Host "  • Solo queda el equipo AC-051 (216B) activo" -ForegroundColor Green
    Write-Host "  • Los registros históricos han sido limpiados" -ForegroundColor Green
} else {
    Write-Host "⚠ La migración tuvo errores. Revisa los mensajes anteriores." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ALTERNATIVA:" -ForegroundColor Yellow
    Write-Host "Puedes ejecutar el SQL manualmente en el dashboard de Supabase:" -ForegroundColor White
    Write-Host "1. Ve a https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "2. Abre el SQL Editor" -ForegroundColor White
    Write-Host "3. Copia y pega el contenido de:" -ForegroundColor White
    Write-Host "   $sqlFile" -ForegroundColor Cyan
}

Write-Host ""
