<script lang="ts">
	import {
		// type PartidoContexto,
		type Accion,
		type TeamAccion,
		type Player,
		type CalificacionIndividual,
		INFRACCION_SKILLS
	} from '$lib/types';
	import {
		cocinarEnlaceVideo,
		formatTime,
		extraerYouTubeId,
		chequearEmbedYouTube,
		obtenerVideoVeo
	} from '$lib/video';
	import '$lib/video-types.d.ts';
	import { grupoDeSkill } from '$lib/planes';
	import { logError } from '$lib/debug';

	// interface sala {
	// 	id: string;
	// 	plan: string;
	// 	partido_json: PartidoContexto;
	// 	acciones_json: Accion[];
	// 	team_acciones_json: TeamAccion[];
	// 	skills_visibles: string[];
	// 	limites: Record<string, number>;
	// 	expires_at: string | null;
	// 	created_by: string | null;
	// }

	let { sala } = $props();

	let jugadorElegidoId = $state<number | null>(null);
	let califFiltro = $state<'todos' | CalificacionIndividual>('todos');
	let skillsPendientes = $state<string[]>([]); // selección en curso (checkboxes)
	let skillsAplicados = $state<string[]>([]); // filtros activos tras "Aplicar"
	let tabActual = $state<'eventos' | 'filtros'>('eventos');
	let embedPermitido = $state<boolean | null>(null);
	let veoVideoUrl = $state<string | null>(null);
	let veoLoading = $state(false);
	let videoEl = $state<HTMLVideoElement | null>(null);
	// eslint-disable-next-line svelte/prefer-writable-derived
	let urlEmbed = $state<string | null>(null);
	let filtrosInicializados = false; // flag no reactivo: inicializa filtros una sola vez

	let indiceClip = $state<number | null>(null);
	let clipTimer: ReturnType<typeof setTimeout> | null = null;
	let containerRef = $state<HTMLDivElement | null>(null);
	let listaRef = $state<HTMLDivElement | null>(null);
	let enFoco = $state(false);

	const partido = $derived(sala.partido_json);
	const acciones = $derived(sala.acciones_json);
	const teamAcciones = $derived(sala.team_acciones_json);
	const skillsVisibles = $derived(sala.skills_visibles ?? []);
	const skillUnica = $derived(skillsAplicados.length === 1 ? skillsAplicados[0] : null);

	const mostrarFiltroJugador = $derived(
		skillsAplicados.length > 0 && skillsAplicados.every((s) => grupoDeSkill(s) !== 'situaciones')
	);

	const mostrarFiltroCalif = $derived(
		skillUnica !== null && !(INFRACCION_SKILLS as readonly string[]).includes(skillUnica)
	);

	// jugadores con acciones del skill único
	const jugadoresDisponibles = $derived.by(() => {
		const jugadores: Player[] = [];
		for (const a of acciones) {
			if (!skillsAplicados.includes(a.skill)) continue;
			if (!jugadores.some((j) => j.id === a.player.id)) jugadores.push(a.player);
		}
		return jugadores;
	});

	// acciones visibles en la sala
	const accionesFiltradas = $derived.by(() => {
		const resultado: Array<
			{ tipo: 'individual'; accion: Accion } | { tipo: 'equipo'; accion: TeamAccion }
		> = [];

		for (const a of acciones)
			if (skillsVisibles.includes(a.skill)) resultado.push({ tipo: 'individual', accion: a });

		for (const ta of teamAcciones)
			if (skillsVisibles.includes(ta.situacion)) resultado.push({ tipo: 'equipo', accion: ta });

		return resultado;
	});

	// skills individuales presentes entre las visibles (contacto/pelota/pie/infracción)
	const skillsIndividualesDisponibles = $derived.by(() => {
		const lista: string[] = [];
		for (const item of accionesFiltradas) {
			const nombre = item.tipo === 'individual' ? item.accion.skill : item.accion.situacion;
			if (grupoDeSkill(nombre) === 'situaciones') continue;
			if (!lista.includes(nombre)) lista.push(nombre);
		}
		return lista.sort((a, b) => a.localeCompare(b, 'es'));
	});

	// situaciones de juego presentes entre las visibles
	const situacionesDisponibles = $derived.by(() => {
		const lista: string[] = [];
		for (const item of accionesFiltradas) {
			const nombre = item.tipo === 'individual' ? item.accion.skill : item.accion.situacion;
			if (grupoDeSkill(nombre) !== 'situaciones') continue;
			if (!lista.includes(nombre)) lista.push(nombre);
		}
		return lista.sort((a, b) => a.localeCompare(b, 'es'));
	});

	// unión: la usan init, Todos y Ninguno (afectan ambas cajas)
	const skillsDisponibles = $derived([...skillsIndividualesDisponibles, ...situacionesDisponibles]);

	// aplicadas (skill + jugador)
	const accionesMostradas = $derived(
		accionesFiltradas.filter((item) => {
			const nombre = item.tipo === 'individual' ? item.accion.skill : item.accion.situacion;
			if (!skillsAplicados.includes(nombre)) return false;
			if (
				mostrarFiltroJugador &&
				item.tipo === 'individual' &&
				jugadorElegidoId !== null &&
				item.accion.player.id !== jugadorElegidoId
			) {
				return false;
			}
			if (califFiltro !== 'todos' && item.accion.calificacion !== califFiltro) {
				return false;
			}
			return true;
		})
	);

	const opcionesCalificacion: Array<{ valor: CalificacionIndividual; label: string }> = $derived.by(
		() => {
			if (skillUnica === 'Tackle') {
				return [
					{ valor: 'Negativo', label: 'Errado' },
					{ valor: 'Neutro', label: 'Neutro' },
					{ valor: 'Positivo', label: 'Positivo' },
					{ valor: 'Dominante', label: 'Dominante' }
				];
			}
			if (skillUnica === 'Duelo') {
				return [
					{ valor: 'Negativo', label: 'Negativo' },
					{ valor: 'Neutro', label: 'Neutro' },
					{ valor: 'Positivo', label: 'Positivo' },
					{ valor: 'Dominante', label: 'Quiebre' }
				];
			}
			return [
				{ valor: 'Negativo', label: 'Negativo' },
				{ valor: 'Positivo', label: 'Positivo' }
			];
		}
	);

	$effect(() => {
		urlEmbed = cocinarEnlaceVideo(partido.urlVideo, {
			controls: false,
			mute: true,
			autoplay: true
		});
	});

	$effect(() => {
		if (filtrosInicializados) return;
		if (skillsDisponibles.length === 0) return;
		skillsPendientes = [...skillsDisponibles];
		skillsAplicados = [...skillsDisponibles];
		filtrosInicializados = true;
	});

	$effect(() => {
		const url = partido.urlVideo;
		if (!url) {
			embedPermitido = null;
			return;
		}
		const videoId = extraerYouTubeId(url);
		if (!videoId) {
			embedPermitido = true;
			return;
		}
		embedPermitido = null;
		let activo = true;
		chequearEmbedYouTube(videoId).then((permitido) => {
			if (activo) embedPermitido = permitido;
		});
		return () => {
			activo = false;
		};
	});

	$effect(() => {
		const url = partido.urlVideo;
		if (!url) {
			embedPermitido = null;
			return;
		}
		const videoId = extraerYouTubeId(url);
		if (!videoId) {
			embedPermitido = true;
			return;
		}
		embedPermitido = null;
		let activo = true;
		chequearEmbedYouTube(videoId).then((permitido) => {
			if (activo) embedPermitido = permitido;
		});
		return () => {
			activo = false;
		};
	});

	$effect(() => {
		const url = partido.urlVideo;
		if (!url || !url.includes('veo.co') || !url.includes('app.veo.co')) {
			veoVideoUrl = null;
			veoLoading = false;
			return;
		}
		veoLoading = true;
		veoVideoUrl = null;
		const slug = url.replace(/\/$/, '').split('/').pop() || '';
		const controller = new AbortController();
		obtenerVideoVeo(slug, controller.signal)
			.then((videoUrl) => {
				if (videoUrl) veoVideoUrl = videoUrl;
			})
			.catch((e) => logError('Error al traer video de Veo:', e))
			.finally(() => (veoLoading = false));
		return () => controller.abort();
	});

	function seekToVideo(seconds: number | null): void {
		if (seconds === null) return;
		window.scrollTo({ top: 0, behavior: 'smooth' });
		if (
			videoEl ||
			!(partido.urlVideo?.includes('youtube.com') || partido.urlVideo?.includes('youtu.be'))
		) {
			// videos nativos (Veo) quedan como están
			if (videoEl) {
				videoEl.currentTime = seconds;
				videoEl.play();
			}
			return;
		}
		const iframe = document.querySelector(
			'iframe[src*="youtube.com/embed"]'
		) as HTMLIFrameElement | null;
		if (!iframe?.contentWindow) return;
		const orden = [
			{ event: 'command', func: 'seekTo', args: [seconds, true] },
			{ event: 'command', func: 'playVideo' }
		];
		orden.forEach((m) => iframe.contentWindow?.postMessage(JSON.stringify(m), '*'));
		// reintento: si YouTube todavía está cargando el primer play, re-mandar play
		window.setTimeout(() => {
			iframe.contentWindow?.postMessage(
				JSON.stringify({ event: 'command', func: 'playVideo' }),
				'*'
			);
		}, 250);
	}

	const DURACION_INDIVIDUAL = 6000;
	const DURACION_EQUIPO = 10000;

	function pausarVideo(): void {
		if (videoEl) {
			videoEl.pause();
			return;
		}
		const iframe = document.querySelector(
			'iframe[src*="youtube.com/embed"]'
		) as HTMLIFrameElement | null;
		iframe?.contentWindow?.postMessage(
			JSON.stringify({ event: 'command', func: 'pauseVideo' }),
			'*'
		);
	}

	function detenerCadena(): void {
		if (clipTimer !== null) {
			clearTimeout(clipTimer);
			clipTimer = null;
		}
		indiceClip = null;
		pausarVideo();
	}

	function reproducirDesde(desde: number): void {
		if (clipTimer !== null) {
			clearTimeout(clipTimer);
			clipTimer = null;
		}
		const lista = accionesMostradas;
		let i = desde;
		while (i < lista.length && lista[i].accion.videoTime === null) i++;
		if (i >= lista.length) {
			detenerCadena();
			return;
		}
		indiceClip = i;
		const item = lista[i];
		seekToVideo(item.accion.videoTime);
		clipTimer = setTimeout(
			() => siguienteClip(),
			item.tipo === 'individual' ? DURACION_INDIVIDUAL : DURACION_EQUIPO
		);
	}

	function siguienteClip(): void {
		if (indiceClip === null) return;
		reproducirDesde(indiceClip + 1);
	}

	function toggleFullScreen(): void {
		const el = containerRef;
		if (!el) return;
		try {
			const div = el as HTMLDivElement & { webkitRequestFullscreen?: () => void };
			const doc = document as Document & { webkitExitFullscreen?: () => void };
			if (!document.fullscreenElement) {
				(div.requestFullscreen ?? div.webkitRequestFullscreen)?.call(el);
			} else {
				(doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(document);
			}
		} catch {
			/* fullscreen no disponible — silencioso */
		}
	}

	$effect(() => {
		function actualizar() {
			enFoco = !!document.fullscreenElement;
		}
		document.addEventListener('fullscreenchange', actualizar);
		return () => document.removeEventListener('fullscreenchange', actualizar);
	});

	// corta la cadena si cambian los filtros (identidad de accionesMostradas) o al desmontar
	$effect(() => {
		void accionesMostradas;
		return () => detenerCadena();
	});

	$effect(() => {
		const i = indiceClip;
		if (i === null) return;
		const cont = listaRef;
		const el = cont?.children[i];
		if (!cont || !(el instanceof HTMLElement)) return;
		const delta =
			el.getBoundingClientRect().top -
			cont.getBoundingClientRect().top -
			cont.clientHeight / 2 +
			el.clientHeight / 2;
		cont.scrollTo({ top: cont.scrollTop + delta, behavior: 'smooth' });
	});

	function seleccionarTodas(): void {
		skillsPendientes = [...skillsDisponibles];
	}

	function limpiarFiltros(): void {
		skillsPendientes = [];
	}

	function aplicarFiltros(): void {
		skillsAplicados = [...skillsPendientes];
		jugadorElegidoId = null;
		tabActual = 'eventos';
	}

	function togglePendiente(nombre: string) {
		if (skillsPendientes.includes(nombre)) {
			skillsPendientes = skillsPendientes.filter((s) => s !== nombre);
		} else {
			skillsPendientes = [...skillsPendientes, nombre];
		}
	}

	function signoDe(calif: CalificacionIndividual): string {
		switch (calif) {
			case 'Negativo':
				return '-';
			case 'Neutro':
				return '=';
			case 'Positivo':
				return '+';
			case 'Dominante':
				return '++';
		}
	}
</script>

<div class="pantalla-reporte" bind:this={containerRef}>
	<h2>
		Sala de clips | {partido.local} vs {partido.visitante} ({partido.puntosLocal} - {partido.puntosVisitante})
	</h2>

	<div class="contenido-sala">
		<!-- IZQUIERDA: Video -->
		<div class="panel-video">
			{#if urlEmbed}
				{#if embedPermitido === null}
					<div class="veo-loading">Verificando disponibilidad del video…</div>
				{:else if embedPermitido}
					<iframe
						src={urlEmbed}
						title="Video Player"
						style="border: 0;"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
					></iframe>
				{:else}
					<div class="embed-bloqueado">
						<span>El propietario del video inhabilitó la reproducción en otros sitios web.</span>
					</div>
				{/if}
			{:else if veoVideoUrl}
				<video bind:this={videoEl} src={veoVideoUrl} controls muted preload="metadata"
					><track kind="captions" /></video
				>
			{:else if veoLoading}
				<div class="veo-loading">Cargando video…</div>
			{/if}
		</div>

		<!-- DERECHA: Filtros -->
		<aside class="panel-derecho">
			<h2>Clips del partido</h2>
			<div class="tabs">
				<button onclick={() => (tabActual = 'eventos')} class:activo={tabActual === 'eventos'}>
					Eventos
				</button>
				<button onclick={() => (tabActual = 'filtros')} class:activo={tabActual === 'filtros'}
					>Filtros
				</button>
			</div>

			{#if tabActual === 'eventos'}
				{#if mostrarFiltroJugador}
					<div class="filtro-jugador">
						<label for="jugador-select">Filtrá por jugador</label>
						<select id="jugador-select" class="select-control" bind:value={jugadorElegidoId}>
							<option value={null}>Todos los jugadores</option>
							{#each jugadoresDisponibles as j (j.id)}
								<option value={j.id}>{j.apellido}, {j.nombre}</option>
							{/each}
						</select>
					</div>
				{/if}

				{#if mostrarFiltroCalif}
					<div class="filtro-calif">
						<label>Calificación</label>
						<div class="radio-grid">
							<label class="radio-opcion" class:activo={califFiltro === 'todos'}>
								<input
									type="radio"
									name="calif"
									value="todos"
									checked={califFiltro === 'todos'}
									onchange={() => (califFiltro = 'todos')}
								/>
								Todos
							</label>

							{#each opcionesCalificacion as c (c.valor)}
								{@const activo = califFiltro === c.valor}
								<label class="radio-opcion" class:activo>
									<input
										type="radio"
										name="calif"
										value={c.valor}
										checked={activo}
										onchange={() => (califFiltro = c.valor)}
									/>
									{c.label}
								</label>
							{/each}
						</div>
					</div>
				{/if}

				<div class="panel-playlist">
					<h3>Playlist de acciones ({accionesMostradas.length})</h3>
					<div class="lista-scroll" bind:this={listaRef}>
						{#each accionesMostradas as item, i (item)}
							{#if item.tipo === 'individual'}
								<button
									class="tarjeta-log"
									class:activa={indiceClip === i}
									onclick={() => reproducirDesde(i)}
								>
									<span class="badge-tiempo">{formatTime(item.accion.videoTime)}</span>
									<span>{item.accion.skill}</span>
									{#if !INFRACCION_SKILLS.some((s) => s === item.accion.skill)}
										<span class="signo">{signoDe(item.accion.calificacion)}</span>
									{/if}
								</button>
							{:else}
								<button
									class="tarjeta-log"
									class:activa={indiceClip === i}
									onclick={() => reproducirDesde(i)}
								>
									<span class="badge-tiempo">{formatTime(item.accion.videoTime)}</span>
									<span>{item.accion.situacion}</span>
									<span class="signo">{signoDe(item.accion.calificacion)}</span>
								</button>
							{/if}
						{/each}
					</div>
				</div>

				<div class="video-toolbar">
					<button class="btn-foco" onclick={toggleFullScreen}>
						⛶ {enFoco ? 'Salir' : 'Ampliar'}
					</button>
				</div>
			{:else if tabActual === 'filtros'}
				{#if skillsIndividualesDisponibles.length > 0}
					<div class="panel-filtros">
						<h3>Acciones individuales</h3>
						{#each skillsIndividualesDisponibles as skill (skill)}
							<label class="filtro-skill">
								<input
									type="checkbox"
									checked={skillsPendientes.includes(skill)}
									onchange={() => togglePendiente(skill)}
								/>
								{skill}
							</label>
						{/each}
					</div>
				{/if}

				{#if situacionesDisponibles.length > 0}
					<div class="panel-filtros">
						<h3>Situaciones de juego</h3>
						{#each situacionesDisponibles as situacion (situacion)}
							<label class="filtro-skill">
								<input
									type="checkbox"
									checked={skillsPendientes.includes(situacion)}
									onchange={() => togglePendiente(situacion)}
								/>
								{situacion}
							</label>
						{/each}
					</div>
				{/if}

				<div class="filtro-botones">
					<button onclick={() => seleccionarTodas()}>Todos</button>
					<button onclick={() => limpiarFiltros()}>Ninguno</button>
					<button class="primario" onclick={() => aplicarFiltros()}>Aplicar</button>
				</div>
			{/if}
		</aside>
	</div>
</div>

<style>
	/* ===== LAYOUT ===== */
	.pantalla-reporte {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: 20px;
	}

	.pantalla-reporte h2 {
		margin: 0;
		color: #0f172a;
		font-size: 1.35rem;
		font-weight: 700;
	}

	.subtitulo-torneo {
		margin: 0;
		color: #64748b;
		font-size: 0.9rem;
	}

	.contenido-sala {
		display: grid;
		grid-template-columns: 3fr 1fr;
		gap: 24px;
		align-items: start;
	}

	.panel-derecho {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.panel-derecho h2 {
		font-size: 1.2rem;
		font-weight: 700;
		color: #334155;
		margin: 0;
		border-bottom: 1px solid #f1f5f9;
		padding-bottom: 8px;
	}

	/* ===== VIDEO ===== */
	.panel-video iframe,
	.panel-video video {
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: 8px;
		background-color: #000;
	}

	.veo-loading {
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: 8px;
		background: #000;
		color: #94a3b8;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.embed-bloqueado {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
		width: 100%;
		aspect-ratio: 16 / 9;
		background: #f0f6fd;
		border: 1px solid #99c9ef;
		border-radius: 8px;
		padding: 24px 32px;
		color: #1e40af;
		font-weight: 500;
		font-size: 0.95rem;
		box-sizing: border-box;
		text-align: center;
	}

	/* ===== TABS ===== */
	.tabs {
		display: flex;
		gap: 8px;
	}

	.tabs button {
		padding: 8px 16px;
		border: 1px solid #0068ce;
		border-radius: 6px;
		background: white;
		color: #0068ce;
		cursor: pointer;
	}

	.tabs button.activo {
		background-color: #0068ce;
		color: white;
	}

	/* ===== PLAYLIST ===== */
	.panel-playlist {
		background-color: white;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 16px;
	}

	.panel-playlist h3 {
		font-size: 1.05rem;
		font-weight: 700;
		color: #334155;
		margin-top: 0;
		margin-bottom: 8px;
		padding-bottom: 8px;
	}

	.panel-playlist .lista-scroll {
		max-height: 400px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-right: 4px;
	}

	.tarjeta-log {
		display: flex;
		align-items: center;
		gap: 12px;
		background-color: #f0f6fd;
		border: none;
		border-radius: 6px;
		padding: 10px 12px;
		font-size: 0.85rem;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
		cursor: pointer;
		transition: background-color 0.1s ease;
		text-align: left;
		color: #0050a0;
		font-weight: bold;
		text-transform: uppercase;
		width: 100%;
		font-family: inherit;
	}

	.tarjeta-log:hover {
		background-color: #99c9ef;
		border-color: #99c9ef;
	}

	.tarjeta-log .signo {
		margin-left: auto;
		color: #0068ce;
		font-weight: 700;
		font-size: 0.95rem;
	}

	.badge-tiempo {
		background-color: white;
		color: #0068ce;
		font-family: monospace;
		font-weight: bold;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.8rem;
		min-width: 72px;
		text-align: center;
	}

	/* ===== FILTROS ===== */
	.panel-filtros {
		background-color: white;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.panel-filtros h3 {
		font-size: 1.05rem;
		font-weight: 700;
		color: #334155;
		margin-top: 0;
		margin-bottom: 2px;
		padding-bottom: 2px;
	}

	.filtro-skill {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.8rem;
		color: #334155;
		cursor: pointer;
		user-select: none;
		text-transform: uppercase;
		line-height: 2;
		font-weight: bold;
	}

	.filtro-skill:hover {
		color: #0068ce;
	}

	.filtro-skill input[type='checkbox'] {
		border-radius: 2px;
		border-color: #cbd5e1;
	}

	.filtro-skill input[type='checkbox']:checked {
		background-color: #0068ce;
		border-color: #0068ce;
	}

	.filtro-jugador {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.filtro-jugador label {
		font-size: 0.82rem;
		font-weight: 600;
		color: #475569;
		margin-bottom: 4px;
	}

	.filtro-jugador .select-control {
		width: 100%;
		padding: 10px 12px;
		font-size: 0.9rem;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		outline: none;
		box-sizing: border-box;
		background-color: #fff;
		color: #1e293b;
		transition: border-color 0.15s ease;
	}

	.filtro-jugador .select-control:focus {
		border-color: #0068ce;
		box-shadow: 0 0 0 3px rgba(0, 104, 206, 0.1);
	}

	.filtro-botones {
		display: flex;
		gap: 8px;
		margin-top: 0 0 12px;
	}

	.filtro-botones button {
		padding: 6px 16px;
		border: 1px solid #0068ce;
		border-radius: 4px;
		background: white;
		color: #0068ce;
		cursor: pointer;
		font-size: 0.85rem;
		line-height: 1.2;
	}

	.filtro-botones button.primario {
		background-color: #0068ce;
		color: white;
	}

	.filtro-botones button.primario:hover {
		background-color: #0050a0;
	}

	.filtro-botones button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.filtro-calif {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.filtro-calif > label {
		font-size: 0.82rem;
		font-weight: 600;
		color: #475569;
		margin: 8px 0 0;
	}

	.radio-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 16px;
	}

	.radio-opcion {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.85rem;
		font-weight: 600;
		color: #334155;
		cursor: pointer;
		user-select: none;
	}

	.radio-opcion input[type='radio'] {
		accent-color: #0068ce;
		margin: 0;
	}

	@media (max-width: 768px) {
		.contenido-sala {
			grid-template-columns: 1fr;
		}

		.pantalla-reporte {
			padding: 12px;
		}

		.pantalla-reporte h2 {
			font-size: 1.1rem;
		}

		.panel-playlist .lista-scroll {
			max-height: none;
		}

		.tabs button {
			padding: 12px 20px;
		}

		.filtro-botones button {
			padding: 6px 12px;
			font-size: 0.8rem;
			border-width: 1px;
		}

		.embed-bloqueado {
			padding: 16px;
		}
	}

	/* a partir de acá estilos FS */

	/* ===== BOTÓN FULLSCREEN ===== */
	.video-toolbar {
		width: 100%;
		margin-top: 12px;
	}

	.btn-foco {
		padding: 12px;
		background-color: #0068ce;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: bold;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background-color 0.1s ease;
	}

	.btn-foco:hover {
		background-color: #0050a0;
	}

	/* ===== CLIP EN REPRODUCCIÓN ===== */
	.tarjeta-log.activa {
		background-color: #cce4f7;
		outline: 2px solid #0068ce;
		outline-offset: -2px;
	}

	/* ===== FULLSCREEN ===== */
	.pantalla-reporte:fullscreen {
		display: block;
		position: relative;
		background: #000;
		overflow: hidden;
		padding: 0;
	}

	.pantalla-reporte:fullscreen > h2 {
		display: none;
	}

	.pantalla-reporte:fullscreen .video-toolbar {
		display: none;
	}

	.pantalla-reporte:fullscreen .contenido-sala {
		position: absolute;
		inset: 0;
		display: block;
	}

	.pantalla-reporte:fullscreen .panel-video {
		position: absolute;
		inset: 0;
		z-index: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pantalla-reporte:fullscreen .panel-video iframe,
	.pantalla-reporte:fullscreen .panel-video video {
		width: 100%;
		height: 100%;
		aspect-ratio: unset;
		border: none;
		border-radius: 0;
	}

	.pantalla-reporte:fullscreen .veo-loading,
	.pantalla-reporte:fullscreen .embed-bloqueado {
		width: 100%;
		height: 100%;
		aspect-ratio: unset;
	}

	/* Panel derecho flotante sobre el video (blanco) */
	.pantalla-reporte:fullscreen .panel-derecho {
		position: absolute;
		top: 24px;
		right: 24px;
		bottom: auto;
		width: min(420px, 85vw);
		max-height: calc(100% - 48px);
		z-index: 2;
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		padding: 16px;
		overflow-y: auto;
	}
</style>
