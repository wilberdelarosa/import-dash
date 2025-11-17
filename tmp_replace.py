# -*- coding: utf-8 -*-
from pathlib import Path
path = Path('src/pages/ControlMantenimiento.tsx')
text = path.read_text(encoding='utf-8')
marker = '          <div className="grid gap-6 xl:grid-cols-[1.35fr,1fr]">'
start = text.index(marker)
search_end = text.index('        </div>', start)
end = search_end + len('        </div>\n')
new = "          <div className=\"grid gap-6 xl:grid-cols-[1.35fr,1fr]\">\n            <div className=\"space-y-6\">\n              <Card className=\"overflow-hidden border border-dashed border-border/70\">\n                <CardHeader>\n                  <CardTitle className=\"flex items-center gap-2\">\n                    <Route className=\"h-5 w-5 text-primary\" /> Planificador preventivo Caterpillar\n                  </CardTitle>\n                  <CardDescription>Usa el planificador como una burbuja flotante en la esquina para mantener el espacio limpio.</CardDescription>\n                </CardHeader>\n                <CardContent className=\"text-sm text-muted-foreground\">\n                  Presiona el botón flotante inferior para desplegar el plan sin que ocupe el contenido principal.\n                </CardContent>\n              </Card>\n            </div>\n          </div>\n"
text = text[:start] + new + text[end:]
path.write_text(text, encoding='utf-8')
