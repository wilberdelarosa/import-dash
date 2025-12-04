package com.alito.mantenimiento;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configurar UI inmersiva y edge-to-edge
        setupEdgeToEdge();
    }
    
    private void setupEdgeToEdge() {
        Window window = getWindow();
        
        // Habilitar edge-to-edge
        WindowCompat.setDecorFitsSystemWindows(window, false);
        
        // Configurar colores de barras del sistema
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+
            WindowInsetsControllerCompat controller = 
                WindowCompat.getInsetsController(window, window.getDecorView());
            controller.setAppearanceLightStatusBars(false);
            controller.setAppearanceLightNavigationBars(false);
        }
        
        // Hacer las barras translúcidas
        window.setStatusBarColor(android.graphics.Color.TRANSPARENT);
        window.setNavigationBarColor(android.graphics.Color.parseColor("#0f172a"));
        
        // Flags adicionales para experiencia inmersiva
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        
        // Mantener pantalla activa mientras la app está visible (opcional)
        // window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Re-aplicar configuración cuando la app recupera el foco
            setupEdgeToEdge();
        }
    }
}
