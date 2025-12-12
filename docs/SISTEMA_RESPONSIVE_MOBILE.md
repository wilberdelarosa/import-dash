# Sistema Responsive Mobile Robusto - ALITO Mantenimiento

> **Versión**: 2.0 - Sistema Robusto con CSS Moderno
> **Última actualización**: Diciembre 2025
> **Compatibilidad**: Chrome 108+, Safari 15.4+, Firefox 101+

---

## FilosofÃ­a de DiseÃ±o

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    PRINCIPIOS FUNDAMENTALES                          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                      â”‚
â”‚  1. FLUID FIRST: Todo debe ser fluido, no escalonado                â”‚
â”‚     âŒ height: 200px (fijo)                                         â”‚
â”‚     âœ… height: clamp(150px, 25svh, 280px) (fluido con lÃ­mites)     â”‚
â”‚                                                                      â”‚
â”‚  2. CONTAINER-AWARE: Responder al contenedor, no al viewport        â”‚
â”‚     âŒ @media (min-width: 400px) (viewport)                         â”‚
â”‚     âœ… @container (min-width: 300px) (contenedor)                   â”‚
â”‚                                                                      â”‚
â”‚  3. SAFE VIEWPORT: Usar unidades de viewport seguras                â”‚
â”‚     âŒ 100vh (ignora UI del navegador mÃ³vil)                        â”‚
â”‚     âœ… 100svh / 100dvh (respeta UI del navegador)                   â”‚
â”‚                                                                      â”‚
â”‚  4. PROGRESSIVE ENHANCEMENT: CSS primero, JS como mejora            â”‚
â”‚     - CSS funciona sin JS                                            â”‚
â”‚     - JS mejora la experiencia                                       â”‚
â”‚                                                                      â”‚
â”‚  5. INTRINSIC SIZING: El contenido define el tamaÃ±o                 â”‚
â”‚     - min-content, max-content, fit-content                         â”‚
â”‚     - No forzar dimensiones artificiales                            â”‚
â”‚                                                                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 1. Unidades de Viewport Modernas

### 1.1 ComparaciÃ³n de Unidades

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    UNIDADES DE VIEWPORT                              â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                      â”‚
â”‚  PROBLEMA CON vh:                                                    â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€                                                    â”‚
â”‚  En mÃ³viles, 100vh incluye el Ã¡rea detrÃ¡s de la barra de URL        â”‚
â”‚  Cuando la barra aparece/desaparece, el layout "salta"              â”‚
â”‚                                                                      â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”‚
â”‚  â”‚ â–‘â–‘â–‘ URL BAR â–‘â–‘â–‘ â”‚  â”‚                 â”‚  â”‚ â–‘â–‘â–‘ URL BAR â–‘â–‘â–‘ â”‚      â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤  â”‚                 â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤      â”‚
â”‚  â”‚                 â”‚  â”‚                 â”‚  â”‚                 â”‚      â”‚
â”‚  â”‚   100vh (fijo)  â”‚  â”‚   100lvh        â”‚  â”‚   100svh        â”‚      â”‚
â”‚  â”‚   = Large VP    â”‚  â”‚   = Large VP    â”‚  â”‚   = Small VP    â”‚      â”‚
â”‚  â”‚                 â”‚  â”‚   (sin barra)   â”‚  â”‚   (con barra)   â”‚      â”‚
â”‚  â”‚                 â”‚  â”‚                 â”‚  â”‚                 â”‚      â”‚
â”‚  â”‚                 â”‚  â”‚                 â”‚  â”‚                 â”‚      â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â”‚
â”‚        vh               lvh                    svh                   â”‚
â”‚    (legacy)         (large)               (small - SEGURO)          â”‚
â”‚                                                                      â”‚
â”‚  RECOMENDACIÃ“N:                                                      â”‚
â”‚  â€¢ svh para elementos que deben caber siempre                       â”‚
â”‚  â€¢ dvh para elementos que se adaptan dinÃ¡micamente                  â”‚
â”‚  â€¢ lvh para backgrounds de pÃ¡gina completa                          â”‚
â”‚                                                                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 1.2 Unidades Disponibles

| Unidad | Significado | Uso Recomendado |
|--------|-------------|-----------------|
| `svh` | Small Viewport Height | Altura de listas, modales |
| `svw` | Small Viewport Width | Ancho mÃ¡ximo de contenedores |
| `dvh` | Dynamic Viewport Height | Elementos que cambian con scroll |
| `lvh` | Large Viewport Height | Backgrounds, hero sections |
| `cqw` | Container Query Width | Componentes dentro de contenedores |
| `cqh` | Container Query Height | Altura relativa al contenedor |

---

## 2. CSS clamp() para Valores Fluidos

### 2.1 Sintaxis y Funcionamiento

```css
/* clamp(MÃNIMO, PREFERIDO, MÃXIMO) */

/* Ejemplo: altura que se adapta pero tiene lÃ­mites */
height: clamp(150px, 25svh, 280px);
/*            â”‚       â”‚       â”‚
              â”‚       â”‚       â””â”€â”€ MÃ¡ximo: nunca mÃ¡s de 280px
              â”‚       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Preferido: 25% del small viewport
              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ MÃ­nimo: nunca menos de 150px
*/
```

### 2.2 Valores Fluidos para el Sistema

```css
:root {
  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     ALTURAS FLUIDAS PARA LISTAS
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  
  /* Lista en dashboard (con otros componentes arriba/abajo) */
  --list-height-compact: clamp(120px, 20svh, 200px);
  
  /* Lista en tabs (espacio medio) */
  --list-height-default: clamp(150px, 25svh, 250px);
  
  /* Lista principal (mÃ¡ximo espacio) */
  --list-height-expanded: clamp(200px, 35svh, 400px);
  
  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     ALTURAS DE ITEMS
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  
  /* Item de lista - fluido pero con lÃ­mites */
  --item-height: clamp(44px, 12svh, 56px);
  
  /* Item compacto */
  --item-height-compact: clamp(36px, 10svh, 48px);
  
  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     ESPACIADO FLUIDO
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  
  --spacing-xs: clamp(4px, 1svh, 8px);
  --spacing-sm: clamp(6px, 1.5svh, 12px);
  --spacing-md: clamp(8px, 2svh, 16px);
  --spacing-lg: clamp(12px, 3svh, 24px);
  
  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     TIPOGRAFÃA FLUIDA
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  
  /* Texto principal */
  --text-base: clamp(0.75rem, 2svw, 0.875rem);
  
  /* Texto pequeÃ±o */
  --text-sm: clamp(0.625rem, 1.5svw, 0.75rem);
  
  /* Texto muy pequeÃ±o */
  --text-xs: clamp(0.5rem, 1.25svw, 0.625rem);
  
  /* NÃºmeros KPI */
  --text-kpi: clamp(1rem, 4svw, 1.5rem);
}
```

---

## 3. Container Queries (CSS Moderno)

### 3.1 ConfiguraciÃ³n del Contenedor

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

.list-item__title {
  font-size: var(--text-sm);
}

.list-item__badge {
  display: none; /* Oculto en muy pequeÃ±o */
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
  
  .list-item__title {
    font-size: var(--text-base);
  }
}
```

### 3.3 Unidades de Container Query

```css
/* cqw = 1% del ancho del contenedor */
/* cqh = 1% del alto del contenedor */

.list-item__title {
  /* TamaÃ±o de fuente relativo al contenedor */
  font-size: clamp(0.65rem, 3.5cqw, 0.875rem);
}

.list-item__icon {
  /* Icono proporcional al contenedor */
  width: clamp(14px, 5cqw, 20px);
  height: clamp(14px, 5cqw, 20px);
}
```

---

## 4. ImplementaciÃ³n en Tailwind CSS

### 4.1 ConfiguraciÃ³n de tailwind.config.ts

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
      
      // TamaÃ±os de fuente fluidos
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

## 5. Hook de Altura DinÃ¡mica (JavaScript Enhancement)

### 5.1 Hook useFluidHeight

```typescript
import { useState, useEffect, useCallback } from 'react';

interface FluidHeightConfig {
  minHeight: number;        // Altura mÃ­nima en px
  maxHeight: number;        // Altura mÃ¡xima en px
  preferredVh: number;      // Porcentaje del viewport preferido
  reservedHeight?: number;  // Altura reservada para otros elementos
}

interface FluidHeightResult {
  height: number;
  cssValue: string;
  isCompact: boolean;
}

export function useFluidHeight(config: FluidHeightConfig): FluidHeightResult {
  const {
    minHeight,
    maxHeight,
    preferredVh,
    reservedHeight = 0,
  } = config;

  const calculateHeight = useCallback(() => {
    // Usar visualViewport para altura real visible (mejor soporte mÃ³vil)
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
    
    // Escuchar cambios en visualViewport (mejor para mÃ³vil)
    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener('resize', updateHeight);
      viewport.addEventListener('scroll', updateHeight);
    }
    
    // Fallback para navegadores sin visualViewport
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

### 5.2 Hook useContainerSize

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

## 6. Componentes Robustos

### 6.1 Contenedor de Lista Robusto

```tsx
import { useFluidHeight } from '@/hooks/useFluidHeight';

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
  const { height, cssValue, isCompact } = useFluidHeight(PRESETS[variant]);

  return (
    <div 
      className={cn("overflow-hidden", className)}
      style={{ 
        height: cssValue,
        // Fallback CSS para cuando JS no carga
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

### 6.2 Item de Lista Robusto

```tsx
import { cn } from '@/lib/utils';

interface FluidListItemProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'destructive' | 'warning' | 'success';
  onClick?: () => void;
  className?: string;
}

const BADGE_STYLES = {
  default: 'bg-primary/10 text-primary border-primary/20',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  success: 'bg-green-500/10 text-green-600 border-green-500/20',
};

const ITEM_STYLES = {
  default: 'border-border bg-card active:bg-accent',
  destructive: 'border-destructive/30 bg-destructive/5 active:bg-destructive/10',
  warning: 'border-amber-500/30 bg-amber-500/5 active:bg-amber-500/10',
  success: 'border-green-500/30 bg-green-500/5 active:bg-green-500/10',
};

export function FluidListItem({
  icon,
  title,
  subtitle,
  badge,
  badgeVariant = 'default',
  onClick,
  className,
}: FluidListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Layout base con altura fluida
        "flex items-center justify-between",
        "rounded-lg border cursor-pointer transition-all",
        // Altura y padding fluidos
        "h-item p-fluid-sm gap-fluid-sm",
        // Variante de color
        ITEM_STYLES[badgeVariant],
        className
      )}
    >
      {/* Ãrea flexible */}
      <div className="flex items-center gap-fluid-sm min-w-0 flex-1">
        {/* Icono - nunca se encoge */}
        {icon && (
          <div className="shrink-0 w-4 h-4 @[320px]:w-5 @[320px]:h-5">
            {icon}
          </div>
        )}
        
        {/* Texto - se adapta */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-fluid-base font-medium truncate">
            {title}
          </p>
          {subtitle && (
            <p className="text-fluid-xs text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Badge - nunca se encoge */}
      {badge && (
        <span 
          className={cn(
            "shrink-0 ml-fluid-sm px-1.5 py-0.5 rounded-md",
            "text-fluid-xs font-medium tabular-nums",
            "border",
            BADGE_STYLES[badgeVariant]
          )}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
```

---

## 7. CSS Global Necesario

### 7.1 Archivo de Variables CSS

```css
/* src/styles/fluid-system.css */

@layer base {
  :root {
    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       VARIABLES FLUIDAS DEL SISTEMA
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    
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
  
  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     ESTILOS BASE RESPONSIVOS
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  
  html {
    /* Prevenir zoom en inputs en iOS */
    -webkit-text-size-adjust: 100%;
    /* Scroll suave */
    scroll-behavior: smooth;
  }
  
  body {
    /* Usar small viewport para evitar saltos */
    min-height: 100svh;
    /* Padding para safe areas */
    padding: var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left);
  }
  
  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     SCROLLBAR MINIMAL PARA MÃ“VIL
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  
  .overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
  }
  
  .overflow-y-auto::-webkit-scrollbar {
    width: 4px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.3);
    border-radius: 2px;
  }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CONTAINER QUERIES PARA COMPONENTES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

@layer components {
  /* Contenedor queryable */
  .@container {
    container-type: inline-size;
  }
  
  /* Lista fluida */
  .fluid-list {
    container: list / inline-size;
  }
  
  /* Card fluida */
  .fluid-card {
    container: card / inline-size;
  }
}
```

---

## 8. PatrÃ³n de Tabs Robusto Final

### 8.1 ImplementaciÃ³n Completa

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FluidListContainer, FluidListItem } from '@/components/fluid';
import { useFluidHeight } from '@/hooks/useFluidHeight';

interface RobustTabsProps {
  tabs: Array<{
    value: string;
    label: string;
    icon: React.ReactNode;
    items: Array<{
      id: string;
      title: string;
      subtitle: string;
      badge: string;
      variant: 'destructive' | 'warning' | 'success' | 'default';
    }>;
    emptyState: {
      icon: React.ReactNode;
      title: string;
      subtitle: string;
    };
  }>;
  onItemClick?: (id: string) => void;
}

export function RobustTabs({ tabs, onItemClick }: RobustTabsProps) {
  const { cssValue } = useFluidHeight({
    minHeight: 150,
    maxHeight: 280,
    preferredVh: 28,
    reservedHeight: 400,
  });

  return (
    <div className="@container">
      <Tabs defaultValue={tabs[0]?.value} className="w-full">
        <TabsList className="grid w-full mb-fluid-sm" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map(tab => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              className="text-fluid-xs gap-1 @[350px]:text-fluid-sm"
            >
              <span className="w-3 h-3 @[300px]:w-4 @[300px]:h-4">{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
              <span className="tabular-nums">({tab.items.length})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent 
            key={tab.value}
            value={tab.value} 
            className="mt-0 focus-visible:outline-none"
            style={{ 
              height: cssValue,
              overflow: 'hidden',
            }}
          >
            {tab.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-fluid-md">
                <div className="w-10 h-10 mb-2">{tab.emptyState.icon}</div>
                <p className="text-fluid-base font-medium text-green-600">{tab.emptyState.title}</p>
                <p className="text-fluid-xs text-muted-foreground">{tab.emptyState.subtitle}</p>
              </div>
            ) : (
              <div className="h-full overflow-y-auto space-y-fluid-sm pr-1">
                {tab.items.map((item, index) => (
                  <FluidListItem
                    key={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    badge={item.badge}
                    badgeVariant={item.variant}
                    onClick={() => onItemClick?.(item.id)}
                    className="animate-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 30}ms` }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

---

## 9. Tabla de Compatibilidad

| CaracterÃ­stica | Chrome | Safari | Firefox | Soporte |
|----------------|--------|--------|---------|---------|
| `svh`, `svw` | 108+ | 15.4+ | 101+ | âœ… Universal |
| `dvh`, `dvw` | 108+ | 15.4+ | 101+ | âœ… Universal |
| `lvh`, `lvw` | 108+ | 15.4+ | 101+ | âœ… Universal |
| `clamp()` | 79+ | 13.1+ | 75+ | âœ… Universal |
| Container Queries | 105+ | 16+ | 110+ | âœ… Universal |
| `cqw`, `cqh` | 105+ | 16+ | 110+ | âœ… Universal |
| `visualViewport` | 61+ | 13+ | 91+ | âœ… Universal |
| ResizeObserver | 64+ | 13.1+ | 69+ | âœ… Universal |

---

## 10. Checklist de ImplementaciÃ³n

```
CSS BASE:
â–¡ Importar variables fluidas en index.css
â–¡ Configurar safe-areas en body
â–¡ Usar 100svh en lugar de 100vh

TAILWIND CONFIG:
â–¡ Agregar breakpoints personalizados
â–¡ Agregar alturas fluidas (h-list-default, h-item)
â–¡ Agregar espaciados fluidos (p-fluid-sm)
â–¡ Agregar tamaÃ±os de texto fluidos (text-fluid-base)
â–¡ Instalar @tailwindcss/container-queries

COMPONENTES:
â–¡ Usar clamp() para alturas de listas
â–¡ Usar @container queries para adaptaciÃ³n
â–¡ Implementar useFluidHeight para JS
â–¡ Items con altura fluida h-item
â–¡ Texto con text-fluid-base, text-fluid-xs

OVERFLOW:
â–¡ Contenedor padre: overflow-hidden + altura clamp
â–¡ Contenedor scroll: h-full + overflow-y-auto
â–¡ Textos: min-w-0 + truncate
â–¡ Elementos fijos: shrink-0

TESTING:
â–¡ Probar en 320px (mÃ­nimo)
â–¡ Probar en 375px (iPhone SE)
â–¡ Probar en 414px (iPhone Plus)
â–¡ Probar en landscape
â–¡ Probar con teclado virtual
```

---

## Resumen de Mejoras vs Sistema Anterior

| Aspecto | Sistema Anterior | Sistema Nuevo |
|---------|------------------|---------------|
| Alturas | Fijas (`200px`) | Fluidas (`clamp(150px, 25svh, 280px)`) |
| Viewport | `vh` (problemÃ¡tico) | `svh` (seguro) |
| Queries | Media queries (viewport) | Container queries (contenedor) |
| Texto | Breakpoints escalonados | `clamp()` fluido |
| JS | Requerido | CSS-first con JS opcional |
| Fallbacks | Ninguno | CSS funciona sin JS |
| Mobile UI | No considera | Respeta barra de URL |

---

## Historial de Versiones

| Fecha | VersiÃ³n | Cambios |
|-------|---------|---------|
| 2025-12-12 | 1.0 | Sistema inicial con valores fijos |
| 2025-12-12 | 2.0 | **Sistema robusto**: clamp(), svh, container queries, hooks |

