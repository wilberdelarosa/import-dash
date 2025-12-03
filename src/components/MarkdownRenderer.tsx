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

// Componente de tabla responsiva con scroll horizontal y navegación
function ResponsiveTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollPosition(target.scrollLeft);
  };

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = true; // Simplified - always show if content might overflow

  const scrollLeft = () => {
    const container = document.getElementById('table-scroll-container');
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('table-scroll-container');
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="my-3 relative group">
      {/* Indicador de scroll */}
      <div className="absolute -left-1 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ display: canScrollLeft ? 'block' : 'none' }} />
      <div className="absolute -right-1 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      {/* Botones de navegación para móvil */}
      <div className="sm:hidden flex items-center justify-between mb-2 px-1">
        <span className="text-[0.65rem] text-muted-foreground">Desliza para ver más →</span>
      </div>

      {/* Contenedor de tabla con scroll */}
      <div 
        id="table-scroll-container"
        className="overflow-x-auto rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
        onScroll={handleScroll}
      >
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-primary/5 dark:bg-primary/10">
              {headers.map((header, i) => (
                <th
                  key={`header-${i}`}
                  className="border-b border-border/60 px-2 sm:px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap"
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
                    className="border-b border-border/30 px-2 sm:px-3 py-2 text-foreground"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Contador de filas */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <span className="text-[0.6rem] text-muted-foreground">
          {rows.length} {rows.length === 1 ? 'registro' : 'registros'}
        </span>
        <span className="text-[0.6rem] text-muted-foreground">
          {headers.length} columnas
        </span>
      </div>
    </div>
  );
}
