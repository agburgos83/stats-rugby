<script lang="ts">
	import {
		type PartidoContexto,
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

	interface sala {
		id: string;
		plan: string;
		partido_json: PartidoContexto;
		acciones_json: Accion[];
		team_acciones_json: TeamAccion[];
		skills_visibles: string[];
		limites: Record<string, number>;
		expires_at: string | null;
		created_by: string | null;
	}

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

	const partido = $derived(sala.partido_json);
	const acciones = $derived(sala.acciones_json);
	const teamAcciones = $derived(sala.team_acciones_json);
	const skillsVisibles = $derived(sala.skills_visibles ?? []);
	const skillUnica = $derived(skillsAplicados.length === 1 ? skillsAplicados[0] : null);

	const mostrarFiltroJugador = $derived(
		skillUnica !== null && grupoDeSkill(skillUnica) !== 'situaciones'
	);

	const mostrarFiltroCalif = $derived(
		skillUnica !== null && !(INFRACCION_SKILLS as readonly string[]).includes(skillUnica)
	);

	// jugadores con acciones del skill único
	const jugadoresDisponibles = $derived.by(() => {
		const jugadores: Player[] = [];
		for (const a of acciones) {
			if (a.skill !== skillUnica) continue;
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

	// skills presentes entre las visibles
	const skillsDisponibles = $derived.by(() => {
		const lista: string[] = [];
		for (const item of accionesFiltradas) {
			const nombre = item.tipo === 'individual' ? item.accion.skill : item.accion.situacion;
			if (!lista.includes(nombre)) lista.push(nombre);
		}
		return lista.sort((a, b) => a.localeCompare(b, 'es'));
	});

	// aplicadas (skill + jugador)
	const accionesMostradas = $derived(
		accionesFiltradas.filter((item) => {
			const nombre = item.tipo === 'individual' ? item.accion.skill : item.accion.situacion;
			if (!skillsAplicados.includes(nombre)) return false;
			if (
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
		urlEmbed = cocinarEnlaceVideo(partido.urlVideo, { controls: false, mute: true });
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

	// 1. FUNCIONES DE ACCIONES Y VIDEO

	function seekToVideo(seconds: number | null): void {
		if (seconds === null) return;
		window.scrollTo({ top: 0, behavior: 'smooth' });
		try {
			if (videoEl) {
				videoEl.currentTime = seconds;
				videoEl.play();
			} else if (
				partido.urlVideo?.includes('youtube.com') ||
				partido.urlVideo?.includes('youtu.be')
			) {
				const iframe = document.querySelector(
					'iframe[src*="youtube.com/embed"]'
				) as HTMLIFrameElement | null;
				if (iframe?.contentWindow) {
					iframe.contentWindow.postMessage(
						JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
						'*'
					);
					iframe.contentWindow.postMessage(
						JSON.stringify({ event: 'command', func: 'playVideo' }),
						'*'
					);
				}
			}
		} catch {
			/* player no listo */
		}
	}

	function seleccionarTodas(): void {
		skillsPendientes = [...skillsDisponibles];
	}

	function limpiarFiltros(): void {
		skillsPendientes = [];
	}

	function aplicarFiltros(): void {
		if (skillsPendientes.length === 0) return;
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

<div class="pantalla-reporte">
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
					<div class="lista-scroll">
						{#each accionesMostradas as item (item)}
							{#if item.tipo === 'individual'}
								<button class="tarjeta-log" onclick={() => seekToVideo(item.accion.videoTime)}>
									<span class="badge-tiempo">{formatTime(item.accion.videoTime)}</span>
									<span>{item.accion.skill}</span>
									{#if !INFRACCION_SKILLS.some((s) => s === item.accion.skill)}
										<span class="signo">{signoDe(item.accion.calificacion)}</span>
									{/if}
								</button>
							{:else}
								<button class="tarjeta-log" onclick={() => seekToVideo(item.accion.videoTime)}>
									<span class="badge-tiempo">{formatTime(item.accion.videoTime)}</span>
									<span>{item.accion.situacion}</span>
									<span class="signo">{signoDe(item.accion.calificacion)}</span>
								</button>
							{/if}
						{/each}
					</div>
				</div>
			{:else if tabActual === 'filtros'}
				<div class="panel-filtros">
					<h3>Filtrar por destreza</h3>
					<div class="filtro-botones">
						<button onclick={() => seleccionarTodas()}>Todos</button>
						<button onclick={() => limpiarFiltros()}>Ninguno</button>
						<button
							class="primario"
							disabled={skillsPendientes.length === 0}
							onclick={() => aplicarFiltros()}>Aplicar</button
						>
					</div>
					{#each skillsDisponibles as skill (skill)}
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
		margin-top: 4px 0 12px;
	}

	.filtro-botones button {
		padding: 8px 16px;
		border: 1px solid #0068ce;
		border-radius: 6px;
		background: white;
		color: #0068ce;
		cursor: pointer;
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
</style>
