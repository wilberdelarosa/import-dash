# 📱 GUÍA COMPLETA: ADAPTACIÓN MÓVIL DE ALITO MANTENIMIENTO APP

## ✅ **YA IMPLEMENTADO**

### 1. **Infraestructura Base** ✅
- ✅ `useDeviceDetection.ts` - Hook de detección de dispositivos
- ✅ `MobileLayout.tsx` - Layout con bottom navigation
- ✅ `MobileCard.tsx` - Cards optimizados para móvil
- ✅ `MobileTable.tsx` - Tablas con scroll horizontal
- ✅ `ResponsiveWrapper.tsx` - Wrapper adaptativo
- ✅ `DashboardMobile.tsx` - Dashboard móvil completo
- ✅ `Dashboard.tsx` - Integrado con detección automática

### 2. **Componentes Creados**
```typescript
// Hook principal
useDeviceDetection()
  → type: 'mobile' | 'tablet' | 'desktop'
  → isMobile, isTablet, isDesktop
  → orientation: 'portrait' | 'landscape'
  → dimensions: { width, height }
  → breakpoints: xs, sm, md, lg, xl, 2xl

// Layout móvil
<MobileLayout 
  title="Título"
  showBottomNav={true}
  headerActions={<Actions />}
>
  {children}
</MobileLayout>

// Cards móviles
<MobileCard 
  title="Título"
  variant="compact | list-item"
  icon={<Icon />}
  onClick={() => {}}
/>

<MobileListCard
  title="Equipo AC-001"
  subtitle="913 hrs vencido"
  meta="Último mant: 15/Oct"
  icon={<Icon />}
  badge={<Badge />}
/>

// Tabla móvil
<MobileTable
  data={equipos}
  columns={[
    { header: 'Ficha', accessor: 'ficha' },
    { header: 'Nombre', accessor: 'nombre', mobileHidden: true }
  ]}
  actions={[
    { label: 'Editar', onClick: (row) => edit(row) }
  ]}
  compact={true}
/>
```

---

## 🚀 **PRÓXIMOS PASOS: ADAPTAR RESTO DE MÓDULOS**

### 3. **Equipos Móvil** (Prioridad: ALTA)

**Archivo**: `src/components/mobile/EquiposMobile.tsx`

**Características necesarias**:
- ✅ Lista vertical de cards con equipos
- ✅ Búsqueda/filtro optimizado (drawer bottom)
- ✅ Vista detalle fullscreen
- ✅ Formulario crear/editar en drawer
- ✅ Estados visuales (activo/inactivo)
- ✅ Acciones rápidas (editar, desactivar, ver mantenimientos)

**Ejemplo de estructura**:
```tsx
export function EquiposMobile() {
  return (
    <MobileLayout title="Equipos">
      {/* Barra de búsqueda sticky */}
      <div className="sticky top-0 z-10 bg-background pb-2">
        <Input placeholder="Buscar equipo..." />
        <Button>Filtros</Button>
      </div>

      {/* Lista de equipos */}
      <div className="space-y-2">
        {equipos.map(equipo => (
          <MobileListCard
            key={equipo.id}
            title={equipo.ficha}
            subtitle={equipo.nombre}
            meta={`${equipo.marca} ${equipo.modelo}`}
            icon={<Truck />}
            badge={equipo.activo ? 
              <Badge>Activo</Badge> : 
              <Badge variant="secondary">Inactivo</Badge>
            }
            onClick={() => navigate(`/equipos/${equipo.id}`)}
          />
        ))}
      </div>

      {/* FAB para agregar equipo */}
      <Button 
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <Plus />
      </Button>
    </MobileLayout>
  );
}
```

**Integración en `src/pages/Equipos.tsx`**:
```tsx
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { EquiposMobile } from '@/components/mobile/EquiposMobile';

export default function Equipos() {
  const { isMobile } = useDeviceDetection();
  
  if (isMobile) {
    return <EquiposMobile equipos={data.equipos} />;
  }
  
  // Versión desktop original...
}
```

---

### 4. **Control Mantenimiento Móvil** (Prioridad: ALTA)

**Archivo**: `src/components/mobile/MantenimientoMobile.tsx`

**Características**:
- ✅ Tabla horizontal scrollable
- ✅ Filtros en bottom sheet
- ✅ Vista detalle de mantenimiento
- ✅ Acciones contextuales por mantenimiento
- ✅ Indicadores visuales de estado (vencido, próximo, ok)
- ✅ Registrar mantenimiento realizado (modal fullscreen)

**Ejemplo**:
```tsx
<MobileLayout title="Mantenimientos">
  {/* Filtros chip */}
  <div className="flex gap-2 overflow-x-auto pb-2">
    <Badge variant={filter === 'all' ? 'default' : 'outline'}>
      Todos ({total})
    </Badge>
    <Badge variant={filter === 'vencidos' ? 'destructive' : 'outline'}>
      Vencidos ({vencidos})
    </Badge>
    <Badge variant={filter === 'proximos' ? 'default' : 'outline'}>
      Próximos ({proximos})
    </Badge>
  </div>

  {/* Tabla compacta */}
  <MobileTable
    data={mantenimientos}
    columns={[
      { header: 'Equipo', accessor: 'nombreEquipo' },
      { header: 'Tipo', accessor: 'tipoMantenimiento', mobileHidden: true },
      { header: 'Restante', accessor: row => formatRestante(row) }
    ]}
    actions={[
      { 
        label: 'Registrar mantenimiento',
        icon: <Wrench />,
        onClick: (row) => openRegistrar(row)
      }
    ]}
    compact={true}
  />
</MobileLayout>
```

---

### 5. **Inventario Móvil** (Prioridad: MEDIA)

**Archivo**: `src/components/mobile/InventarioMobile.tsx`

**Características**:
- ✅ Grid de cards 2 columnas
- ✅ Filtro por categoría (tabs)
- ✅ Scanner QR (opcional, usar `react-qr-scanner`)
- ✅ Alertas de stock bajo destacadas
- ✅ Registrar movimiento rápido (sheet bottom)

**Ejemplo**:
```tsx
<MobileLayout title="Inventario">
  {/* Tabs de categorías */}
  <Tabs defaultValue="all" className="sticky top-0">
    <TabsList>
      <TabsTrigger value="all">Todos</TabsTrigger>
      <TabsTrigger value="filtros">Filtros</TabsTrigger>
      <TabsTrigger value="aceites">Aceites</TabsTrigger>
    </TabsList>
  </Tabs>

  {/* Grid de items */}
  <div className="grid grid-cols-2 gap-3">
    {items.map(item => (
      <MobileCard
        key={item.id}
        variant="compact"
        className={item.cantidad < item.stockMinimo && 'border-orange-500'}
      >
        <div className="text-center">
          <p className="text-2xl font-bold">{item.cantidad}</p>
          <p className="text-xs text-muted-foreground truncate">
            {item.nombre}
          </p>
          {item.cantidad < item.stockMinimo && (
            <Badge variant="destructive" className="mt-1 text-[0.65rem]">
              Stock bajo
            </Badge>
          )}
        </div>
      </MobileCard>
    ))}
  </div>
</MobileLayout>
```

---

### 6. **Planificador Móvil** (Prioridad: MEDIA)

**Archivo**: `src/components/mobile/PlanificadorMobile.tsx`

**Características**:
- ✅ Vista timeline vertical (en lugar de horizontal)
- ✅ Cards de planificación expandibles
- ✅ Arrastrar para reprogramar (touch gestures)
- ✅ Alertas en notificaciones
- ✅ Calendario compacto

**Ejemplo**:
```tsx
<MobileLayout title="Planificador">
  {/* Selector de fecha compacto */}
  <DateRangePicker variant="compact" />

  {/* Timeline vertical */}
  <div className="space-y-4">
    {planificaciones.map(plan => (
      <div key={plan.id} className="relative pl-6 pb-4 border-l-2">
        <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-primary border-2 border-background" />
        
        <MobileCard variant="compact">
          <p className="text-xs text-muted-foreground">{plan.fecha}</p>
          <p className="font-semibold">{plan.equipo}</p>
          <p className="text-sm">{plan.tipo}</p>
          
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline">
              Reprogramar
            </Button>
            <Button size="sm">
              Completar
            </Button>
          </div>
        </MobileCard>
      </div>
    ))}
  </div>
</MobileLayout>
```

---

## 🎨 **ESTILOS Y CONFIGURACIÓN**

### Tailwind Config para Móvil
Ya está configurado con breakpoints responsive. Agregar utilidades adicionales:

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      spacing: {
        'safe': 'env(safe-area-inset-bottom)', // iOS safe area
      },
      height: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-bottom))',
      },
    },
  },
};
```

### CSS Global para Touch
```css
/* src/index.css */
@layer utilities {
  .touch-manipulation {
    touch-action: manipulation;
  }
  
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 1rem);
  }
  
  .scroll-smooth-mobile {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
}
```

---

## 🧪 **TESTING EN DISPOSITIVOS REALES**

### Tamaños a probar:
1. **iPhone SE** (375x667) - Móvil pequeño
2. **iPhone 12/13** (390x844) - Móvil estándar
3. **iPhone 14 Pro Max** (430x932) - Móvil grande
4. **iPad Mini** (768x1024) - Tablet pequeño
5. **iPad Pro** (1024x1366) - Tablet grande

### Herramientas:
- **Chrome DevTools**: Device emulation
- **Firefox Responsive Design Mode**
- **BrowserStack** (testing real devices)

### Checklist de pruebas:
- [ ] Navigation funciona en todos los tamaños
- [ ] Bottom nav no oculta contenido
- [ ] Touch targets mínimo 44x44px
- [ ] Scroll horizontal sin problemas
- [ ] Formularios accesibles con teclado virtual
- [ ] Estados de carga visibles
- [ ] Transiciones suaves (60fps)

---

## 📦 **PAQUETES ADICIONALES OPCIONALES**

```bash
# Para gestos táctiles avanzados
npm install framer-motion

# Para swipe actions
npm install react-swipeable

# Para virtual scrolling (listas grandes)
npm install react-virtualized

# Para scanner QR
npm install react-qr-scanner
```

---

## 🔄 **PATRÓN DE IMPLEMENTACIÓN**

Para cada página:

1. **Crear componente móvil** en `src/components/mobile/[Nombre]Mobile.tsx`
2. **Usar hook de detección** en página principal
3. **Renderizar condicionalmente**:
```tsx
const { isMobile } = useDeviceDetection();
if (isMobile) return <MobilVersion />;
return <DesktopVersion />;
```
4. **Reutilizar lógica** (hooks, contextos, funciones)
5. **Adaptar UI** (layout, tamaños, gestos)

---

## 📈 **PROGRESO ACTUAL**

```
✅ Hook de detección de dispositivos
✅ Componentes base móviles
✅ Layout móvil con bottom nav
✅ Dashboard móvil completado e integrado

🔄 EN PROCESO:
- Equipos móvil
- Control mantenimiento móvil
- Inventario móvil
- Planificador móvil

⏳ PENDIENTE:
- Historial móvil
- Reportes móvil
- Configuraciones móvil
- Asistente IA móvil
```

---

## 🎯 **PRÓXIMA TAREA**

**Implementar Equipos Móvil:**
1. Crear `EquiposMobile.tsx`
2. Integrar en `Equipos.tsx`
3. Probar en dispositivos
4. Ajustar estilos según feedback

¿Comenzamos con Equipos Móvil? 📱
