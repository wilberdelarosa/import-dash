
- mantenimientos_programados: proximo/restante are enforced by DB trigger normalizar_calculo_mantenimiento (proximo = ultimo + frecuencia, restante = proximo - actuales); why: every writer (app, AI agents, RPCs) stays consistent.
