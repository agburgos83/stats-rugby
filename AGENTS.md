# Stats Rugby — Contexto del proyecto

## Stack
- Svelte 5 (runes: `$state`, `$effect`, `$props`, `$bindable`)
- TypeScript, Vite, jsPDF + jspdf-autotable, D3 (arc, pie, scaleLinear, lineRadial)
- Hosting: Netlify (SPA, `/escudos-clubes/*` redirect)

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
- `MatrizProcesada` = `{ skills: { [skill]: { Negativo, Neutro, Positivo, Dominante, Total } } }`
- Guard para `matrizProcesada[jugadorID]` ya existente
- Efectividad contacto usa `totalFavorable / totalAcciones`

### Componentes Svelte
- `VistaAnalisis.svelte` — análisis con botones `btn-chip` por jugador (`numero. apellido`), skills en grilla, calificadores
- `VistaCargaEquipo.svelte` — grilla 4 columnas con drag & drop
- `VistaAcciones.svelte` — botón "Generar reporte PDF"
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

## Pendientes / ideas
- No hay issues conocidos abiertos
- Instagram: plan de 6 publicaciones + historias semanales definido
