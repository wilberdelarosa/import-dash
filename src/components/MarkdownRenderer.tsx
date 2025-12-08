import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const renderContent = () => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentTableLines: string[] = [];
    let currentList: string[] = [];
    let lineIndex = 0;

    const flushTable = () => {
      if (currentTableLines.length > 0) {
        elements.push(renderTable(currentTableLines, lineIndex));
        currentTableLines = [];
      }
    };

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(renderList(currentList, lineIndex));
        currentList = [];
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushTable();
        flushList();
        lineIndex++;
        return;
      }

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList();
        currentTableLines.push(line);
        lineIndex++;
        return;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        flushTable();
        currentList.push(trimmed.slice(2));
        lineIndex++;
        return;
      }

      flushTable();
      flushList();

      if (trimmed.startsWith('###')) {
        elements.push(
          <h4 key={`h3-${lineIndex}`} className="text-sm font-semibold text-primary mt-3 first:mt-0">
            {trimmed.replace(/^###\s*/, '')}
          </h4>
        );
      } else if (trimmed.startsWith('##')) {
        elements.push(
          <h3 key={`h2-${lineIndex}`} className="text-base font-semibold text-primary mt-3 first:mt-0">
            {trimmed.replace(/^##\s*/, '')}
          </h3>
        );
      } else if (trimmed.startsWith('#')) {
        elements.push(
          <h2 key={`h1-${lineIndex}`} className="text-lg font-semibold text-primary mt-3 first:mt-0">
            {trimmed.replace(/^#\s*/, '')}
          </h2>
        );
      } else {
        elements.push(
          <p key={`p-${lineIndex}`} className="text-sm text-foreground leading-relaxed">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      }

      lineIndex++;
    });

    flushTable();
    flushList();
    return elements;
  };

  const renderTable = (tableLines: string[], key: number) => {
    if (tableLines.length < 2) return null;

    // Parsear encabezados
    const headers = tableLines[0]
      .split('|')
      .slice(1, -1)
      .map((h) => h.trim());

    // Saltar línea separadora (la que tiene ---)
    const dataLines = tableLines.slice(2);

    const rows = dataLines.map((line) => {
      return line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim());
    });

    return <ResponsiveTable key={`table-${key}`} headers={headers} rows={rows} />;
  };

  const renderList = (items: string[], key: number) => (
    <ul
      key={`list-${key}`}
      className="space-y-1.5 text-sm text-foreground my-2"
    >
      {items.map((item, index) => (
        <li key={`list-item-${key}-${index}`} className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span className="leading-relaxed">{renderInlineFormatting(item)}</span>
        </li>
      ))}
    </ul>
  );

  const renderInlineFormatting = (text: string) => {
    const fragments: ReactNode[] = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const [token] = match;
      const index = match.index;
      if (index > lastIndex) {
        fragments.push(text.slice(lastIndex, index));
      }

      if (token.startsWith('**')) {
        fragments.push(
          <span key={`${index}-bold`} className="font-semibold text-primary">
            {token.replace(/\*\*/g, '')}
          </span>
        );
      } else if (token.startsWith('`')) {
        fragments.push(
          <code
            key={`${index}-code`}
            className="rounded bg-muted/50 px-1 py-0.5 font-mono text-xs text-primary dark:bg-muted/30"
          >
            {token.replace(/`/g, '')}
          </code>
        );
      }

      lastIndex = index + token.length;
    }

    if (lastIndex < text.length) {
      fragments.push(text.slice(lastIndex));
    }

    return fragments.length > 0 ? fragments : text;
  };

  return <div className="space-y-2 text-sm leading-relaxed text-foreground">{renderContent()}</div>;
}

// Componente de tabla responsiva con scroll horizontal y navegación mejorada para móvil
function ResponsiveTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [showScrollHint, setShowScrollHint] = useState(true);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollPosition(target.scrollLeft);
    setMaxScroll(target.scrollWidth - target.clientWidth);
    // Ocultar hint después de que el usuario empiece a hacer scroll
    if (target.scrollLeft > 10) {
      setShowScrollHint(false);
    }
  };

  const canScrollLeft = scrollPosition > 5;
  const canScrollRight = scrollPosition < maxScroll - 5;

  return (
    <div className="my-3 relative">
      {/* Indicadores de scroll en los lados */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none flex items-center justify-start pl-1">
          <ChevronLeft className="h-4 w-4 text-muted-foreground animate-pulse" />
        </div>
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none flex items-center justify-end pr-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground animate-pulse" />
        </div>
      )}

      {/* Indicador de scroll para móvil - más visible */}
      {showScrollHint && headers.length > 3 && (
        <div className="sm:hidden flex items-center justify-center gap-2 mb-2 py-1.5 px-3 bg-primary/10 rounded-lg border border-primary/20 animate-pulse">
          <ChevronLeft className="h-3 w-3 text-primary" />
          <span className="text-[0.7rem] font-medium text-primary">Desliza horizontalmente</span>
          <ChevronRight className="h-3 w-3 text-primary" />
        </div>
      )}

      {/* Contenedor de tabla con scroll mejorado */}
      <div
        className="overflow-x-auto rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm touch-pan-x"
        onScroll={handleScroll}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <table className="w-full border-collapse text-[0.7rem] sm:text-sm min-w-max">
          <thead>
            <tr className="bg-primary/5 dark:bg-primary/10">
              {headers.map((header, i) => (
                <th
                  key={`header-${i}`}
                  className="border-b border-border/60 px-2 sm:px-3 py-1.5 sm:py-2 text-left font-semibold text-foreground whitespace-nowrap min-w-[80px]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={`row-${rowIndex}`}
                className={cn(
                  "transition-colors",
                  rowIndex % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                )}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={`cell-${rowIndex}-${cellIndex}`}
                    className="border-b border-border/30 px-2 sm:px-3 py-1.5 sm:py-2 text-foreground max-w-[150px] sm:max-w-none truncate"
                    title={cell}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contador de filas y indicador de scroll */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <span className="text-[0.6rem] text-muted-foreground">
          {rows.length} {rows.length === 1 ? 'registro' : 'registros'}
        </span>
        <div className="flex items-center gap-2">
          {headers.length > 3 && (
            <span className="text-[0.6rem] text-primary/70 sm:hidden">
              {Math.round((scrollPosition / Math.max(maxScroll, 1)) * 100)}%
            </span>
          )}
          <span className="text-[0.6rem] text-muted-foreground">
            {headers.length} columnas
          </span>
        </div>
      </div>
    </div>
  );
}
