# Script para aplicar la migración de planes_asignados
Write-Host "🚀 Aplicando migración de planes_asignados..." -ForegroundColor Cyan

# Verificar que existe Supabase CLI
$supabaseCLI = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCLI) {
    Write-Host "❌ Supabase CLI no está instalado." -ForegroundColor Red
    Write-Host "📋 Instrucciones manuales:" -ForegroundColor Yellow
    Write-Host "1. Abre Supabase Dashboard (https://supabase.com/dashboard)" -ForegroundColor White
    Write-Host "2. Ve a tu proyecto" -ForegroundColor White
    Write-Host "3. SQL Editor → New Query" -ForegroundColor White
    Write-Host "4. Copia el contenido de supabase/migrations/20241117000000_planes_asignados.sql" -ForegroundColor White
    Write-Host "5. Ejecuta el SQL" -ForegroundColor White
    Write-Host "6. Regenera tipos: npx supabase gen types typescript --project-id YOUR_PROJECT_ID" -ForegroundColor White
    exit 1
}

# Aplicar migración
Write-Host "📝 Aplicando migración SQL..." -ForegroundColor Yellow
supabase db push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migración aplicada exitosamente" -ForegroundColor Green
    
    Write-Host "🔄 Regenerando tipos TypeScript..." -ForegroundColor Yellow
    supabase gen types typescript --local > src/integrations/supabase/types.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tipos regenerados exitosamente" -ForegroundColor Green
        Write-Host "" -ForegroundColor White
        Write-Host "🎉 ¡Listo! Ahora puedes:" -ForegroundColor Cyan
        Write-Host "   1. npm run dev - Para iniciar el servidor de desarrollo" -ForegroundColor White
        Write-Host "   2. Ir al tab 'Planes Asignados' en la aplicación" -ForegroundColor White
    } else {
        Write-Host "⚠️  Error regenerando tipos. Ejecuta manualmente:" -ForegroundColor Yellow
        Write-Host "   supabase gen types typescript --local > src/integrations/supabase/types.ts" -ForegroundColor White
    }
} else {
    Write-Host "❌ Error aplicando migración" -ForegroundColor Red
    Write-Host "💡 Intenta aplicarla manualmente usando Supabase Dashboard" -ForegroundColor Yellow
}
