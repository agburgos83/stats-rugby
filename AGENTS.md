# Stats Rugby — Contexto del proyecto

## Stack

- Svelte 5 (runes: `$state`, `$effect`, `$props`, `$bindable`)
- TypeScript, Vite, jsPDF + jspdf-autotable, D3 (arc, pie, scaleLinear, lineRadial)
- Hosting: Netlify (SPA, `/escudos-clubes/*` redirect)
- Backend: Supabase (PostgreSQL + Auth + API) — para salas de clips y auth de usuarios
- Branches: `main` = producción (Netlify deploya desde aquí), `desa` = desarrollo

## Comandos

- `npm run dev` — servidor local
- `npx svelte-check --tsconfig ./tsconfig.json` — typecheck + lint
- `npm run build` — build producción

## Estructura relevante

### Tipos (`src/lib/types.ts`)

- `ModalidadClave`: `'seven' | 'ten' | 'doce' | 'quince'`
- `POSICIONES_POR_MODALIDAD`: map `{ mod: { numero: posicion } }` — incluye suplentes para todas las modalidades
- `CalificacionIndividual`: `'Negativo' | 'Neutro' | 'Positivo' | 'Dominante'`
- Skills: `CONTACT_SKILLS`, `BALL_SKILLS`, `FOOT_SKILLS`, `INFRACCION_SKILLS`
- `Puesto` = `{ numero: number, posicionOriginal: string, player: Player | null }`
- `Accion` = `{ id, player, skill, calificacion, videoTime }` — con `videoTime: number | null` (Sprint 1 de salas completo)
- `TeamAccion` = `{ situacion, calificacion, videoTime }` — con `videoTime: number | null`
- `PartidoContexto.urlVideo` — URL de video (Vimeo/YouTube/Veo)

### PDF (`src/lib/pdf/`)

**`reporte.ts`** — Orquestador del PDF (A3 vertical 297×420mm):

- `descargarPDF(equipo, partido, matrizProcesada, dixTotales, modalidad)` → genera todo el reporte
- `dibujarEncabezado(doc, pageWidth, partido, escudoLocal, categoria)` — pinta título + escudo (18mm, de y=6 a y=24) + info partido
- `dibujarFooter(doc, logoDataUrl)` — stroke azul + logo centrado
- Paginación: radars (0) → contacto (1) → pelota (2) → pie (3) → donuts (4 A4)
- Tablas con autoTable, `columnStyles: { 0: { halign: 'left' } }` para nombres de jugadores
- 3 categorías de tabla: juego en el contacto + infracciones / juego con pelota / juego con el pie
- **Azul PDF**: `[0, 104, 206]` para headers, `[0, 53, 112]` para texto de calificadores, `[204, 228, 247]` para fondo de celdas
- Encabezado usa `doc.setFont('helvetica', 'normal')` — sin bold

**`radar.ts`** — Página 0 del PDF:

- `agregarRadarAlPDF(doc, equipo, matrizProcesada, partido, escudoLocal, logoDataUrl, modalidad)`
- `GROUP_SKILLS`: 5 grupos (`primera`/`segunda`/`tercera`/`medios`/`backs`), cada uno con 5 skills, mismo color `#0068CE`
- `obtenerGrupo(puesto)` — mapea por `posicionOriginal` primero, con fallback numérico. Soporta `'octavo'` en regex de tercera línea
- `generarRadarSVG(valores, numero, apellido)` — SVG con D3 `scaleLinear` + `lineRadial`, circular grid, label axis en negro
- Layout: 5 columnas (col1 = label categoría, cols 2-5 = hasta 4 radares/fila)
  - `catColW = 22`, `starW = 50`, `starH = 44`, `gap = 15`, `rowGap = 3`, `catGap = 5`
  - Labels divididos en 2 líneas si tienen 2 palabras, alineados a izquierda, sin bold
  - Sin stroke gris después de la última categoría
  - ViewBox SVG: 500×440, canvas: 520×458, labelR = 1.3×radius
- `efectividadSkill(s, skill)` — para Duelo: Positivo+Dominante; otras skills: Positivo+Dominante+Neutro

**`donuts.ts`** — Última página (A4 portrait 210×297mm):

- `agregarDonutsAlPDF(doc, dixTotales, partido, logoDataUrl)`
- 8 situaciones en grilla 3×3: colX=[18,78,138], rowY=[36,110,184]
- Donut slices: `#0068CE` (positivo) y `#0068CEB8` (negativo)
- Títulos: tamaño 11, helvetica normal, azul `[0, 104, 206]`
- `renderSVGaImagen(svgString, width, height)` — helper usado también por radar.ts

### Mock data (`src/lib/mock-data.ts`)

- `pickCalif` acepta `Partial<Record<CalificacionIndividual, number>>` — keys faltantes = prob 0
- Todas las skills excepto Tackle/Duelo solo generan Negativo/Positivo

### Procesamiento (`src/lib/processing/reporte-data.ts`)

- `MatrizProcesada` = `Record<number, FilaJugador>` — `FilaJugador` = `{ id, nombre, apellido, skills: Record<Skill, Contador>, totales (general/pelota/contacto/pie), efectividades (pelota/contacto/pie) }`
- Guard para `matrizProcesada[jugadorID]` ya existente
- Efectividad contacto usa `totalFavorable / totalAcciones`

### Componentes Svelte

- `Cabecera.svelte` — barra sticky blanca con navegación contextual. En `/app`: título del partido (vistas 4/5) + botones `[← Editar partido] [Terminar análisis →]` / `[← Volver al análisis] [Finalizar]`. Fuera de `/app`: marca "Stats Rugby" + botón "Retomar análisis" con dot rojo parpadeante (si `hayDatos`). Oculta en `/app` desde `+layout.svelte`.
- `VistaAnalisis.svelte` — análisis con botones `btn-chip` por jugador (`numero. apellido`), skills en grilla, calificadores. Incluye reproductor de video (YouTube/Vimeo/Veo) con captura de `videoTime`.
- `VistaCargaEquipo.svelte` — grilla 4 columnas con drag & drop (solo desktop, no touch)
- `VistaAcciones.svelte` — revisión de acciones logueadas, video embebido con seek (`seekToVideo`), botones "Descargar PDF" y "Compartir sala". Props: `PropsAcciones & { modalidad: ModalidadClave }`.
- `VistaSala.svelte` — sala de clips para el veedor (`/sala/[token]`): video + filtros por skill + playlist con seek.
- `src/routes/api/sala/+server.ts` — POST/GET de salas (Supabase). TTL free 72h.
- `$lib/planes.ts` — `LIMITES_FREE` (topes por grupo: contacto 2, pelota 2, pie 1, infracción 1, situaciones 2), `SITUACIONES`, `grupoDeSkill`.
- `$lib/csv.ts` — parser RFC 4180 completo (comillas, comas dentro de comillas, `\r\n`). Usado por `VistaCargaCSV`.
- `$lib/stores.svelte.ts` — `loadFromStorage()`, `saveToStorage()`, `clearStorage()` — persistencia en `localStorage` bajo key `stats-rugby-state`. SSR-safe con guard `browser`.
- `$lib/video.ts` — `extraerYouTubeId`, `cocinarEnlaceVideo`, `chequearEmbedYouTube` (cache en Map in-memory), `obtenerVideoVeo`, `formatTime`.
- `$lib/video-types.d.ts` — tipos para YouTube IFrame API y Vimeo Player API.
- `$lib/debug.ts` — `logError(...args)` con guard `import.meta.env.DEV`.
- `$lib/supabase.ts` — cliente Supabase (`PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY`).
- Todos los botones primarios usan `background-color: #0068CE`, hover `#0050A0`
- Menú: navbar `#0068CE`
- Footer: `background-color: #0068CE`, links hover `#CCE4F7`

### Estilo visual global

- **Azul primario**: `#0068CE` (`rgb(0, 104, 206)`)
- **Hover**: `#0050A0`
- **Flash animation**: 0% `#0068CE` → 50% `#3399EE`
- **Fondos muy claros**: `#F0F6FD`
- **Fondos claros**: `#CCE4F7`
- **Bordes calif.dom**: `#99C9EF`
- Logo SVG (`static/logo-se-ss.svg`): fill `#0068CE`

## Cambios relevantes en sesiones anteriores

1. Mock data: pickCalif relajado a Partial, non-Duelo/Tackle skills solo ±
2. Radars: grupo por línea de posición, vistaBox 500×440, labels en 1.3×radius
3. Reporte: A3, radar como página 0, tabla headers simplificados
4. Categorías de radar en columna izquierda con label horizontal, max 4 radares/fila
5. Suplentes 16-23 agregados en quince, y 5 suplentes en seven/ten/doce
6. Escudos 18mm de y=6 a y=24
7. Colores homogeneizados a `#0068CE`
8. Donuts gap aumentado a rowY=[36,110,184]
9. `obtenerGrupo` ahora usa `posicionOriginal` para todas las modalidades
10. Encabezados del PDF sin bold
11. Props de VistaAcciones tipadas (PropsAcciones + ModalidadClave), reemplazando `any`
12. try/catch + loading state + error message en generación de PDF
13. Guard en renderSVGaImagen contra canvas.getContext('2d') null
14. Timestamps `videoTime` en `Accion`/`TeamAccion` (Sprint 1 salas) + captura en VistaAnalisis + `formatTime`/seek en VistaAcciones
15. Navegación 3↔4↔5: `cambiarVista: (v: number) => void` tipado en los 4 tipos de props; botones "← Editar partido" (Analisis→3) y "← Volver al análisis" (Acciones→4)
16. `nextAccionId` inicializado desde `acciones.reduce((max, a) => Math.max(max, a.id), -1) + 1` — sin colisión tras recarga (#8)
17. `MatrizProcesada` tipada `Record<number, FilaJugador>` (#17); radar `skills: Skill[]`
18. `logError` de `$lib/debug.ts` reemplaza `console.error` (#20)
19. Video YouTube: listener `postMessage` para leer `currentTime` (`cachedYouTubeTime`), además del check de embed por oembed
20. Salas: cliente Supabase + `/api/sala` + `VistaSala.svelte` + botón "Compartir sala" (Sprints 2-3)
21. Cabecera sticky implementada: barra blanca en `/app`, menú oculto en `/app`, botones contextuales por vista, modal de Finalizar como prop de VistaAcciones
22. Parser CSV extraído a `$lib/csv.ts` con soporte RFC 4180 completo
23. Rooms de clips: botón "Compartir sala" → "Ver sala" tras creación (reabre modal con URL existente)
24. Fix drag & drop en VistaCargaEquipo: eliminado `$effect` duplicado del hijo y estado local `equipoModalidad`; `equipo` del padre (+page.svelte) es única fuente de verdad; quitado anti-patrón `equipo = [...equipo]` (la mutación profunda sobre el proxy `$state` ya es reactiva). Síntoma previo: primera vez con quince, el drop asignaba pero no pintaba azul y la selección no llegaba al padre
25. Salas: dedup server-side con `content_hash` (sha256) + endpoint `/api/sala/check`; `PUBLIC_SUPABASE_*` configuradas en Netlify para producción (primer deploy de salas a `main`)

## Plan de Instagram

### Formato general

- **Días**: martes y jueves 20:00 (ARG)
- **Aspecto**: 4:5 (1080×1350)
- **Estilo**: azul `#0068CE` sobre fondo blanco, tipografía limpia, mismo branding que la app
- **Hashtags**: `#StatsRugby #AnalisisRugby #RugbyArg #RugbyInteligente #ScoutingRugby`

### Feed — 6 publicaciones

| #   | Tipo                | Título                                         | Contenido                                                                                                                                                                                                                   |
| --- | ------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Carrusel (5 slides) | "Cómo analizar un partido en 5 pasos"          | Slide 1: Cargá tu plantel desde CSV, Slide 2: Armá el equipo con drag & drop, Slide 3: Datos del partido + link al video, Slide 4: Analizá jugada por jugada, Slide 5: Descargá el PDF con estadísticas. CTA: link a la app |
| 2   | Video (~30s)        | "Así se ve un análisis en vivo"                | Screen recording de VistaAnalisis: seleccionar jugador, pulsar skills, ver cómo se acumulan. Música de fondo, sin voz. Texto superpuesto indicando cada paso.                                                               |
| 3   | Placa               | "¿Qué dicen los números?"                      | Imagen del radar chart de un jugador con callouts explicando cada grupo de skills (contacto, pelota, pie). Texto: "Cada jugador tiene su huella digital". CTA: "Descargá el reporte de tu equipo".                          |
| 4   | Carrusel (4 slides) | "3 métricas que todo entrenador debería mirar" | Slide 1: Efectividad en el contacto (Tackle + Duelo), Slide 2: Gestión de pelota (Pases + Offload), Slide 3: Juego al pie (Patada + Recepción), Slide 4: Cómo leer los donuts de situaciones de equipo.                     |
| 5   | Video (~45s)        | "De la cancha al PDF en 2 minutos"             | Timelapse de flujo completo: cargar CSV → armar equipo → cargar partido → analizar → generar PDF. Muestra el PDF final con radares, tablas y donuts.                                                                        |
| 6   | Placa               | "Stats Rugby — Free. Simple. Profesional."     | Resumen de funcionalidades en viñetas. CTA final: "Probá la app gratis en statsrugby.com.ar".                                                                                                                               |

### Stories semanales

- **1 story por semana** (jueves o viernes post-partido)
- Contenido: captura de pantalla de un radar real o tabla de estadísticas
- Texto breve: "Partido de {local} vs {visitante}. {jugador} destacó en {skill}."
- Opcional: encuesta "¿Qué skill querés que analicemos la próxima?" con opciones (Contacto / Pelota / Pie)
- Stories destacadas en "Análisis" para guardar las mejores

## Desktop-first

Stats Rugby está diseñada para uso en PC de escritorio. Analizar un partido requiere pantalla grande para combinar video + botonera. La difusión enfatiza esto para evitar frustración en mobile/tablet.

## Vulnerabilidades y deuda técnica

### Críticas (pérdida de datos, funcionalidad rota, seguridad)

1. ~~**Escudos URMDP sin extensión → 404 en PDF**~~ ✅ FIXED
   - `src/lib/types.ts:298-319` — se agregó `.PNG` a los 20 slugs de URMDP.

2. ~~**`obtenerEscudo()` duplicada en reporte.ts y donuts.ts**~~ ✅ FIXED
   - Se eliminó la función duplicada de `donuts.ts`. Ahora solo vive en `reporte.ts`.

3. ~~**PDF sin try/catch ni loading state**~~ ✅ FIXED
   - `src/lib/components/VistaAcciones.svelte` — `generarReporte()` ahora tiene `try/catch`, estado `generando` que deshabilita el botón, y `errorMsg` reactivo mostrado como `.alerta-error` inline.

4. ~~**`renderSVGaImagen()` usa non-null assertion en canvas**~~ ✅ FIXED
   - `src/lib/pdf/donuts.ts:182-186` — se reemplazó `canvas.getContext('2d')!` con guard que rechaza la Promise si `ctx` es `null`.

5. **`alert()` para validaciones — no funciona en mobile**
   - `src/lib/components/VistaAnalisis.svelte:134,139,173` y `src/routes/contacto/+page.svelte:18,20` — por diseño: la app es desktop-first. El typo "situaciòn" ya está corregido.

6. **Drag & drop sin soporte táctil**
   - `src/lib/components/VistaCargaEquipo.svelte` — HTML5 Drag & Drop API no funciona en touch. Sin fallback. Aceptado por diseño desktop-first.

### Altas (bugs significativos, riesgo de integridad de datos)

7. ~~**CSV parser naive — se rompe con comillas o comas en nombres**~~ ✅ FIXED
   - `src/lib/csv.ts` — parser RFC 4180 completo (comillas, comas dentro de comillas, `\r\n`). Usado por `VistaCargaCSV`.

8. ~~**`nextAccionId` no persiste → colisión tras recarga**~~ ✅ FIXED
   - `src/lib/components/VistaAnalisis.svelte:32` — ahora `nextAccionId = acciones.reduce((max, a) => Math.max(max, a.id), -1) + 1`; arranca desde el máximo id de las acciones restauradas de localStorage.

9. **Efecto de persistencia en cada keystroke durante cambio de modalidad** — Mitigado
   - `src/routes/app/+page.svelte:44` — guard `if (equipoModalidad === usuarioModalidad) return;` evita reconstruir el equipo si la modalidad no cambió.

10. **Acciones huérfanas al cambiar modalidad** — No aplica en la práctica
    - `src/routes/app/+page.svelte:41-48` — al cambiar modalidad se reconstruye `equipo` pero NO se limpian `acciones` ni `teamAcciones`. El flujo lineal 1→2→3→4 impide llegar a vista 2 con acciones existentes.

11. ~~**Mismo equipo como local y visitante — sin validación**~~ ✅ FIXED
    - `src/lib/components/VistaCargaPartido.svelte:76-95` — selectores filtrados (`.filter()` excluye el equipo opuesto) + validación `partido.local !== partido.visitante` en `formValido`.

### Medias (UX, bordes, faltantes)

12. **Sin diseño responsive** — 4 componentes con layouts fijos:
    - `VistaCargaEquipo.svelte:172` — grilla 4 columnas sin media queries
    - `VistaAnalisis.svelte:613` — 2 paneles fijos
    - `VistaAcciones.svelte:79` — flex 2 columnas sin breakpoints
    - `VistaCargaPartido.svelte:180` — flex sin wrap

13. **Navegación "atrás" parcial**
    - Botones de ida y vuelta 3↔4↔5 funcionando (`cambiarVista`). Falta: historial de pila (no hay volver desde 1/2/3) y acceso a vistas previas sin perder datos.

14. **Veo fetch sin AbortController — carreras concurrentes** — Mitigado
    - `src/lib/components/VistaAnalisis.svelte:49-69` y `VistaAcciones.svelte:87-104` — ambos usan AbortController.

15. **oembed de YouTube sin caché ni rate-limit**
    - `VistaAnalisis.svelte:273`, `VistaAcciones.svelte:78`, `VistaSala.svelte:127` — fetch a `youtube.com/oembed` para chequear si el video se puede embeber. Sin debounce ni caché. Lógica duplicada en 3 componentes.
    - **Nota**: `$lib/video.ts` tiene `cacheEmbedYouTube` (Map in-memory) que cachea resultados. La lógica de chequeo está centralizada en `chequearEmbedYouTube()`. La duplicación en 3 componentes es un refactor pendiente, no un bug de seguridad.

16. **`simularPlantel` falla silenciosamente**
    - `src/lib/components/VistaCargaCSV.svelte:99-101` — si el fetch a `/plantilla-jugadores.csv` falla, solo `logError` (visible en DEV). El usuario no ve nada.
    - **Nota**: `VistaCargaCSV.svelte:87` ahora muestra `error = 'No se pudo cargar el plantel simulado...'`. Ya hay feedback al usuario.

### Bajas (calidad de código, typos, estilo)

17. ~~**`MatrizProcesada` tipeada como `Record<number, any>`**~~ ✅ FIXED
    - `src/lib/processing/reporte-data.ts:21` — ahora `Record<number, FilaJugador>`.

18. ~~**`VistaAcciones` props tipadas como `any`**~~ ✅ FIXED
    - `src/lib/components/VistaAcciones.svelte:12-14` — `$props<PropsAcciones & { modalidad: ModalidadClave }>()`.

19. ~~**Constante `SKILLS` sin usar en types.ts**~~ ✅ FIXED
    - Eliminada. En `src/lib/types.ts` solo existen `BALL_SKILLS`/`CONTACT_SKILLS`/`FOOT_SKILLS`/`INFRACCION_SKILLS` (+ tipos `BallSkill`/`ContactSkill`/`FootSkill`/`InfraccionSkill`).

20. ~~**`console.error` en producción**~~ ✅ FIXED
    - Se usa `logError` de `src/lib/debug.ts` (guard `import.meta.env.DEV`) en `VistaAnalisis.svelte:59,62` y `VistaCargaCSV.svelte:100`.

21. ~~**`label id="club-select"` duplicado**~~ ✅ FIXED
    - `src/lib/components/VistaCargaEquipo.svelte:73-85` — labels/ids `club-select` y `modalidad-select` únicos.

22. ~~**`limpiarAccionesIndividuales` asigna array vacío dos veces**~~ ✅ FIXED
    - `src/lib/components/VistaAnalisis.svelte:211-216` (y `limpiarAccionesGrupales` 218-223) — `acciones = []; acciones = [...acciones];`

23. ~~**Rooms de clips sin límite de creación**~~ ✅ FIXED
    - **Fix server-side**: columna `content_hash` (sha256 de partido+acciones+teamAcciones) en tabla `salas` + endpoint `/api/sala/check` — `crearSala()` consulta primero y muestra la URL de la sala existente en vez de duplicar
    - **Fix client-side**: state `salaCreada` + botón cambia a "Ver sala" (reabre modal con URL existente)
    - Pendiente: rate-limit estricto (el dedup evita duplicados idénticos, no limita creaciones con contenido distinto)

## Feature: salas de clips (modelo free/pago)

### Concepto

El analista comparte una "sala de clips" con su equipo. El veedor abre una URL y ve las acciones del partido filtrables por skill, con video embebido y seek por acción. Sin descarga de clips reales — solo enlaces con tiempo.

### Arquitectura

- **Almacenamiento**: Supabase (PostgreSQL) — tabla `salas` con UUID, JSON de acciones, expiración
- **API**: SvelteKit server routes (`/api/sala`) para crear/leer salas
- **Página de sala**: `/sala/[token]` — renderiza video + filtros + playlist
- **Auth**: Supabase Auth con Google OAuth (Fase 2)
- **Planes**: free (72h, 4 skills) / partido $5 (permanente, todas las skills) / temporada $50 (permanente, 20 partidos)

### Modelos de datos

**Tabla `salas` (Supabase):**

```
id              UUID PRIMARY KEY
created_by      UUID (NULL para free)
plan            TEXT ('free' | 'partido' | 'temporada')
partido_json    JSONB
acciones_json   JSONB
team_acciones_json JSONB
skills_visibles TEXT[]
expires_at      TIMESTAMPTZ (NULL si es paga)
created_at      TIMESTAMPTZ
```

### Sprints

1. **Sprint 1 — Timestamps** ✅ completo: `videoTime` en tipos, captura en análisis, `formatTime`/seek
2. **Sprint 2 — Supabase setup** ✅ funcional: tablas, RLS, cliente, `/api/sala`, página de sala
3. **Sprint 3 — VistaAcciones actualizada** ✅ funcional: video embed, acciones cliqueables, botón compartir sala
4. **Sprint 4 — Auth y planes** ⏳ no empezado: Google OAuth, UI pricing, lógica de planes

> ✅ TTL de salas free en 72h (`src/routes/api/sala/+server.ts:13`).

> ⚠️ **Bug conocido**: usuario free puede crear salas ilimitadas por partido (una por cada combinación de skills), evadiendo los topes del plan. Fix client-side aplicado (botón "Ver sala"), fix server-side pendiente (ver vuln #23).

### Decisiones clave

- **Sin descarga de clips**: solo enlaces con tiempo (`?t=120s`) para YouTube/Vimeo, `currentTime` para Veo
- **UUID para salas**: auto-generado, sin fricción. Permite futuro control de accesos
- **Supabase gratis**: 500MB storage + 50K reads/mes. Suficiente para ~20 clientes activos
- **Desktop-first**: la sala se ve mejor en PC (video + filtros + playlist)

### Documentación detallada

Ver `docs/SALAS_CLIPS.md` para diseño completo, user flows, schema SQL, y detalles de implementación.

## Próximos cambios de UX (diseño aprobado, sin implementar)

**Cabecera-analisis** (en `/app`) — ✅ implementado en `Cabecera.svelte`:

- Barra sticky blanca full-width arriba en `/app`, ocupando el espacio que hoy usa el menú (el nav azul deja de renderizarse en `/app`).
- Vista 4 (Análisis): título `Análisis {local} vs {visitante}` + botones `[← Editar partido] [Terminar análisis →]` arriba a la derecha.
- Vista 5 (Acciones): título `Resumen de acciones {local} vs {visitante}` + `[← Volver al análisis] [Finalizar]`.
- Vistas 1/2/3: solo la marca "Stats Rugby" (sin botones; cada vista conserva su `h2`).
- `Terminar análisis →` deshabilitado si `acciones.length === 0 && teamAcciones.length === 0`.
- El modal de confirmación de Finalizar pasa a ser prop de `VistaAcciones` (`confirmarFinalizar` + `onCancelarFinalizar`/`onConfirmarFinalizar`), moviendo el estado al page.

**Menú global** — ✅ implementado: se reduce a marca "Stats Rugby" + botón "Retomar análisis" (cuando `hayDatos` y no está en `/app`). Los links Inicio/Acerca de/Contacto se mueven al footer (`.footer-links` de `+layout.svelte`).
