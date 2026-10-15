import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface MobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function MobileSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: MobileSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "h-[85svh] rounded-t-[2rem] bg-background/95 backdrop-blur-xl p-0 flex flex-col border-t-0",
          className
        )}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted/40" />
        
        <SheetHeader className="px-6 pt-4 pb-2 text-left shrink-0">
          <SheetTitle className="text-xl font-bold">{title}</SheetTitle>
          {description && (
            <SheetDescription className="text-sm">
              {description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2 pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 p-6 border-t bg-background/50 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
