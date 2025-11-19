/**
 * Tabla móvil optimizada con scroll horizontal y diseño compacto
 * 
 * Características:
 * - Scroll horizontal fluido con indicadores
 * - Filas compactas touch-friendly
 * - Acciones contextuales por fila
 * - Modo card alternativo para mobile extremo
 */

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  cell?: (value: unknown, row: T) => ReactNode;
  className?: string;
  mobileHidden?: boolean; // Ocultar en mobile
  minWidth?: string;
}

interface Action<T> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive';
}

interface MobileTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
  compact?: boolean;
}

export function MobileTable<T extends { id?: number | string }>({
  data,
  columns,
  actions,
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  className,
  compact = false,
}: MobileTableProps<T>) {
  const [activeRow, setActiveRow] = useState<number | null>(null);

  const getCellValue = (row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor];
  };

  // Filtrar columnas visibles en móvil
  const visibleColumns = columns.filter(col => !col.mobileHidden);

  return (
    <div className={cn("w-full", className)}>
      {/* Indicador de scroll */}
      <div className="relative w-full overflow-x-auto rounded-lg border bg-card shadow-sm">
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-card to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-card to-transparent pointer-events-none z-10" />
        
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {visibleColumns.map((column, index) => (
                <TableHead
                  key={index}
                  className={cn(
                    "sticky top-0 bg-muted/50 backdrop-blur whitespace-nowrap",
                    compact ? "h-9 px-2 text-xs" : "h-10 px-3 text-xs",
                    column.className
                  )}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.header}
                </TableHead>
              ))}
              {actions && actions.length > 0 && (
                <TableHead className={cn(
                  "sticky top-0 bg-muted/50 backdrop-blur text-center",
                  compact ? "h-9 px-2 w-10" : "h-10 px-3 w-12"
                )}>
                  Acciones
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + (actions ? 1 : 0)}
                  className={cn(
                    "text-center text-muted-foreground",
                    compact ? "h-16 text-xs" : "h-20 text-sm"
                  )}
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow
                  key={row.id || rowIndex}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer active:bg-accent",
                    activeRow === rowIndex && "bg-accent"
                  )}
                  onClick={() => onRowClick?.(row)}
                  onTouchStart={() => setActiveRow(rowIndex)}
                  onTouchEnd={() => setActiveRow(null)}
                >
                  {visibleColumns.map((column, colIndex) => {
                    const value = getCellValue(row, column);
                    const displayValue = column.cell ? column.cell(value, row) : value;
                    
                    return (
                      <TableCell
                        key={colIndex}
                        className={cn(
                          "whitespace-nowrap",
                          compact ? "px-2 py-2 text-xs" : "px-3 py-2.5 text-sm",
                          column.className
                        )}
                      >
                        {displayValue as ReactNode}
                      </TableCell>
                    );
                  })}
                  {actions && actions.length > 0 && (
                    <TableCell className={cn(
                      "text-center",
                      compact ? "px-1 py-1" : "px-2 py-2"
                    )}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              compact ? "h-7 w-7" : "h-8 w-8"
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action, actionIndex) => (
                            <DropdownMenuItem
                              key={actionIndex}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(row);
                              }}
                              className={cn(
                                "gap-2",
                                action.variant === 'destructive' && "text-destructive focus:text-destructive"
                              )}
                            >
                              {action.icon}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Hint de scroll */}
      {data.length > 0 && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          ← Desliza para ver más →
        </p>
      )}
    </div>
  );
}
