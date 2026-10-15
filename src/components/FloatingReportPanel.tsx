import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Draggable, { DraggableCore } from 'react-draggable';
import { GripVertical, Maximize2, Minimize2, MoveDiagonal2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props { title: string; children: ReactNode; onClose: () => void; }

export function FloatingReportPanel({ title, children, onClose }: Props) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [size, setSize] = useState({ width: Math.min(1400, window.innerWidth - 24), height: Math.min(850, window.innerHeight - 100) });
  const [position, setPosition] = useState({ x: Math.max(12, window.innerWidth - size.width - 24), y: 24 });
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') fullscreen ? setFullscreen(false) : onClose(); };
    window.addEventListener('keydown', escape);
    return () => { window.removeEventListener('resize', resize); window.removeEventListener('keydown', escape); };
  }, [fullscreen, onClose]);
  const width = Math.min(size.width, viewport.width - 24);
  const height = Math.min(size.height, viewport.height - 24);
  const x = Math.max(0, Math.min(position.x, viewport.width - width));
  const y = Math.max(0, Math.min(position.y, viewport.height - height));
  return createPortal(
    <Draggable nodeRef={nodeRef} handle=".report-window-handle" cancel="button" disabled={fullscreen}
      position={fullscreen ? { x: 0, y: 0 } : { x, y }}
      bounds={{ left: 0, top: 0, right: viewport.width - width, bottom: viewport.height - height }}
      onDrag={(_, data) => setPosition({ x: data.x, y: data.y })}>
      <div ref={nodeRef} role="dialog" aria-label={title} aria-modal="false"
        className="@container fixed left-0 top-0 z-40 flex flex-col overflow-hidden rounded-lg border border-primary/20 bg-background shadow-2xl"
        style={{ width: fullscreen ? viewport.width : width, height: fullscreen ? viewport.height : height }}>
        <div className="report-window-handle flex shrink-0 cursor-move touch-none items-center justify-between gap-2 border-b bg-muted px-3 py-2">
          <div className="flex min-w-0 items-center gap-2"><GripVertical className="h-5 w-5 shrink-0 text-muted-foreground" /><h3 className="text-sm font-semibold">{title}</h3></div>
          <div className="flex shrink-0 gap-1">
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-11 w-11" aria-label={fullscreen ? 'Restaurar tamaño' : 'Pantalla completa'} onClick={() => setFullscreen(v => !v)}>{fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent>{fullscreen ? 'Restaurar tamaño' : 'Pantalla completa'}</TooltipContent></Tooltip>
            <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Cerrar panel" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" onWheel={e => e.stopPropagation()}>{children}</div>
        {!fullscreen && <DraggableCore nodeRef={resizeRef} onDrag={(_, data) => setSize(current => ({
          width: Math.max(Math.min(320, viewport.width - 24), Math.min(current.width + data.deltaX, viewport.width - x)),
          height: Math.max(Math.min(280, viewport.height - 24), Math.min(current.height + data.deltaY, viewport.height - y)),
        }))}><div ref={resizeRef} role="separator" aria-label="Ajustar tamaño del panel" title="Ajustar tamaño" className="absolute bottom-0 right-0 flex h-11 w-11 cursor-se-resize touch-none items-end justify-end rounded-tl-lg bg-background/95 p-2 text-muted-foreground"><MoveDiagonal2 className="h-4 w-4" /></div></DraggableCore>}
      </div>
    </Draggable>, document.body);
}