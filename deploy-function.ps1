#!/usr/bin/env pwsh
# Deploy Supabase Function sin CLI usando cURL

# Configuración
$SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"  # Cambiar con tu URL
$SUPABASE_ANON_KEY = "YOUR_ANON_KEY"  # Cambiar con tu key

# Lee el archivo de la función
$functionCode = Get-Content -Path "supabase/functions/send-sms/index.ts" -Raw

# Crear el payload
$payload = @{
    name = "send-sms"
    source = $functionCode
} | ConvertTo-Json -Depth 10

Write-Host "Deployando función send-sms..."
Write-Host "URL: $SUPABASE_URL"

# Hacer deploy
$response = Invoke-WebRequest `
    -Uri "$SUPABASE_URL/functions/v1/send-sms" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $SUPABASE_ANON_KEY"
        "Content-Type" = "application/json"
    } `
    -Body $payload

if ($response.StatusCode -eq 201 -or $response.StatusCode -eq 200) {
    Write-Host "✅ Función deployada correctamente!" -ForegroundColor Green
    Write-Host $response.Content
} else {
    Write-Host "❌ Error al deployar: $($response.StatusCode)" -ForegroundColor Red
    Write-Host $response.Content
}
