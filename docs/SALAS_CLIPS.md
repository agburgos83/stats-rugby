# Salas de Clips — Diseño detallado

## Visión general

El analista comparte una "sala de clips" con su equipo. El veedor abre una URL y ve las acciones del partido filtrables por skill, con video embebido y seek por acción. No hay descarga de clips reales — solo enlaces con tiempo al video original.

## Estado actual (checkpoint)

- **Sprint 1 — Timestamps**: ✅ completo. `videoTime` en `Accion`/`TeamAccion`, captura en `VistaAnalisis` (`obtenerTiempoVideo`), `formatTime` + seek en `VistaAcciones`.
- **Sprint 2 — Supabase**: ✅ funcional. Cliente en `$lib/supabase.ts`, `/api/sala` (POST/GET), RLS, página `/sala/[token]` con `VistaSala.svelte`.
- **Sprint 3 — VistaAcciones**: ✅ funcional. Video embebido, acciones cliqueables (seek), botón "Compartir sala" con selector de skills y topes `LIMITES_FREE` por grupo.
- **Sprint 4 — Auth y planes**: ⏳ no empezado.
- ✅ **Modo Full (plan `'full'`)**: sala anónima (sin auth) **sin ningún tope de skills** (`limites=null`) y sin expiración. Está conmutado por la env var `PUBLIC_MODO_FULL` (`true` = full), que va inlined en build por SvelteKit (`$env/static/public`).
- ✅ **TTL**: las salas free expiran a las 72h (`src/routes/api/sala/+server.ts:13`).
- **Overlay de felicitaciones**: descartado por decisión. La sala vence a las 72h y el modal de VistaAcciones lo indica; sin countdown.

### Dos deploys con la misma base

| Netlify project   | `PUBLIC_MODO_FULL` | Plan grabado en `salas`        |
| ----------------- | ------------------ | ------------------------------ |
| `stats-rugby`     | `false`            | `free` (topes por grupo, 72h)  |
| `stats-rugby-brc` | `true`             | `full` (sin límites ni TTL)    |

Ambos comparten el mismo código, el mismo Supabase y el mismo cliente (`$lib/supabase.ts`). La única diferencia es el valor de `PUBLIC_MODO_FULL` en build. Los modos `partido` y `temporada` están previstos para Sprint 4 (auth) pero aún no se implementan.

---

## User flows

### Flujo 1: Analista gratuito (sin registro)

```
1. Abre la app → hace los 6 pasos (CSV → Equipo → Partido → Análisis → Acciones)
2. En VistaAcciones: video embebido + acciones cliqueables (con seek)
3. Click "Compartir sala de clips":
   - Modal: el analista elige qué skills/situaciones entran, con topes `LIMITES_FREE` por grupo (2 contacto, 2 pelota, 1 pie, 1 infracción, 2 situaciones)
   - Se crea sala en Supabase (plan='free', expires_at=now()+72h, skills_visibles elegidas)
   - Se copia el link /sala/{UUID} al clipboard
   - Feedback visual: "Link copiado ✓"
4. El veedor abre /sala/{UUID} → ve la sala
5. Después de 72h: "Esta sala expiró"
```

### Flujo 2: Analista registrado (plan pago)

```
1. Abre la app → ve pantalla de planes (o está logueado)
2. Elige plan → login con Google (Supabase Auth)
3. Hace los 6 pasos
4. En VistaAcciones: video + acciones cliqueables
5. Click "Compartir sala de clips":
   - Selecciona qué skills mostrar (checkboxes)
   - Se crea sala en Supabase (plan='partido'|'temporada', expires_at=NULL)
   - Se copia el link /sala/{UUID} al clipboard
6. El veedor abre /sala/{UUID} → ve la sala sin caducidad
```

### Flujo 3: Veedor (jugador, entrenador, etc.)

```
1. Recibe link /sala/{UUID} por WhatsApp/Telegram/etc.
2. Abre el link → ve:
   - Header: "Equipo Local vs Equipo Visitante — 15/06/2025"
   - Video embebido (YouTube/Vimeo/Veo)
   - Checkboxes de skills (para filtrar)
   - Lista de acciones con: jugador, skill, calificación, timestamp
3. Click en una acción → el video hace seek al timestamp correspondiente
4. Puede filtrar por skill usando los checkboxes
```

---

## Modelos de datos

### Tabla `salas` (Supabase)

```sql
CREATE TABLE salas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by        UUID REFERENCES auth.users(id),
  plan              TEXT DEFAULT 'free' CHECK (plan IN ('free','partido','temporada','full')),
  partido_json      JSONB NOT NULL,
  acciones_json     JSONB NOT NULL,
  team_acciones_json JSONB NOT NULL,
  skills_visibles   TEXT[] NOT NULL,
  limites           JSONB,             -- LIMITES_FREE del plan (ver $lib/planes.ts)
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_salas_token ON salas(id);
CREATE INDEX idx_salas_expires ON salas(expires_at) WHERE expires_at IS NOT NULL;
```

### Row Level Security (RLS)

```sql
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer (no requiere auth para veedores)
CREATE POLICY "Lectura pública" ON salas
  FOR SELECT USING (true);

-- Solo autenticados pueden crear salas pagas
CREATE POLICY "Crear sala paga" ON salas
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND plan IN ('partido', 'temporada')
  );

-- Cualquiera puede crear salas gratuitas (sin auth)
CREATE POLICY "Crear sala free" ON salas
  FOR INSERT WITH CHECK (
    plan = 'free'
    AND created_by IS NULL
  );

-- Modo full (uso personal en stats-rugby-brc): anónimo, sin límites ni TTL
CREATE POLICY "Crear sala full" ON salas
  FOR INSERT WITH CHECK (
    plan = 'full'
    AND created_by IS NULL
  );

-- Solo el creador puede editar/borrar
CREATE POLICY "Editar sala" ON salas
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Borrar sala" ON salas
  FOR DELETE USING (auth.uid() = created_by);
```

### Modelos de planes

| Característica          | Gratis                       | Partido ($5)                    | Temporada ($50, 20 partidos)    |
| ----------------------- | ---------------------------- | ------------------------------- | ------------------------------- |
| Skills visibles         | Topes por grupo (2/2/1/1/2)   | Todas, elegidas por el analista | Todas, elegidas por el analista |
| Caducidad               | 72 horas                     | Sin expiración                  | Sin expiración por partido      |
| Accesos                 | Ilimitados (quien tenga URL) | Ilimitados                      | Ilimitados                      |
| Video embebido          | Sí                           | Sí                              | Sí                              |
| Seek por acción         | Sí                           | Sí                              | Sí                              |
| Filtros                 | Solo skills visibles         | Todos                           | Todos                           |
| Filtro por jugador      | No                           | Sí                              | Sí                              |
| Filtro por calificación | No                           | Sí                              | Sí                           |

### Modo Full (uso personal)

Fuera del modelo free/partido/temporada, existe el plan `'full'` para uso personal en el proyecto `stats-rugby-brc` (activado por `PUBLIC_MODO_FULL=true`):

| Característica      | Full (uso personal) |
| ------------------- | ------------------- |
| Skills visibles     | Todas, sin topes    |
| Caducidad           | Sin expiración      |
| Creador             | Anónimo (`created_by NULL`), protegido por política RLS `"Crear sala full"` |
| `limites`           | `null`              |

---

## Arquitectura técnica

### Diagrama de flujo

```
┌─────────────────┐     POST /api/sala      ┌──────────────┐
│  VistaAcciones   │ ──────────────────────→ │  Supabase    │
│  (analista)      │                         │  tabla salas │
└─────────────────┘                         └──────┬───────┘
                                                   │
                                          GET /sala/[token]
                                                   │
                                          ┌────────▼───────┐
                                          │  Sala page     │
                                          │  (veedor)      │
                                          └────────────────┘
```

### API Routes (SvelteKit)

**`src/routes/api/sala/+server.ts`**

```typescript
// POST /api/sala — Crear sala
// Body: { partido, acciones, teamAcciones, skillsVisibles, plan }
// Response: { token: UUID }

// GET /api/sala?token=UUID — Leer sala
// Response: { sala } o error 404/expired
```

**`src/routes/sala/[token]/+page.svelte`**

- Load function: lee sala de Supabase por token
- Verifica expiración (si expires_at < now(), muestra mensaje)
- Renderiza: header + video + filtros + playlist

### Integración con video players

| Player  | Cómo leer `currentTime`                       | Cómo hacer seek            | Cómo embeber                                         |
| ------- | --------------------------------------------- | -------------------------- | ---------------------------------------------------- |
| YouTube | YouTube IFrame API: `player.getCurrentTime()` | `player.seekTo(t, true)`   | `<iframe src="https://youtube.com/embed/{id}">`      |
| Vimeo   | Vimeo Player API: `player.getCurrentTime()`   | `player.setCurrentTime(t)` | `<iframe src="https://player.vimeo.com/video/{id}">` |
| Veo     | `videoEl.currentTime`                         | `videoEl.currentTime = t`  | `<video src="{videoUrl}">`                           |

**Carga de APIs:**

- YouTube IFrame API: se carga dinámicamente vía `<script src="https://www.youtube.com/iframe_api">`
- Vimeo Player API: se carga dinámicamente vía `<script src="https://player.vimeo.com/api/player.js">`
- Veo: ya se resuelve vía `/api/veo-video` (server-side proxy)

---

## Componentes

### VistaAcciones.svelte (modificado)

**Layout actual:** 2 columnas (acciones individuales + situaciones de juego) + botón PDF.

**Layout nuevo:**

```
┌─────────────────────────────────────────────────┐
│  Resumen: Equipo Local vs Equipo Visitante      │
├──────────────────────┬──────────────────────────┤
│                      │  Filtros:                │
│   VIDEO EMBEBIDO     │  ☐ Tackle               │
│   (YouTube/Vimeo/    │  ☐ Pase                 │
│    Veo)              │  ☐ Scrum propio         │
│                      │  ☐ Line propio          │
│                      │  ...                    │
├──────────────────────┴──────────────────────────┤
│  Acciones:                                      │
│  ⏱ 2:15  García - Tackle: Positivo             │
│  ⏱ 5:30  López - Pase: Negativo                │
│  ⏱ 8:45  Scrum propio: Positivo                │
│  ...                                            │
├─────────────────────────────────────────────────┤
│  [Descargar PDF]  [Compartir sala de clips]     │
└─────────────────────────────────────────────────┘
```

**Cambios:**

1. Agregar video embed (mismo patrón que VistaAnalisis)
2. Hacer acciones clickable (seek al video)
3. Agregar botón "Compartir sala de clips"
4. Mantener botón "Descargar PDF"

### VistaSala.svelte (nuevo)

**Layout:**

```
┌─────────────────────────────────────────────────┐
│  Equipo Local vs Equipo Visitante               │
│  15/06/2025 — URBA — Primera                    │
├──────────────────────┬──────────────────────────┤
│                      │  Filtrar por skill:      │
│   VIDEO EMBEBIDO     │  ☑ Todas                │
│                      │  ☐ Tackle               │
│                      │  ☐ Pase                 │
│                      │  ☐ Scrum propio         │
│                      │  ☐ Line propio          │
├──────────────────────┴──────────────────────────┤
│  Playlist:                                      │
│  ⏱ 2:15  García - Tackle: Positivo  (verde)    │
│  ⏱ 5:30  López - Pase: Negativo     (rojo)     │
│  ⏱ 8:45  Scrum propio: Positivo     (verde)    │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

**Funcionamiento:**

- Video embebido: YouTube/Vimeo/Veo (mismo patrón que VistaAnalisis)
- Filtros: checkboxes que muestran/ocultan acciones en la playlist
- Cada acción es un botón que hace seek al video en `videoTime`
- Colores: positivas/dominantes en verde (`#16a34a`), negativas en rojo (`#dc2626`), neutros en gris
- Sin filtro por calificación ni por jugador en versión gratuita

---

## Sprint 1 — Timestamps (✅ completo)

### Objetivo

Capturar el momento del video donde ocurre cada acción. Sin esto, no hay sala.

### Archivos a modificar

1. **`src/lib/types.ts`** — agregar `videoTime: number | null` a `Accion` y `TeamAccion`
2. **`src/lib/components/VistaAnalisis.svelte`** — capturar timestamp:
   - Bind video element (`bind:this={videoEl}`)
   - Integrar YouTube/Vimeo Player API
   - Capturar `currentTime` en `registrarAccionDirecta()` y `registrarAccionEquipo()`
3. **`src/lib/mock-data.ts`** — generar `videoTime` simulado
4. **`src/lib/components/VistaAcciones.svelte`** — mostrar timestamp formateado

### Detalles de implementación

**Captura de timestamp en VistaAnalisis:**

```typescript
// En registrarAccionDirecta():
const currentTime =
	videoEl?.currentTime ?? ytPlayer?.getCurrentTime() ?? vimeoPlayer?.getCurrentTime() ?? null;

acciones.push({
	id: nextAccionId++,
	player: j,
	skill: skillElegida,
	calificacion: califIndividualElegida,
	videoTime: currentTime
});
```

**Helper de formato:**

```typescript
function formatTime(seconds: number | null): string {
	if (seconds === null) return '--:--';
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, '0')}`;
}
```

---

## Sprint 2 — Supabase setup (✅ funcional)

### Objetivo

Configurar tablas, cliente, API routes y página de sala.

### Pasos

1. Crear tablas en Supabase (SQL Editor)
2. Configurar RLS
3. Instalar `@supabase/supabase-js`
4. Crear `src/lib/supabase.ts` (cliente)
5. Crear `.env` con `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`
6. Crear `src/routes/api/sala/+server.ts` (POST + GET)
7. Crear `src/routes/sala/[token]/+page.svelte` (página de sala)
8. Crear `src/lib/components/VistaSala.svelte` (componente principal)

---

## Sprint 3 — VistaAcciones actualizada (✅ funcional)

### Objetivo

Vista previa mejorada con video + acciones cliqueables + botón compartir.

### Pasos

1. Agregar video embed a VistaAcciones
2. Hacer acciones clickable (seek al video)
3. Agregar botón "Compartir sala de clips":
   - Serializar datos → POST `/api/sala` → copiar link
4. Agregar feedback visual ("Link copiado ✓")

---

## Sprint 4 — Auth y planes (futuro)

### Objetivo

Registro de usuarios, diferenciación free/pago.

### Pasos

1. Supabase Auth con Google OAuth
2. Callback route: `src/routes/auth/callback/+server.ts`
3. Modal de login: `src/lib/components/LoginModal.svelte`
4. UI de pricing: `src/lib/components/Pricing.svelte`
5. Lógica de plan en la sala (qué skills se ven, caducidad)
6. Perfil del analista con historial de salas

---

## Decisiones técnicas pendientes

1. **Skills fijas para sala gratuita**: ¿cuáles? (Tackle, Pase, Scrum propio, Line propio — a confirmar)
2. **Comportamiento al expirar**: ✅ resuelto — la API devuelve 410 `"Esta sala expiró"` y se muestra el mensaje en la sala. El overlay de felicitaciones se descartó (sin countdown).
3. **Límite de acciones por sala**: ¿hay un máximo? (400 acciones ≈ 4KB JSON, bien dentro de los límites de Supabase)
4. **Cache de la sala**: ¿cachear en el cliente? (para que el veedor no recargue Supabase en cada filtro)
5. **Video embebido en sala gratuita**: ¿siempre embebido o con link a la plataforma?

---

## Limitaciones conocidas

1. **URL length**: sin backend, los datos no viajan en la URL (usan Supabase). Sin limitación.
2. **Supabase free tier**: 500MB storage, 50K reads/mes. Suficiente para ~20 clientes activos.
3. **Netlify Functions timeout**: 10s en plan gratuito. Las API routes de SvelteKit corren como serverless functions.
4. **Cross-origin**: YouTube/Vimeo iframes no permiten leer `currentTime` directamente. Se usa Player API.
5. **Veo**: requiere proxy server-side (ya existe `/api/veo-video`) para evitar CORS.
