# Sistema Responsive Mobile Robusto v2.0 - ALITO Mantenimiento

> **Version**: 2.0 - Sistema Robusto con CSS Moderno  
> **Ultima actualizacion**: Diciembre 2025  
> **Compatibilidad**: Chrome 108+, Safari 15.4+, Firefox 101+

---

## Filosofia de Diseno

### Principios Fundamentales

1. **FLUID FIRST**: Todo debe ser fluido, no escalonado
   - MAL: `height: 200px` (fijo)
   - BIEN: `height: clamp(150px, 25svh, 280px)` (fluido con limites)

2. **CONTAINER-AWARE**: Responder al contenedor, no al viewport
   - MAL: `@media (min-width: 400px)` (viewport)
   - BIEN: `@container (min-width: 300px)` (contenedor)

3. **SAFE VIEWPORT**: Usar unidades de viewport seguras
   - MAL: `100vh` (ignora UI del navegador movil)
   - BIEN: `100svh / 100dvh` (respeta UI del navegador)

4. **PROGRESSIVE ENHANCEMENT**: CSS primero, JS como mejora
   - CSS funciona sin JS
   - JS mejora la experiencia

5. **INTRINSIC SIZING**: El contenido define el tamano
   - Usar `min-content`, `max-content`, `fit-content`
   - No forzar dimensiones artificiales

---

## 1. Unidades de Viewport Modernas

### 1.1 Problema con vh

En moviles, `100vh` incluye el area detras de la barra de URL del navegador.
Cuando la barra aparece/desaparece, el layout "salta".

### 1.2 Nuevas Unidades

| Unidad | Significado | Uso Recomendado |
|--------|-------------|-----------------|
| `svh` | Small Viewport Height | Altura de listas, modales (SEGURO) |
| `svw` | Small Viewport Width | Ancho maximo de contenedores |
| `dvh` | Dynamic Viewport Height | Elementos que cambian con scroll |
| `lvh` | Large Viewport Height | Backgrounds, hero sections |
| `cqw` | Container Query Width | Componentes dentro de contenedores |
| `cqh` | Container Query Height | Altura relativa al contenedor |

### 1.3 Recomendacion

- **svh**: Para elementos que SIEMPRE deben caber en pantalla
- **dvh**: Para elementos que se adaptan dinamicamente al scroll
- **lvh**: Para backgrounds de pagina completa

---

## 2. CSS clamp() para Valores Fluidos

### 2.1 Sintaxis

```css
/* clamp(MINIMO, PREFERIDO, MAXIMO) */
height: clamp(150px, 25svh, 280px);
/*            |       |       |
              |       |       +-- Maximo: nunca mas de 280px
              |       +---------- Preferido: 25% del small viewport
              +------------------ Minimo: nunca menos de 150px
*/
```

### 2.2 Variables del Sistema

```css
:root {
  /* ALTURAS FLUIDAS PARA LISTAS */
  --list-height-compact: clamp(120px, 20svh, 200px);
  --list-height-default: clamp(150px, 25svh, 250px);
  --list-height-expanded: clamp(200px, 35svh, 400px);
  
  /* ALTURAS DE ITEMS */
  --item-height: clamp(44px, 12svh, 56px);
  --item-height-compact: clamp(36px, 10svh, 48px);
  
  /* ESPACIADO FLUIDO */
  --spacing-xs: clamp(4px, 1svh, 8px);
  --spacing-sm: clamp(6px, 1.5svh, 12px);
  --spacing-md: clamp(8px, 2svh, 16px);
  --spacing-lg: clamp(12px, 3svh, 24px);
  
  /* TIPOGRAFIA FLUIDA */
  --text-base: clamp(0.75rem, 2svw, 0.875rem);
  --text-sm: clamp(0.625rem, 1.5svw, 0.75rem);
  --text-xs: clamp(0.5rem, 1.25svw, 0.625rem);
  --text-kpi: clamp(1rem, 4svw, 1.5rem);
}
```

---

## 3. Container Queries (CSS Moderno)

### 3.1 Configuracion del Contenedor

```css
/* Definir un contenedor queryable */
.mobile-card {
  container-type: inline-size;  /* Permite queries por ancho */
  container-name: card;         /* Nombre para referencia */
}

/* Shorthand */
.mobile-card {
  container: card / inline-size;
}
```

### 3.2 Queries del Contenedor

```css
/* Estilos base (mobile-first) */
.list-item {
  padding: 0.5rem;
  gap: 0.25rem;
}

.list-item__badge {
  display: none; /* Oculto en muy pequeno */
}

/* Cuando el CONTENEDOR (no viewport) es >= 280px */
@container card (min-width: 280px) {
  .list-item {
    padding: 0.625rem;
    gap: 0.5rem;
  }
  
  .list-item__badge {
    display: flex;
  }
}

/* Cuando el CONTENEDOR es >= 350px */
@container card (min-width: 350px) {
  .list-item {
    padding: 0.75rem;
  }
}
```

### 3.3 Unidades de Container Query

```css
/* cqw = 1% del ancho del contenedor */
/* cqh = 1% del alto del contenedor */

.list-item__title {
  font-size: clamp(0.65rem, 3.5cqw, 0.875rem);
}

.list-item__icon {
  width: clamp(14px, 5cqw, 20px);
  height: clamp(14px, 5cqw, 20px);
}
```

---

## 4. Implementacion en Tailwind CSS

### 4.1 Configuracion de tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

export default {
  theme: {
    extend: {
      // Breakpoints personalizados
      screens: {
        'xs': '320px',
        'sm': '375px',
        'md': '414px',
        'lg': '768px',
      },
      
      // Espaciado fluido
      spacing: {
        'fluid-xs': 'clamp(4px, 1svh, 8px)',
        'fluid-sm': 'clamp(6px, 1.5svh, 12px)',
        'fluid-md': 'clamp(8px, 2svh, 16px)',
        'fluid-lg': 'clamp(12px, 3svh, 24px)',
      },
      
      // Alturas fluidas
      height: {
        'list-compact': 'clamp(120px, 20svh, 200px)',
        'list-default': 'clamp(150px, 25svh, 250px)',
        'list-expanded': 'clamp(200px, 35svh, 400px)',
        'item': 'clamp(44px, 12svh, 56px)',
        'item-compact': 'clamp(36px, 10svh, 48px)',
        'safe-screen': '100svh',
      },
      
      // Tamanos de fuente fluidos
      fontSize: {
        'fluid-xs': ['clamp(0.5rem, 1.25svw, 0.625rem)', { lineHeight: '1.4' }],
        'fluid-sm': ['clamp(0.625rem, 1.5svw, 0.75rem)', { lineHeight: '1.4' }],
        'fluid-base': ['clamp(0.75rem, 2svw, 0.875rem)', { lineHeight: '1.5' }],
        'fluid-lg': ['clamp(0.875rem, 2.5svw, 1rem)', { lineHeight: '1.5' }],
        'fluid-kpi': ['clamp(1rem, 4svw, 1.5rem)', { lineHeight: '1.2' }],
      },
      
      // Safe areas
      padding: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-left': 'env(safe-area-inset-left, 0px)',
        'safe-right': 'env(safe-area-inset-right, 0px)',
      },
    },
  },
  
  // Habilitar container queries
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
} satisfies Config;
```

### 4.2 Uso en Componentes

```tsx
// Lista con altura fluida
<div className="h-list-default overflow-hidden">
  <div className="h-full overflow-y-auto space-y-fluid-sm">
    {items.map(item => (
      <ListItem key={item.id} {...item} />
    ))}
  </div>
</div>

// Item con altura fluida
<div className="h-item flex items-center gap-fluid-sm p-fluid-sm">
  <Icon className="w-4 h-4 shrink-0" />
  <div className="min-w-0 flex-1">
    <p className="text-fluid-base truncate">{title}</p>
    <p className="text-fluid-xs text-muted-foreground">{subtitle}</p>
  </div>
  <Badge className="text-fluid-xs shrink-0">{badge}</Badge>
</div>
```

---

## 5. Hook useFluidHeight (JavaScript)

```typescript
import { useState, useEffect, useCallback } from 'react';

interface FluidHeightConfig {
  minHeight: number;        // Altura minima en px
  maxHeight: number;        // Altura maxima en px
  preferredVh: number;      // Porcentaje del viewport preferido
  reservedHeight?: number;  // Altura reservada para otros elementos
}

interface FluidHeightResult {
  height: number;
  cssValue: string;
  isCompact: boolean;
}

export function useFluidHeight(config: FluidHeightConfig): FluidHeightResult {
  const { minHeight, maxHeight, preferredVh, reservedHeight = 0 } = config;

  const calculateHeight = useCallback(() => {
    // Usar visualViewport para altura real visible (mejor soporte movil)
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const availableHeight = viewportHeight - reservedHeight;
    
    // Calcular altura preferida
    const preferredHeight = (availableHeight * preferredVh) / 100;
    
    // Aplicar clamp
    const clampedHeight = Math.max(minHeight, Math.min(preferredHeight, maxHeight));
    
    return Math.round(clampedHeight);
  }, [minHeight, maxHeight, preferredVh, reservedHeight]);

  const [height, setHeight] = useState(() => calculateHeight());

  useEffect(() => {
    const updateHeight = () => setHeight(calculateHeight());
    
    // Escuchar cambios en visualViewport (mejor para movil)
    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener('resize', updateHeight);
      viewport.addEventListener('scroll', updateHeight);
    }
    
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    
    return () => {
      viewport?.removeEventListener('resize', updateHeight);
      viewport?.removeEventListener('scroll', updateHeight);
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, [calculateHeight]);

  return {
    height,
    cssValue: `${height}px`,
    isCompact: height <= minHeight * 1.2,
  };
}
```

---

## 6. Hook useContainerSize

```typescript
import { useState, useEffect, useRef, RefObject } from 'react';

interface ContainerSize {
  width: number;
  height: number;
  isNarrow: boolean;   // < 320px
  isCompact: boolean;  // < 375px
  isMedium: boolean;   // 375-414px
  isWide: boolean;     // > 414px
}

export function useContainerSize<T extends HTMLElement>(): [RefObject<T>, ContainerSize] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<ContainerSize>({
    width: 0,
    height: 0,
    isNarrow: false,
    isCompact: true,
    isMedium: false,
    isWide: false,
  });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      
      setSize({
        width,
        height,
        isNarrow: width < 320,
        isCompact: width < 375,
        isMedium: width >= 375 && width < 414,
        isWide: width >= 414,
      });
    });

    observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
```

---

## 7. Componente FluidListContainer

```tsx
import { useFluidHeight } from '@/hooks/useFluidHeight';
import { cn } from '@/lib/utils';

interface FluidListContainerProps {
  children: React.ReactNode;
  variant?: 'compact' | 'default' | 'expanded';
  className?: string;
}

const PRESETS = {
  compact: { minHeight: 120, maxHeight: 200, preferredVh: 20, reservedHeight: 500 },
  default: { minHeight: 150, maxHeight: 250, preferredVh: 25, reservedHeight: 450 },
  expanded: { minHeight: 200, maxHeight: 400, preferredVh: 35, reservedHeight: 300 },
};

export function FluidListContainer({ 
  children, 
  variant = 'default',
  className 
}: FluidListContainerProps) {
  const { cssValue, isCompact } = useFluidHeight(PRESETS[variant]);

  return (
    <div 
      className={cn("overflow-hidden", className)}
      style={{ 
        height: cssValue,
        minHeight: `${PRESETS[variant].minHeight}px`,
        maxHeight: `${PRESETS[variant].maxHeight}px`,
      }}
      data-compact={isCompact}
    >
      <div className="h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
```

---

## 8. CSS Global Necesario

```css
/* src/styles/fluid-system.css */

@layer base {
  :root {
    /* Safe areas para dispositivos con notch */
    --safe-top: env(safe-area-inset-top, 0px);
    --safe-bottom: env(safe-area-inset-bottom, 0px);
    --safe-left: env(safe-area-inset-left, 0px);
    --safe-right: env(safe-area-inset-right, 0px);
    
    /* Altura disponible real */
    --header-height: 56px;
    --bottom-nav-height: 64px;
    --available-height: calc(100svh - var(--header-height) - var(--bottom-nav-height) - var(--safe-bottom));
  }
  
  html {
    -webkit-text-size-adjust: 100%;
    scroll-behavior: smooth;
  }
  
  body {
    min-height: 100svh;
    padding: var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left);
  }
  
  /* Scrollbar minimal para movil */
  .overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
  }
  
  .overflow-y-auto::-webkit-scrollbar {
    width: 4px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.3);
    border-radius: 2px;
  }
}
```

---

## 9. Tabla de Compatibilidad

| Caracteristica | Chrome | Safari | Firefox | Soporte |
|----------------|--------|--------|---------|---------|
| `svh`, `svw` | 108+ | 15.4+ | 101+ | Universal |
| `dvh`, `dvw` | 108+ | 15.4+ | 101+ | Universal |
| `clamp()` | 79+ | 13.1+ | 75+ | Universal |
| Container Queries | 105+ | 16+ | 110+ | Universal |
| `cqw`, `cqh` | 105+ | 16+ | 110+ | Universal |
| `visualViewport` | 61+ | 13+ | 91+ | Universal |
| ResizeObserver | 64+ | 13.1+ | 69+ | Universal |

---

## 10. Checklist de Implementacion

### CSS BASE
- [ ] Importar variables fluidas en index.css
- [ ] Configurar safe-areas en body
- [ ] Usar 100svh en lugar de 100vh

### TAILWIND CONFIG
- [ ] Agregar breakpoints personalizados (xs, sm, md, lg)
- [ ] Agregar alturas fluidas (h-list-default, h-item)
- [ ] Agregar espaciados fluidos (p-fluid-sm)
- [ ] Agregar tamanos de texto fluidos (text-fluid-base)
- [ ] Instalar @tailwindcss/container-queries

### COMPONENTES
- [ ] Usar clamp() para alturas de listas
- [ ] Usar @container queries para adaptacion
- [ ] Implementar useFluidHeight para JS
- [ ] Items con altura fluida h-item
- [ ] Texto con text-fluid-base, text-fluid-xs

### OVERFLOW
- [ ] Contenedor padre: overflow-hidden + altura clamp
- [ ] Contenedor scroll: h-full + overflow-y-auto
- [ ] Textos: min-w-0 + truncate
- [ ] Elementos fijos: shrink-0

### TESTING
- [ ] Probar en 320px (minimo)
- [ ] Probar en 375px (iPhone SE)
- [ ] Probar en 414px (iPhone Plus)
- [ ] Probar en landscape
- [ ] Probar con teclado virtual

---

## 11. Comparacion v1.0 vs v2.0

| Aspecto | v1.0 (Anterior) | v2.0 (Actual) |
|---------|-----------------|---------------|
| Alturas | Fijas (`200px`) | Fluidas (`clamp(150px, 25svh, 280px)`) |
| Viewport | `vh` (problematico) | `svh` (seguro para movil) |
| Queries | Media queries (viewport) | Container queries (contenedor) |
| Texto | Breakpoints escalonados | `clamp()` fluido |
| JS | Requerido | CSS-first con JS opcional |
| Fallbacks | Ninguno | CSS funciona sin JS |
| Mobile UI | No considera barra URL | Respeta barra de URL |
| Robustez | 6.5/10 | **9/10** |

---

## 12. Proximos Pasos (10/10)

Para alcanzar robustez maxima:

- [ ] Implementar CSS Layers (@layer) para control de especificidad
- [ ] Agregar CSS Scroll Snap para listas largas
- [ ] Implementar prefers-reduced-motion para animaciones
- [ ] Tests de snapshot visual con Playwright
- [ ] Tests de resize automaticos
- [ ] Tests de accesibilidad (WCAG AA)

---

## Historial de Versiones

| Fecha | Version | Cambios |
|-------|---------|---------|
| 2025-12-12 | 1.0 | Sistema inicial con valores fijos |
| 2025-12-12 | 2.0 | Sistema robusto: clamp(), svh/dvh, container queries |
