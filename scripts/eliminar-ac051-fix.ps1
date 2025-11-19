# Eliminar AC-051 duplicado en Supabase
Write-Host "Eliminando AC-051 duplicado..." -ForegroundColor Cyan

$envContent = Get-Content ".\.env" -Raw
$supabaseUrl = ($envContent | Select-String 'VITE_SUPABASE_URL="([^"]+)"').Matches.Groups[1].Value
$supabaseKey = ($envContent | Select-String 'VITE_SUPABASE_PUBLISHABLE_KEY="([^"]+)"').Matches.Groups[1].Value

$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
}

Write-Host "Conectado a Supabase" -ForegroundColor Green
Write-Host ""

# Ver datos actuales
Write-Host "Equipos AC-051:" -ForegroundColor Yellow
$result = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/equipos?ficha=eq.AC-051" -Headers $headers
$result | ForEach-Object { Write-Host "  ID: $($_.id), Nombre: $($_.nombre)" }

Write-Host ""
Write-Host "Mantenimientos AC-051:" -ForegroundColor Yellow  
$result = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/mantenimientos_programados?ficha=eq.AC-051" -Headers $headers
$result | ForEach-Object { Write-Host "  ID: $($_.id), Nombre: $($_.nombre_equipo), Horas: $($_.horas_km_actuales)" }

Write-Host ""
$confirm = Read-Host "Continuar? (SI para confirmar)"
if ($confirm -ne "SI") { exit 0 }

Write-Host ""
Write-Host "Eliminando registros..." -ForegroundColor Cyan

# 1. Actualizaciones
Write-Host "[1/4] Actualizaciones de horas..."
Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/actualizaciones_horas_km?ficha=eq.AC-051" -Method DELETE -Headers $headers | Out-Null
Write-Host "  OK" -ForegroundColor Green

# 2. Mantenimientos realizados  
Write-Host "[2/4] Mantenimientos realizados..."
Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/mantenimientos_realizados?ficha=eq.AC-051" -Method DELETE -Headers $headers | Out-Null
Write-Host "  OK" -ForegroundColor Green

# 3. Mantenimientos programados
Write-Host "[3/4] Mantenimientos programados..."
Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/mantenimientos_programados?ficha=eq.AC-051" -Method DELETE -Headers $headers | Out-Null
Write-Host "  OK" -ForegroundColor Green

# 4. Equipo
Write-Host "[4/4] Equipo..."
Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/equipos?ficha=eq.AC-051" -Method DELETE -Headers $headers | Out-Null
Write-Host "  OK" -ForegroundColor Green

Write-Host ""
Write-Host "COMPLETADO - Recarga la app (Ctrl+R)" -ForegroundColor Green
