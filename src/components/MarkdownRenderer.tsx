import { ReactNode } from 'react';

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
          <h4 key={`h3-${lineIndex}`} className="text-sm font-semibold text-primary">
            {trimmed.replace(/^###\s*/, '')}
          </h4>
        );
      } else if (trimmed.startsWith('##')) {
        elements.push(
          <h3 key={`h2-${lineIndex}`} className="text-base font-semibold text-primary">
            {trimmed.replace(/^##\s*/, '')}
          </h3>
        );
      } else if (trimmed.startsWith('#')) {
        elements.push(
          <h2 key={`h1-${lineIndex}`} className="text-lg font-semibold text-primary">
            {trimmed.replace(/^#\s*/, '')}
          </h2>
        );
      } else {
        elements.push(
          <p key={`p-${lineIndex}`} className="rounded-md border border-border/40 bg-muted/20 p-3 text-sm text-foreground dark:bg-muted/10">
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

    return (
      <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-lg border border-border bg-background dark:bg-muted/20">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/50">
              {headers.map((header, i) => (
                <th
                  key={`header-${i}`}
                  className="border-b border-border px-4 py-3 text-left font-semibold text-foreground"
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
                className="transition-colors hover:bg-muted/30"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={`cell-${rowIndex}-${cellIndex}`}
                    className="border-b border-border/40 px-4 py-3 text-foreground"
                  >
                    {renderInlineFormatting(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderList = (items: string[], key: number) => (
    <ul
      key={`list-${key}`}
      className="space-y-2 rounded-md border border-border/40 bg-muted/10 p-3 text-sm text-foreground dark:bg-muted/10"
    >
      {items.map((item, index) => (
        <li key={`list-item-${key}-${index}`} className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
          <span>{renderInlineFormatting(item)}</span>
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
            className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-primary dark:bg-muted/30"
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

  return <div className="space-y-4 text-sm leading-relaxed text-foreground">{renderContent()}</div>;
}
