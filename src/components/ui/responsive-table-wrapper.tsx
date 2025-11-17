import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTableWrapperProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTableWrapper({ children, className }: ResponsiveTableWrapperProps) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <div className="min-w-[640px] sm:min-w-full">
        {children}
      </div>
    </div>
  );
}
