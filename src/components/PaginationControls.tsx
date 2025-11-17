import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalCount: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onGoToPage: (page: number) => void;
  itemsPerPage: number;
}

export function PaginationControls({
  page,
  totalPages,
  totalCount,
  startIndex,
  endIndex,
  hasNextPage,
  hasPrevPage,
  onNextPage,
  onPrevPage,
  onGoToPage,
}: PaginationControlsProps) {
  if (totalCount === 0) {
    return (
      <div className="flex items-center justify-center px-4 py-3 text-sm text-muted-foreground">
        No hay registros para mostrar
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Mostrando <span className="font-medium">{startIndex}</span> -{' '}
        <span className="font-medium">{endIndex}</span> de{' '}
        <span className="font-medium">{totalCount}</span> registros
      </p>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => onGoToPage(1)}
          disabled={!hasPrevPage}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Primera página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={onPrevPage}
          disabled={!hasPrevPage}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Página</span>
          <Select
            value={page.toString()}
            onValueChange={(value) => onGoToPage(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue>{page}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <SelectItem key={p} value={p.toString()}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">de {totalPages}</span>
        </div>

        <Button
          onClick={onNextPage}
          disabled={!hasNextPage}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => onGoToPage(totalPages)}
          disabled={!hasNextPage}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
