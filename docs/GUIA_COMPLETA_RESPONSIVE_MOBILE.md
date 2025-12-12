# Guia Completa de Sistema Responsive Mobile
## De Principio a Fin con Wireframes y Ejemplos

> **Objetivo**: Que cualquier desarrollador pueda entender y replicar el sistema responsive
> **Nivel**: Desde cero hasta implementacion completa

---

# PARTE 1: EL PROBLEMA FUNDAMENTAL

## 1.1 Por que el responsive en movil es diferente

En desktop, el viewport (area visible) es FIJO. En movil, el viewport CAMBIA:

```
DESKTOP (viewport fijo):
+--------------------------------------------------+
|  Barra de navegador (siempre visible, fija)      |
+--------------------------------------------------+
|                                                  |
|                                                  |
|              CONTENIDO                           |
|              (altura fija)                       |
|                                                  |
|                                                  |
+--------------------------------------------------+

MOVIL (viewport VARIABLE):
+------------------+     +------------------+     +------------------+
| #### URL BAR ### |     |                  |     | #### URL BAR ### |
+------------------+     |                  |     +------------------+
|                  |     |                  |     |                  |
|    CONTENIDO     |     |    CONTENIDO     |     |    CONTENIDO     |
|    (menos        |     |    (mas          |     |    (menos        |
|     espacio)     |     |     espacio)     |     |     espacio)     |
|                  |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
| ### TECLADO #### |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
   Con URL + teclado      Sin URL bar           Solo con URL bar
   (minimo espacio)       (maximo espacio)      (espacio normal)
```

**PROBLEMA**: Si usamos alturas FIJAS (como `height: 500px`), cuando el viewport
cambia, el contenido se desborda o queda espacio vacio.

---

## 1.2 Ejemplo Real del Problema

Imagina esta pantalla con altura fija de 200px para la lista:

```
CASO 1: Pantalla grande (iPhone 14 Pro Max = 932px altura)
+--------------------------------+
|  Header (56px)                 |
+--------------------------------+
|  KPIs (80px)                   |
+--------------------------------+
|  Lista (200px FIJOS)           |  <-- Solo usa 200px
|  +---------------------------+ |
|  | Item 1                    | |
|  | Item 2                    | |
|  | Item 3                    | |
|  +---------------------------+ |
+--------------------------------+
|                                |
|     ESPACIO VACIO (396px)      |  <-- Desperdicio!
|                                |
+--------------------------------+
|  Bottom Nav (64px)             |
+--------------------------------+

CASO 2: Pantalla pequena (iPhone SE = 667px altura)
+--------------------------------+
|  Header (56px)                 |
+--------------------------------+
|  KPIs (80px)                   |
+--------------------------------+
|  Lista (200px FIJOS)           |
|  +---------------------------+ |
|  | Item 1                    | |
|  | Item 2                    | |
|  | Item 3                    | |
|  +---------------------------+ |
+--------------------------------+
|  Botones (100px)               |  <-- Se corta!
+-------------------XXXXXXXXXXXXX   <-- Overflow!
|  Bottom Nav (64px)             |
+--------------------------------+
```

**SOLUCION**: Usar alturas FLUIDAS que se adaptan al espacio disponible.

---

# PARTE 2: UNIDADES DE MEDIDA CSS

## 2.1 Unidades Absolutas vs Relativas

```
ABSOLUTAS (no cambian):
+----------------------------------+
|  px   = pixeles                  |  100px siempre es 100px
|  cm   = centimetros              |  
|  in   = pulgadas                 |  NO USAR para responsive
+----------------------------------+

RELATIVAS (cambian segun contexto):
+----------------------------------+
|  %    = porcentaje del padre     |  50% = mitad del contenedor padre
|  em   = relativo al font-size    |  2em = 2x el tamano de letra actual
|  rem  = relativo al root (html)  |  1rem = tamano base (16px default)
|  vw   = viewport width           |  50vw = 50% del ancho de pantalla
|  vh   = viewport height          |  50vh = 50% de la altura de pantalla
+----------------------------------+
```

## 2.2 El Problema con vh (viewport height)

```
QUE ESPERAS:                         QUE PASA EN REALIDAD:
+------------------+                 +------------------+
|                  |                 | ## URL BAR ##### |
|                  |                 +------------------+
|   100vh          |                 |                  |
|   = toda la      |                 |   100vh incluye  |
|   pantalla       |                 |   el area DETRAS |
|                  |                 |   de la URL bar! |
|                  |                 |                  |
|                  |                 +------------------+
|                  |                 | (contenido oculto)|
+------------------+                 +------------------+

RESULTADO: Tu contenido se "esconde" detras de la barra de URL
```

## 2.3 Nuevas Unidades Seguras: svh, dvh, lvh

```
+------------------------------------------------------------------+
|                    UNIDADES MODERNAS DE VIEWPORT                   |
+------------------------------------------------------------------+

svh = Small Viewport Height (viewport PEQUENO)
+------------------+
| ## URL BAR ##### |  <-- Siempre cuenta la barra
+------------------+
|                  |
|   100svh         |
|   = espacio      |
|   GARANTIZADO    |  <-- Nunca se oculta contenido
|   visible        |
|                  |
+------------------+

lvh = Large Viewport Height (viewport GRANDE)
+------------------+
|                  |  <-- NO cuenta la barra
|                  |
|   100lvh         |
|   = espacio      |
|   MAXIMO         |  <-- Puede ocultar contenido si barra aparece
|   posible        |
|                  |
+------------------+

dvh = Dynamic Viewport Height (viewport DINAMICO)
+------------------+     +------------------+
| ## URL BAR ##### |     |                  |
+------------------+     |                  |
|                  |     |                  |
|   100dvh         |     |   100dvh         |
|   (con barra)    |     |   (sin barra)    |
|                  |     |                  |
+------------------+     +------------------+
    Cambia en            Cambia en
    tiempo real          tiempo real

+------------------------------------------------------------------+
|  RECOMENDACION:                                                   |
|  - Usar svh para CONTENIDO (siempre visible)                     |
|  - Usar lvh para BACKGROUNDS (puede extenderse)                  |
|  - Usar dvh para ANIMACIONES (sigue el viewport)                 |
+------------------------------------------------------------------+
```

---

# PARTE 3: LA FUNCION clamp()

## 3.1 Que es clamp()

`clamp()` es una funcion CSS que define un valor con MINIMO, PREFERIDO y MAXIMO:

```
clamp(MINIMO, PREFERIDO, MAXIMO)
       |         |          |
       |         |          +-- Nunca sera mayor que esto
       |         +------------- Valor ideal (puede ser relativo)
       +----------------------- Nunca sera menor que esto
```

## 3.2 Ejemplo Visual de clamp()

```css
height: clamp(150px, 25svh, 280px);
```

```
PANTALLA PEQUENA (600px altura):
25svh = 150px
+----------------------------------+
|  150px (usa el MINIMO)           |  clamp elige 150px
|  porque 25svh < 150px            |  (el minimo)
+----------------------------------+

PANTALLA MEDIANA (800px altura):
25svh = 200px
+----------------------------------+
|                                  |
|  200px (usa el PREFERIDO)        |  clamp elige 200px
|  porque 150px < 200px < 280px    |  (el preferido)
|                                  |
+----------------------------------+

PANTALLA GRANDE (1200px altura):
25svh = 300px
+----------------------------------+
|                                  |
|  280px (usa el MAXIMO)           |  clamp elige 280px
|  porque 25svh > 280px            |  (el maximo)
|                                  |
+----------------------------------+
```

## 3.3 Grafico de Comportamiento de clamp()

```
ALTURA RESULTANTE
     ^
280px|.........................*****  <-- Maximo (tope)
     |                    ****
     |                ****
     |            ****
     |        ****
150px|********......................  <-- Minimo (piso)
     |
     +--------------------------------> ALTURA VIEWPORT
        600px   800px   1000px  1200px

     [ZONA MINIMO] [ZONA FLUIDA] [ZONA MAXIMO]
```

---

# PARTE 4: CONTAINER QUERIES

## 4.1 Media Queries vs Container Queries

```
MEDIA QUERIES (tradicional):
Pregunta: "Que tan ancho es el VIEWPORT (pantalla)?"

+--------------------------------------------------+
|  VIEWPORT = 800px                                |
|  +--------------------+  +--------------------+  |
|  |                    |  |                    |  |
|  |  Card A            |  |  Card B            |  |
|  |  (ambas reciben    |  |  (mismo estilo     |  |
|  |   mismo estilo)    |  |   aunque tienen    |  |
|  |                    |  |   diferente        |  |
|  |                    |  |   espacio)         |  |
|  +--------------------+  +--------------------+  |
|        400px                   400px             |
+--------------------------------------------------+

CONTAINER QUERIES (moderno):
Pregunta: "Que tan ancho es MI CONTENEDOR?"

+--------------------------------------------------+
|  VIEWPORT = 800px                                |
|  +--------------------+  +--------------------+  |
|  |  CONTENEDOR A      |  |  CONTENEDOR B      |  |
|  |  = 250px           |  |  = 500px           |  |
|  |  +---------------+ |  |  +---------------+ |  |
|  |  | Card A        | |  |  | Card B        | |  |
|  |  | (estilo       | |  |  | (estilo       | |  |
|  |  |  compacto)    | |  |  |  expandido)   | |  |
|  |  +---------------+ |  |  +---------------+ |  |
|  +--------------------+  +--------------------+  |
+--------------------------------------------------+

VENTAJA: Cada componente se adapta a SU espacio, no al viewport global
```

## 4.2 Sintaxis de Container Queries

```css
/* PASO 1: Definir el contenedor */
.card-container {
  container-type: inline-size;  /* Habilita queries por ancho */
  container-name: card;          /* Nombre opcional */
}

/* PASO 2: Estilos base (movil primero) */
.card-title {
  font-size: 12px;
}

/* PASO 3: Estilos cuando el CONTENEDOR es mas grande */
@container card (min-width: 300px) {
  .card-title {
    font-size: 14px;
  }
}

@container card (min-width: 400px) {
  .card-title {
    font-size: 16px;
  }
}
```

## 4.3 Ejemplo Visual de Container Queries

```
CONTENEDOR PEQUENO (250px):
+---------------------------+
|  container-type: inline   |
|  +----------------------+ |
|  | Titulo...      [ico] | |  <- Titulo truncado, icono pequeno
|  | Subtitulo cortado... | |
|  +----------------------+ |
+---------------------------+
   @container (width < 300px)
   - font-size: 11px
   - Icono: 14px
   - Sin badge

CONTENEDOR MEDIANO (350px):
+----------------------------------+
|  container-type: inline          |
|  +-----------------------------+ |
|  | [icono] Titulo completo     | |  <- Icono visible, titulo completo
|  | Subtitulo mas largo aqui    | |
|  +-----------------------------+ |
+----------------------------------+
   @container (width >= 300px)
   - font-size: 13px
   - Icono: 16px
   - Badge visible

CONTENEDOR GRANDE (450px):
+-------------------------------------------+
|  container-type: inline                   |
|  +--------------------------------------+ |
|  | [icono grande]  Titulo completo aqui | |
|  | Subtitulo con todo el texto visible  | |
|  | [Badge: Activo]                      | |
|  +--------------------------------------+ |
+-------------------------------------------+
   @container (width >= 400px)
   - font-size: 14px
   - Icono: 20px
   - Badge con texto completo
```

---

# PARTE 5: EL PATRON DE OVERFLOW

## 5.1 El Problema del Desbordamiento

```
SIN CONTROL DE OVERFLOW:
+---------------------------+
|  Contenedor (200px alto)  |
|  +----------------------+ |
|  | Item 1               | |
|  | Item 2               | |
|  | Item 3               | |
|  +-Item-4---------------+ |  <-- Se sale del contenedor!
|    Item 5                 |  <-- Rompe el layout!
|    Item 6                 |
+---------------------------+

CON OVERFLOW HIDDEN (mal):
+---------------------------+
|  Contenedor (200px alto)  |
|  overflow: hidden         |
|  +----------------------+ |
|  | Item 1               | |
|  | Item 2               | |
|  | Item 3               | |
|  +----------------------+ |  <-- Items 4,5,6 DESAPARECEN
+---------------------------+      No hay forma de verlos!

CON OVERFLOW-Y AUTO (bien):
+---------------------------+
|  Contenedor (200px alto)  |
|  overflow-y: auto         |
|  +----------------------+ |
|  | Item 1               |#|  <- Scrollbar aparece
|  | Item 2               |#|
|  | Item 3               |#|
|  +----------------------+ |
+---------------------------+
    Item 4, 5, 6 accesibles via scroll
```

## 5.2 El Patron de Doble Contenedor

```
ESTRUCTURA CORRECTA:
+-----------------------------------------------+
|  CONTENEDOR PADRE                             |
|  - Tiene altura FIJA o CLAMP                  |
|  - overflow: hidden (corta lo que se sale)    |
|                                               |
|  +------------------------------------------+ |
|  |  CONTENEDOR SCROLL                       | |
|  |  - height: 100% (llena el padre)         | |
|  |  - overflow-y: auto (permite scroll)     | |
|  |                                          | |
|  |  +-------------------------------------+ | |
|  |  | Item 1                              | | |
|  |  +-------------------------------------+ | |
|  |  | Item 2                              |#| |  <- Scroll
|  |  +-------------------------------------+#| |
|  |  | Item 3                              |#| |
|  |  +-------------------------------------+ | |
|  +------------------------------------------+ |
+-----------------------------------------------+

EN CODIGO:
<div style="height: clamp(150px, 25svh, 280px); overflow: hidden;">
  <div style="height: 100%; overflow-y: auto;">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
    <div>Item 4</div>
    ...
  </div>
</div>
```

---

# PARTE 6: FLEXBOX PARA RESPONSIVE

## 6.1 El Problema del Texto Largo

```
SIN min-w-0:
+------------------------------------------+
|  flex container                          |
|  +--------+  +-------------------------+ |
|  | Icono  |  | Texto muy largo que no  | |
|  |        |  | cabe en el espacio disp | |
|  +--------+  | onible y se sale del co | |
|              | ntenedor rompiendo todo | |
|              +-------------------------+-+---> OVERFLOW!
+------------------------------------------+

CON min-w-0:
+------------------------------------------+
|  flex container                          |
|  +--------+  +------------------------+  |
|  | Icono  |  | Texto muy largo que... |  |  <- Se trunca
|  |        |  +------------------------+  |
|  +--------+                              |
+------------------------------------------+
```

## 6.2 Clases Clave de Flexbox

```
+------------------------------------------------------------------+
|  PROPIEDAD      |  EFECTO                                        |
+------------------------------------------------------------------+
|  flex-1         |  Crece para llenar espacio disponible          |
|  shrink-0       |  NUNCA se encoge (mantiene tamano)             |
|  min-w-0        |  Permite que flex item se encoja bajo su       |
|                 |  contenido minimo (CRITICO para truncate)      |
|  truncate       |  Corta texto con "..."                         |
+------------------------------------------------------------------+

EJEMPLO PRACTICO:
+------------------------------------------+
|  Item de lista                           |
|  +------+  +-------------------+  +----+ |
|  | ICON |  | TEXTO FLEXIBLE    |  |BADGE |
|  |shrink|  | flex-1 min-w-0    |  |shrink|
|  |  -0  |  | truncate          |  |  -0 |
|  +------+  +-------------------+  +----+ |
|     ^              ^                 ^    |
|     |              |                 |    |
|   Nunca se       Se adapta        Nunca  |
|   encoge         al espacio       se     |
|                  disponible       encoge |
+------------------------------------------+
```

## 6.3 Jerarquia de Contenedores Flex

```
ESTRUCTURA COMPLETA DE UN ITEM:
+----------------------------------------------------------+
|  <div class="flex items-center justify-between">         |
|       ^---- Contenedor principal (horizontal)            |
|                                                          |
|  +--------------------------------------------------+   |
|  |  <div class="flex items-center gap-2 min-w-0     |   |
|  |              flex-1">                             |   |
|  |       ^---- Area flexible (puede encogerse)       |   |
|  |                                                   |   |
|  |  +--------+  +------------------------------+    |   |
|  |  | <Icon  |  | <div class="min-w-0 flex-1   |    |   |
|  |  | shrink |  |            overflow-hidden"> |    |   |
|  |  |   -0   |  |                              |    |   |
|  |  |   />   |  |   <p class="truncate">       |    |   |
|  |  |        |  |     Titulo largo...          |    |   |
|  |  |        |  |   </p>                       |    |   |
|  |  |        |  |   <p class="truncate">       |    |   |
|  |  |        |  |     Subtitulo...             |    |   |
|  |  |        |  |   </p>                       |    |   |
|  |  +--------+  +------------------------------+    |   |
|  +--------------------------------------------------+   |
|                                                          |
|  +------------------+                                    |
|  | <Badge shrink-0> |   <-- Nunca se encoge             |
|  |   "Vencido"      |                                    |
|  +------------------+                                    |
+----------------------------------------------------------+
```

---

# PARTE 7: TIPOGRAFIA FLUIDA

## 7.1 Problema con Tamanos Fijos

```
TAMANO FIJO (16px):
+------------------+     +---------------------------+
|  Pantalla 320px  |     |  Pantalla 414px           |
|  +--------------+|     |  +----------------------+ |
|  |Este texto es ||     |  |Este texto es de 16px | |
|  |de 16px y se  ||     |  |y tiene mucho espacio | |
|  |ve muy grande ||     |  |a los lados           | |
|  |para este     ||     |  +----------------------+ |
|  |espacio       ||     |                           |
|  +--------------+|     +---------------------------+
+------------------+
   Texto demasiado          Texto proporcionado
   grande para el           pero no optimizado
   espacio
```

## 7.2 Tipografia Fluida con clamp()

```css
/* Sintaxis */
font-size: clamp(MINIMO, PREFERIDO, MAXIMO);

/* Ejemplo */
font-size: clamp(0.75rem, 2svw, 0.875rem);
/*               12px    2% del   14px
                        viewport
                        width
*/
```

## 7.3 Comportamiento Visual

```
PANTALLA 320px (2svw = 6.4px, usa minimo 12px):
+------------------+
|  Texto a 12px    |
|  (minimo)        |
+------------------+

PANTALLA 375px (2svw = 7.5px, usa minimo 12px):
+---------------------+
|  Texto a 12px       |
|  (aun en minimo)    |
+---------------------+

PANTALLA 414px (2svw = 8.28px, usa minimo 12px):
+------------------------+
|  Texto a 12px          |
|  (aun en minimo)       |
+------------------------+

PANTALLA 600px (2svw = 12px, fluido):
+----------------------------------+
|  Texto a 12px                    |
|  (justo en el punto fluido)      |
+----------------------------------+

PANTALLA 700px (2svw = 14px, usa maximo 14px):
+----------------------------------------+
|  Texto a 14px                          |
|  (maximo alcanzado)                    |
+----------------------------------------+
```

## 7.4 Escala Tipografica Recomendada

```
+------------------------------------------------------------------+
|  NOMBRE          |  CLAMP                           |  RANGO     |
+------------------------------------------------------------------+
|  text-fluid-xs   |  clamp(0.5rem, 1.25svw, 0.625rem) |  8-10px   |
|  text-fluid-sm   |  clamp(0.625rem, 1.5svw, 0.75rem) |  10-12px  |
|  text-fluid-base |  clamp(0.75rem, 2svw, 0.875rem)   |  12-14px  |
|  text-fluid-lg   |  clamp(0.875rem, 2.5svw, 1rem)    |  14-16px  |
|  text-fluid-kpi  |  clamp(1rem, 4svw, 1.5rem)        |  16-24px  |
+------------------------------------------------------------------+

USO:
+------------------------------------------+
|  KPI Card                                |
|  +------------------------------------+  |
|  |  52                                |  |  <- text-fluid-kpi
|  |  Equipos Activos                   |  |  <- text-fluid-xs
|  +------------------------------------+  |
+------------------------------------------+

+------------------------------------------+
|  List Item                               |
|  +------------------------------------+  |
|  |  Nombre del equipo CAT-320         |  |  <- text-fluid-base
|  |  Vence en 3 dias                   |  |  <- text-fluid-xs
|  +------------------------------------+  |
+------------------------------------------+
```

---

# PARTE 8: IMPLEMENTACION COMPLETA

## 8.1 Estructura HTML/JSX de un Dashboard

```
WIREFRAME COMPLETO:
+--------------------------------------------------+
|  HEADER (altura fija: 56px)                      |
|  +----------------------------------------------+|
|  | [<] Titulo de Pagina            [ico] [ico]  ||
|  +----------------------------------------------+|
+--------------------------------------------------+
|  CONTENT AREA (flex: 1, overflow-y: auto)        |
|  +----------------------------------------------+|
|  |  padding: 12px                               ||
|  |  space-y: 8px (gap entre secciones)          ||
|  |                                               ||
|  |  +------------------------------------------+||
|  |  | SECCION 1: Header Card                   |||
|  |  | +--------------------------------------+ |||
|  |  | | Bienvenido, Usuario                  | |||
|  |  | | Tienes 5 alertas pendientes          | |||
|  |  | +--------------------------------------+ |||
|  |  +------------------------------------------+||
|  |                                               ||
|  |  +------------------------------------------+||
|  |  | SECCION 2: KPIs Grid (3 columnas)        |||
|  |  | +----------+ +----------+ +----------+   |||
|  |  | |    52    | |    11    | |     2    |   |||
|  |  | | Activos  | | Vencidos | | Proximos |   |||
|  |  | +----------+ +----------+ +----------+   |||
|  |  +------------------------------------------+||
|  |                                               ||
|  |  +------------------------------------------+||
|  |  | SECCION 3: Tabs con Lista                |||
|  |  | +--------------------------------------+ |||
|  |  | | [Tab Vencidos] [Tab Proximos]        | |||
|  |  | +--------------------------------------+ |||
|  |  | | CONTENEDOR ALTURA FLUIDA             | |||
|  |  | | height: clamp(150px, 25svh, 280px)   | |||
|  |  | | overflow: hidden                     | |||
|  |  | | +----------------------------------+ | |||
|  |  | | | SCROLL CONTAINER                 | | |||
|  |  | | | height: 100%                     | | |||
|  |  | | | overflow-y: auto                 | | |||
|  |  | | | +------------------------------+ | | |||
|  |  | | | | Item 1 (h-[52px])            |#| | |||
|  |  | | | +------------------------------+#| | |||
|  |  | | | | Item 2                       |#| | |||
|  |  | | | +------------------------------+#| | |||
|  |  | | | | Item 3                       | | | |||
|  |  | | | +------------------------------+ | | |||
|  |  | | +----------------------------------+ | |||
|  |  | +--------------------------------------+ |||
|  |  +------------------------------------------+||
|  |                                               ||
|  |  +------------------------------------------+||
|  |  | SECCION 4: Botones Grid (2 columnas)     |||
|  |  | +-----------------+ +-----------------+  |||
|  |  | | [ico]           | | [ico]           |  |||
|  |  | | Mantenimientos  | | Equipos         |  |||
|  |  | +-----------------+ +-----------------+  |||
|  |  +------------------------------------------+||
|  +----------------------------------------------+|
+--------------------------------------------------+
|  BOTTOM NAV (altura fija: 64px + safe-area)      |
|  +----------------------------------------------+|
|  | [Home]    [Equipos]  [Mant]     [Config]     ||
|  +----------------------------------------------+|
+--------------------------------------------------+
```

## 8.2 Codigo JSX Completo

```tsx
// MobileLayout.tsx - Estructura base
function MobileLayout({ children }) {
  return (
    <div className="h-svh flex flex-col">
      {/* HEADER - Altura fija */}
      <header className="h-14 shrink-0 border-b flex items-center px-4">
        <h1>Titulo</h1>
      </header>
      
      {/* CONTENT - Flexible con scroll */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {children}
        </div>
      </main>
      
      {/* BOTTOM NAV - Altura fija + safe area */}
      <nav className="h-16 shrink-0 border-t pb-safe-bottom">
        {/* tabs de navegacion */}
      </nav>
    </div>
  );
}

// TabsConLista.tsx - Componente con altura fluida
function TabsConLista({ vencidos, proximos }) {
  return (
    <Card>
      <Tabs defaultValue="vencidos">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="vencidos">
            Vencidos ({vencidos.length})
          </TabsTrigger>
          <TabsTrigger value="proximos">
            Proximos ({proximos.length})
          </TabsTrigger>
        </TabsList>
        
        {/* CONTENEDOR CON ALTURA FLUIDA */}
        <TabsContent 
          value="vencidos"
          style={{ 
            height: 'clamp(150px, 25svh, 280px)',
            overflow: 'hidden' 
          }}
        >
          {/* CONTENEDOR DE SCROLL */}
          <div className="h-full overflow-y-auto space-y-2">
            {vencidos.map(item => (
              <ListItem key={item.id} {...item} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent 
          value="proximos"
          style={{ 
            height: 'clamp(150px, 25svh, 280px)',
            overflow: 'hidden' 
          }}
        >
          <div className="h-full overflow-y-auto space-y-2">
            {proximos.map(item => (
              <ListItem key={item.id} {...item} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

// ListItem.tsx - Item con layout responsive
function ListItem({ title, subtitle, badge, badgeColor }) {
  return (
    <div 
      className={cn(
        // Altura fija para consistencia
        "h-[52px]",
        // Layout flex
        "flex items-center justify-between",
        // Espaciado y bordes
        "p-2 rounded-lg border",
        // Gap entre elementos
        "gap-2"
      )}
    >
      {/* AREA FLEXIBLE - puede encogerse */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Icono - nunca se encoge */}
        <div className="w-4 h-4 shrink-0">
          <AlertTriangle className="w-full h-full" />
        </div>
        
        {/* Texto - se adapta y trunca */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-[11px] sm:text-xs font-medium truncate">
            {title}
          </p>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
            {subtitle}
          </p>
        </div>
      </div>
      
      {/* BADGE - nunca se encoge */}
      <span 
        className={cn(
          "shrink-0",
          "px-1.5 py-0.5 rounded-md",
          "text-[9px] sm:text-[10px] font-medium",
          "tabular-nums",  // Numeros alineados
          badgeColor
        )}
      >
        {badge}
      </span>
    </div>
  );
}
```

---

# PARTE 9: TAILWIND CONFIGURATION

## 9.1 Configuracion Completa

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  theme: {
    extend: {
      // BREAKPOINTS MOVIL-FIRST
      screens: {
        'xs': '320px',   // Telefonos pequenos
        'sm': '375px',   // iPhone SE, etc
        'md': '414px',   // iPhone Plus, etc
        'lg': '768px',   // Tablets
      },
      
      // ALTURAS FLUIDAS
      height: {
        // Para listas
        'list-compact': 'clamp(120px, 20svh, 200px)',
        'list-default': 'clamp(150px, 25svh, 250px)',
        'list-expanded': 'clamp(200px, 35svh, 400px)',
        
        // Para items
        'item': 'clamp(44px, 12svh, 56px)',
        'item-compact': 'clamp(36px, 10svh, 48px)',
        
        // Viewport seguro
        'safe-screen': '100svh',
        'safe-screen-dynamic': '100dvh',
      },
      
      // ESPACIADO FLUIDO
      spacing: {
        'fluid-xs': 'clamp(4px, 1svh, 8px)',
        'fluid-sm': 'clamp(6px, 1.5svh, 12px)',
        'fluid-md': 'clamp(8px, 2svh, 16px)',
        'fluid-lg': 'clamp(12px, 3svh, 24px)',
      },
      
      // TIPOGRAFIA FLUIDA
      fontSize: {
        'fluid-xs': ['clamp(0.5rem, 1.25svw, 0.625rem)', { lineHeight: '1.4' }],
        'fluid-sm': ['clamp(0.625rem, 1.5svw, 0.75rem)', { lineHeight: '1.4' }],
        'fluid-base': ['clamp(0.75rem, 2svw, 0.875rem)', { lineHeight: '1.5' }],
        'fluid-lg': ['clamp(0.875rem, 2.5svw, 1rem)', { lineHeight: '1.5' }],
        'fluid-kpi': ['clamp(1rem, 4svw, 1.5rem)', { lineHeight: '1.2' }],
      },
      
      // SAFE AREAS (para notch de iPhone, etc)
      padding: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-left': 'env(safe-area-inset-left, 0px)',
        'safe-right': 'env(safe-area-inset-right, 0px)',
      },
    },
  },
  
  plugins: [
    // Para container queries en Tailwind
    require('@tailwindcss/container-queries'),
  ],
} satisfies Config;
```

---

# PARTE 10: CHECKLIST FINAL

## 10.1 Antes de Implementar

```
PRE-REQUISITOS:
[ ] Entender la diferencia entre vh y svh
[ ] Entender como funciona clamp()
[ ] Entender el patron de doble contenedor para scroll
[ ] Configurar tailwind.config.ts con valores fluidos
[ ] Instalar @tailwindcss/container-queries (opcional)
```

## 10.2 Durante la Implementacion

```
ESTRUCTURA:
[ ] Layout principal usa h-svh (no h-screen o h-[100vh])
[ ] Header y BottomNav tienen shrink-0
[ ] Content area tiene flex-1 overflow-y-auto

LISTAS SCROLLABLES:
[ ] Contenedor padre: altura clamp() + overflow-hidden
[ ] Contenedor scroll: h-full + overflow-y-auto
[ ] Items: altura fija (h-[52px] o similar)

ITEMS DE LISTA:
[ ] Contenedor: flex items-center justify-between
[ ] Area texto: min-w-0 flex-1
[ ] Textos: truncate
[ ] Elementos fijos: shrink-0 (iconos, badges)

TIPOGRAFIA:
[ ] Textos principales: text-fluid-base o text-[11px] sm:text-xs
[ ] Subtextos: text-fluid-xs o text-[9px] sm:text-[10px]
[ ] Numeros: tabular-nums
```

## 10.3 Testing

```
PANTALLAS A PROBAR:
[ ] 320px x 568px  (iPhone SE 1st gen)
[ ] 375px x 667px  (iPhone SE 2nd/3rd gen)
[ ] 390px x 844px  (iPhone 12/13/14)
[ ] 414px x 896px  (iPhone 11 Pro Max)
[ ] 428px x 926px  (iPhone 14 Pro Max)

ESCENARIOS A PROBAR:
[ ] Lista vacia (empty state)
[ ] Lista con 1-2 items
[ ] Lista con 10+ items (scroll)
[ ] Rotacion a landscape
[ ] Con teclado virtual abierto
[ ] Con barra de URL visible/oculta
```

---

# GLOSARIO

| Termino | Definicion |
|---------|------------|
| **Viewport** | Area visible de la pantalla del navegador |
| **svh** | Small Viewport Height - altura segura que siempre cabe |
| **dvh** | Dynamic Viewport Height - altura que cambia en tiempo real |
| **clamp()** | Funcion CSS: `clamp(min, preferred, max)` |
| **Container Query** | CSS query basada en el tamano del contenedor, no del viewport |
| **shrink-0** | Clase Tailwind que evita que un elemento flex se encoja |
| **min-w-0** | Clase Tailwind que permite que un elemento flex se encoja bajo su contenido |
| **truncate** | Clase Tailwind que corta texto con "..." |
| **tabular-nums** | Clase que hace que todos los numeros tengan el mismo ancho |
| **safe-area** | Area segura que evita el notch y bordes redondeados |

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2025-12-12 | Documentacion completa con wireframes |
