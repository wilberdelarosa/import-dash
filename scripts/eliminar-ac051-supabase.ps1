# Script para eliminar el equipo duplicado AC-051 desde PowerShell
# Conecta directamente a Supabase usando la API REST

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ELIMINACIÓN AC-051 DUPLICADO EN SUPABASE" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Cargar variables de entorno
$envFile = ".\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
    Write-Host "✓ Variables cargadas desde .env" -ForegroundColor Green
} else {
    Write-Host "✗ No se encontró .env" -ForegroundColor Red
    exit 1
}

$supabaseUrl = $env:VITE_SUPABASE_URL
$supabaseKey = $env:VITE_SUPABASE_PUBLISHABLE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "✗ Faltan credenciales de Supabase" -ForegroundColor Red
    exit 1
}

$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

Write-Host "Conectado a: $supabaseUrl" -ForegroundColor Gray
Write-Host ""

# Función para hacer peticiones a Supabase
function Invoke-SupabaseQuery {
    param(
        [string]$Table,
        [string]$Method = "GET",
        [string]$Filter = "",
        [object]$Body = $null
    )
    
    $uri = "$supabaseUrl/rest/v1/$Table$Filter"
    
    try {
        if ($Method -eq "DELETE") {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers
            return @{ success = $true; data = $response }
        } else {
            $bodyJson = if ($Body) { $Body | ConvertTo-Json -Depth 10 } else { $null }
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $bodyJson
            return @{ success = $true; data = $response }
        }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

Write-Host "PASO 1: Verificando datos a eliminar..." -ForegroundColor Yellow
Write-Host ""

# Ver equipos AC-051
Write-Host "Equipos AC-051:" -ForegroundColor Cyan
$result = Invoke-SupabaseQuery -Table "equipos" -Filter "?ficha=eq.AC-051"
if ($result.success -and $result.data) {
    $result.data | ForEach-Object {
        Write-Host "  • ID: $($_.id), Nombre: $($_.nombre), Activo: $($_.activo)" -ForegroundColor White
    }
} else {
    Write-Host "  No se encontraron equipos AC-051" -ForegroundColor Gray
}

Write-Host ""

# Ver mantenimientos AC-051
Write-Host "Mantenimientos programados AC-051:" -ForegroundColor Cyan
$result = Invoke-SupabaseQuery -Table "mantenimientos_programados" -Filter "?ficha=eq.AC-051"
if ($result.success -and $result.data) {
    $result.data | ForEach-Object {
        Write-Host "  • ID: $($_.id), Nombre: $($_.nombre_equipo), Activo: $($_.activo), Horas: $($_.horas_km_actuales)" -ForegroundColor White
    }
} else {
    Write-Host "  No se encontraron mantenimientos AC-051" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow
$confirmacion = Read-Host "Continuar con la eliminacion? (escribe SI para confirmar)"

if ($confirmacion -ne "SI") {
    Write-Host "Operacion cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "PASO 2: Eliminando registros..." -ForegroundColor Yellow
Write-Host ""

# Eliminar actualizaciones de horas
Write-Host "[1/4] Eliminando actualizaciones de horas..." -ForegroundColor Cyan
$result = Invoke-SupabaseQuery -Table "actualizaciones_horas_km" -Method "DELETE" -Filter "?ficha=eq.AC-051"
if ($result.success) {
    Write-Host "  ✓ Actualizaciones eliminadas" -ForegroundColor Green
} else {
    Write-Host "  ✗ Error: $($result.error)" -ForegroundColor Red
}

# Eliminar mantenimientos realizados
Write-Host "[2/4] Eliminando mantenimientos realizados..." -ForegroundColor Cyan
$result = Invoke-SupabaseQuery -Table "mantenimientos_realizados" -Method "DELETE" -Filter "?ficha=eq.AC-051"
if ($result.success) {
    Write-Host "  ✓ Mantenimientos realizados eliminados" -ForegroundColor Green
} else {
    Write-Host "  ✗ Error: $($result.error)" -ForegroundColor Red
}

# Eliminar mantenimientos programados
Write-Host "[3/4] Eliminando mantenimientos programados..." -ForegroundColor Cyan
$result = Invoke-SupabaseQuery -Table "mantenimientos_programados" -Method "DELETE" -Filter "?ficha=eq.AC-051"
if ($result.success) {
    Write-Host "  ✓ Mantenimientos programados eliminados" -ForegroundColor Green
} else {
    Write-Host "  ✗ Error: $($result.error)" -ForegroundColor Red
}

# Eliminar equipo
Write-Host "[4/4] Eliminando equipo..." -ForegroundColor Cyan
$result = Invoke-SupabaseQuery -Table "equipos" -Method "DELETE" -Filter "?ficha=eq.AC-051&nombre=eq.MINICARGADOR 232D"
if ($result.success) {
    Write-Host "  ✓ Equipo eliminado" -ForegroundColor Green
} else {
    Write-Host "  ✗ Error: $($result.error)" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "VERIFICACIÓN FINAL" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar AC-051
Write-Host "Buscando AC-051 restantes:" -ForegroundColor Yellow
$result = Invoke-SupabaseQuery -Table "equipos" -Filter "?ficha=eq.AC-051"
if ($result.success -and $result.data -and $result.data.Count -gt 0) {
    Write-Host "  ⚠ Aún hay registros AC-051" -ForegroundColor Red
    $result.data | ForEach-Object {
        Write-Host "    • $($_.nombre)" -ForegroundColor White
    }
} else {
    Write-Host "  ✓ No hay registros AC-051" -ForegroundColor Green
}

# Verificar AC-052
Write-Host ""
Write-Host "Verificando AC-052:" -ForegroundColor Yellow
$result = Invoke-SupabaseQuery -Table "mantenimientos_programados" -Filter "?ficha=eq.AC-052"
if ($result.success -and $result.data) {
    Write-Host "  ✓ AC-052 encontrado:" -ForegroundColor Green
    $result.data | ForEach-Object {
        Write-Host "    • $($_.nombre_equipo) - $($_.horas_km_actuales) horas" -ForegroundColor White
    }
} else {
    Write-Host "  ✗ No se encontró AC-052" -ForegroundColor Red
}

Write-Host ""
Write-Host "✓ PROCESO COMPLETADO" -ForegroundColor Green
Write-Host "Recarga la aplicación (Ctrl+R) para ver los cambios" -ForegroundColor Cyan
Write-Host ""
