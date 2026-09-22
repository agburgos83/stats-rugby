# Stats Rugby

Análisis de partidos de rugby para entrenadores: el analista carga el plantel (CSV o manual), arma el equipo con drag & drop, carga los datos del partido con el link del video, registra acciones jugada por jugada (skills + calificadores) y situaciones de equipo, y descarga un reporte PDF con radares por jugador, tablas por área (contacto / pelota / pie) y donuts de situaciones.

Diseñada **desktop-first**: analizar requiere pantalla grande para combinar el video y la botonera.

## Stack

- Svelte 5 (runes: `$state`, `$effect`, `$props`, `$bindable`)
- TypeScript + Vite
- jsPDF + jspdf-autotable y D3 (arc, pie, scaleLinear, lineRadial) para el PDF
- Supabase (PostgreSQL + Auth + API) para salas de clips (compartir análisis con enlaces y tiempo de video)
- Deploy en Netlify (SPA, con redirect para `/escudos-clubes/*`)

## Comandos

```sh
npm run dev                       # servidor local
npx svelte-check --tsconfig ./tsconfig.json   # typecheck + lint
npm run build                     # build producción
```

## Estructura

- `src/lib/components/` — vistas del flujo: carga de equipo, carga de partido, análisis (con fullscreen de video + botonera), resumen de acciones y sala de clips para el veedor.
- `src/lib/pdf/` — generación del reporte PDF (radares, tablas y donuts).
- `src/lib/types.ts` — tipos centrales (modalidades, posiciones, skills, calificaciones, acciones).
- `src/routes/api/sala/` — API de salas de clips (Supabase, TTL free 72h).

## Documentación

- `AGENTS.md` — contexto del proyecto para desarrollo (stack, estructura, cambios relevantes).
- `docs/SALAS_CLIPS.md` — diseño de las salas de clips (flujos, schema SQL, planes).