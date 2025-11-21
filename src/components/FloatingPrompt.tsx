import { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SendHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingPromptProps {
  onSend: (text: string) => Promise<void> | void;
  className?: string;
  placeholder?: string;
}

export default function FloatingPrompt({ onSend, className, placeholder = 'Pregunta sobre tu flota, solicita análisis o información específica...' }: FloatingPromptProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [positionTop, setPositionTop] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(24);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const resize = () => {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    };
    resize();
  }, [value]);

  useEffect(() => {
    // Determine Android / mobile behavior
    try {
      const ua = navigator.userAgent || '';
      const isAndroid = /Android/i.test(ua);
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
      if (isAndroid) {
        setPositionTop(true);
      } else if (isMobile) {
        // leave at bottom but offset above potential global bottom nav
        setBottomOffset(90);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = value.trim();
      if (!text) return;
      await onSend(text);
      setValue('');
    }
  };

  return (
    <div
      className={cn(
        'fixed left-1/2 z-50 w-full max-w-3xl -translate-x-1/2 rounded-xl px-4',
        className,
      )}
      style={positionTop ? { top: 72 } : { bottom: bottomOffset }}
    >
      <div className="relative mx-auto w-full">
        <div className="flex items-end gap-3">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(ev) => setValue(ev.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[56px] max-h-[160px] resize-none rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background/98 to-muted/5 px-4 py-3.5 text-sm leading-relaxed shadow-xl backdrop-blur-sm focus-visible:border-primary/40"
          />
          <Button
            size="sm"
            onClick={async () => {
              const text = value.trim();
              if (!text) return;
              await onSend(text);
              setValue('');
            }}
            className="h-12 w-12 shrink-0 rounded-xl"
            aria-label="Enviar consulta"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
