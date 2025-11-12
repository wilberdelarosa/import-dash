interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Función para detectar y renderizar tablas Markdown
  const renderContent = () => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentTableLines: string[] = [];
    let inTable = false;
    let lineIndex = 0;

    const flushTable = () => {
      if (currentTableLines.length > 0) {
        elements.push(renderTable(currentTableLines, lineIndex));
        currentTableLines = [];
        inTable = false;
      }
    };

    lines.forEach((line) => {
      // Detectar si es una línea de tabla (contiene pipes |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        currentTableLines.push(line);
      } else {
        flushTable();
        if (line.trim()) {
          elements.push(
            <p key={`line-${lineIndex}`} className="mb-2">
              {line}
            </p>
          );
        }
      }
      lineIndex++;
    });

    flushTable();
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
      <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="bg-muted/50">
              {headers.map((header, i) => (
                <th
                  key={`header-${i}`}
                  className="border-b border-border px-4 py-3 text-left text-sm font-semibold"
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
                    className="border-b border-border/40 px-4 py-3 text-sm"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return <div className="space-y-2">{renderContent()}</div>;
}
