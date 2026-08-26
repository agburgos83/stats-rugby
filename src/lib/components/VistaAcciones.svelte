<script lang="ts">
	import { procesarReporte } from '$lib/processing/reporte-data';
	import { descargarPDF } from '$lib/pdf/reporte';
	import type { PropsAcciones, ModalidadClave } from '$lib/types';
	import { INFRACCION_SKILLS, CONTACT_SKILLS, BALL_SKILLS, FOOT_SKILLS } from '$lib/types';
	import {
		cocinarEnlaceVideo,
		formatTime,
		extraerYouTubeId,
		chequearEmbedYouTube,
		obtenerVideoVeo
	} from '$lib/video';
	import '$lib/video-types.d.ts';
	import { LIMITES_FREE, grupoDeSkill, SITUACIONES, type GrupoClave } from '$lib/planes';
	import { MODO_FULL } from '$lib/mode';
	import { SvelteSet } from 'svelte/reactivity';
	import { logError } from '$lib/debug';

	let {
		equipo,
		partido,
		acciones,
		teamAcciones,
		confirmarFinalizar,
		onCancelarFinalizar,
		onConfirmarFinalizar,
		modalidad
	} = $props<PropsAcciones & { modalidad: ModalidadClave }>();

	let generando = $state(false);
	let errorMsg = $state('');
	let creandoSala = $state(false);
	let salaError = $state('');
	let salaUrl = $state('');
	let salaCreada = $state(false);
	let salaYaExistia = $state(false);
	let chequeandoSala = $state(false);
	let copiado = $state(false);
	let pasoSala = $state<'cerrado' | 'elegir' | 'lista'>('cerrado');
	let skillsSala = $state<string[]>([]); // nada marcado al abrir
	let embedPermitido = $state<boolean | null>(null);
	let veoVideoUrl = $state<string | null>(null);
	let veoLoading = $state(false);
	let videoEl = $state<HTMLVideoElement | null>(null);
	// eslint-disable-next-line svelte/prefer-writable-derived
	let urlEmbed = $state<string | null>(null);

	const skillsRegistradas = $derived.by(() => {
		const set = new SvelteSet<string>();
		for (const a of acciones) set.add(a.skill);
		for (const ta of teamAcciones) set.add(ta.situacion);
		return set;
	});

	const gruposModal = $derived([
		{ etiqueta: 'Contacto', skills: [...CONTACT_SKILLS].sort((a, b) => a.localeCompare(b)) },
		{ etiqueta: 'Pelota', skills: [...BALL_SKILLS].sort((a, b) => a.localeCompare(b)) },
		{ etiqueta: 'Pie', skills: [...FOOT_SKILLS].sort((a, b) => a.localeCompare(b)) },
		{ etiqueta: 'Infracciones', skills: [...INFRACCION_SKILLS].sort((a, b) => a.localeCompare(b)) },
		{
			etiqueta: 'Situaciones de juego',
			skills: [...SITUACIONES].sort((a, b) => a.localeCompare(b))
		}
	]);

	$effect(() => {
		urlEmbed = cocinarEnlaceVideo(partido.urlVideo);
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

	function contarEnGrupo(grupo: GrupoClave): number {
		return skillsSala.filter((s) => grupoDeSkill(s) === grupo).length;
	}

	async function generarReporte(): Promise<void> {
		generando = true;
		errorMsg = '';
		try {
			const { matrizProcesada, dixTotales } = procesarReporte(equipo, acciones, teamAcciones);
			await descargarPDF(equipo, partido, matrizProcesada, dixTotales, modalidad);
		} catch (e) {
			errorMsg =
				'Error al generar el PDF: ' + (e instanceof Error ? e.message : 'error desconocido');
		} finally {
			generando = false;
		}
	}

	// 1. FUNCIONES DE ACCIONES Y VIDEO

	function seekToVideo(seconds: number | null): void {
		if (seconds === null) return;
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

	async function crearSala(): Promise<void> {
		creandoSala = true;
		salaError = '';
		try {
			const res = await fetch('/api/sala', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					partido,
					acciones,
					teamAcciones,
					skillsVisibles: skillsSala
				})
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'No se pudo crear la sala');
			salaUrl = window.location.origin + data.url;
			copiado = false;
			pasoSala = 'lista';
		} catch (e) {
			salaError =
				'Error al crear la sala: ' + (e instanceof Error ? e.message : 'error desconocido');
		} finally {
			creandoSala = false;
			salaCreada = true;
		}
	}

	async function copiarLink(): Promise<void> {
		try {
			await navigator.clipboard.writeText(salaUrl);
			copiado = true;
		} catch {
			copiado = false;
		}
	}

	function toggleSkill(nombre: string) {
		if (skillsSala.includes(nombre)) skillsSala = skillsSala.filter((s) => s !== nombre);
		else skillsSala = [...skillsSala, nombre];
	}

	function deshabilitado(s: string): boolean {
		if (!skillsRegistradas.has(s)) return true;
		if (skillsSala.includes(s)) return false;
		if (MODO_FULL) return false;
		const grupo = grupoDeSkill(s);
		if (grupo === null) return true;
		return contarEnGrupo(grupo) >= LIMITES_FREE[grupo];
	}

	async function abrirSeleccion() {
		// Si ya tenemos URL en memoria, ir directo
		if (salaCreada && salaUrl) {
			pasoSala = 'lista';
			return;
		}

		// Chequear server-side si ya existe una sala para este análisis
		chequeandoSala = true;
		salaError = '';
		try {
			const res = await fetch('/api/sala/check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ partido, acciones, teamAcciones })
			});
			const data = await res.json();

			if (data.existente) {
				// Ya existe → ir directo al modal con la URL
				salaUrl = window.location.origin + data.url;
				salaYaExistia = true;
				salaCreada = true;
				pasoSala = 'lista';
			} else {
				// No existe → abrir modal de selección de skills
				pasoSala = 'elegir';
			}
		} catch {
			// Si falla el chequeo, abrir modal de todos modos
			pasoSala = 'elegir';
		} finally {
			chequeandoSala = false;
		}
	}
</script>

<div class="pantalla-reporte">
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
			<video bind:this={videoEl} src={veoVideoUrl} controls preload="metadata"
				><track kind="captions" /></video
			>
		{:else if veoLoading}
			<div class="veo-loading">Cargando video…</div>
		{/if}
	</div>

	<!-- DERECHA: 2 columnas de acciones -->
	<div class="panel-acciones">
		<div class="columna-historial">
			<h3>Acciones individuales</h3>
			<div class="lista-scroll">
				{#each acciones as a (a)}
					<button class="tarjeta-log" onclick={() => seekToVideo(a.videoTime)}>
						<span class="badge-tiempo">{formatTime(a.videoTime)}</span>
						<span>{a.skill}</span>
					</button>
				{/each}
			</div>
		</div>
		<div class="columna-historial">
			<h3>Situaciones de juego</h3>
			<div class="lista-scroll">
				{#each teamAcciones as ta (ta)}
					<button class="tarjeta-log" onclick={() => seekToVideo(ta.videoTime)}>
						<span class="badge-tiempo">{formatTime(ta.videoTime)}</span>
						<span>{ta.situacion}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- panel de operaciones -->
	<div class="panel-operaciones">
		{#if errorMsg}
			<p class="alerta-error">{errorMsg}</p>
		{/if}

		<!-- las 3 tarjetas -->
		<div class="tarjeta-op">
			<h3>Reporte PDF</h3>
			<p>Estadísticas completas del partido para compartir.</p>
			<button onclick={generarReporte} disabled={generando} class="btn-primary">
				{generando ? 'Generando...' : 'Descargar PDF'}
			</button>
		</div>

		<div class="tarjeta-op">
			<h3>Sala de clips</h3>
			<p>Link para que tu equipo vea cada acción registrada con su video.</p>
			<button onclick={abrirSeleccion} disabled={creandoSala || chequeandoSala} class="btn-primary">
				{creandoSala ? 'Creando...' : chequeandoSala ? 'Chequeando...' : 'Compartir sala'}
			</button>
		</div>

		{#if confirmarFinalizar}
			<div class="modal-overlay" role="dialog" aria-modal="true">
				<div class="modal modal-chico">
					<h3>¡Atención!</h3>
					<p class="modal-sub">Si finalizás se perderá tu análisis.</p>
					<p class="modal-sub">
						Asegurate de haber creado la sala de clips y descargado el reporte del partido.
					</p>
					<div class="modal-botones">
						<button onclick={onCancelarFinalizar} class="btn-cerrar">Cancelar</button>
						<button onclick={onConfirmarFinalizar} class="btn-primary">Confirmar</button>
					</div>
				</div>
			</div>
		{/if}
	</div>

	{#if pasoSala === 'elegir'}
		<div class="modal-overlay" role="dialog" aria-modal="true">
			<div class="modal">
				<h3>Elegí qué acciones entran a la sala</h3>
				<!-- <p class="modal-sub">
					Topes del plan free: 2 de contacto, 2 de pelota, 1 de pie, 1 de infracción y 2 situaciones
					de juego.
				</p> -->
				<div class="modal-lista">
					{#each gruposModal as grupo (grupo.etiqueta)}
						<div class="columna-grupo">
							<h4>{grupo.etiqueta}</h4>
							{#each grupo.skills as skill (skill)}
								<label class="filtro-skill" class:sin-acciones={!skillsRegistradas.has(skill)}>
									<input
										type="checkbox"
										checked={skillsSala.includes(skill)}
										disabled={deshabilitado(skill)}
										onchange={() => {
											toggleSkill(skill);
										}}
									/>
									{skill}
								</label>
							{/each}
						</div>
					{/each}
				</div>

				{#if salaError}
					<p class="alerta-error">{salaError}</p>
				{/if}

				<div class="modal-leyendas">
					{#if !MODO_FULL}
						<p class="modal-sub">
							<strong>Topes de acciones plan FREE:</strong>
						</p>
						<p class="modal-sub">
							2 de contacto, 2 de pelota, 1 de pie, 1 infracción y 2 situaciones de juego.
						</p>
					{/if}
					<p class="modal-sub leyenda-gris">
						<!-- <span class="muestra-gris"></span> -->
						<em>Las acciones que no hayas registrado en el análisis que no se pueden incluir.</em>
					</p>
				</div>

				<div class="modal-botones">
					<button onclick={() => (pasoSala = 'cerrado')} class="btn-cerrar">Cancelar</button>
					<button
						onclick={crearSala}
						disabled={skillsSala.length === 0 || creandoSala}
						class="btn-primary"
					>
						{creandoSala ? 'Creando...' : 'Crear sala'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if pasoSala === 'lista'}
		<div class="modal-overlay" role="dialog" aria-modal="true">
			<div class="modal">
				<h3>Sala creada</h3>

				{#if salaYaExistia}
					<p class="modal-sub">Este análisis ya tenía una sala. Compartí el mismo link.</p>
				{:else}
					<p class="modal-sub">Compartí este enlace con tu equipo.</p>
					{#if !MODO_FULL}
						<p class="modal-sub">Expira en 72 hs (plan free).</p>
					{/if}
				{/if}

				<input
					class="modal-link"
					readonly
					value={salaUrl}
					onfocus={(e) => e.currentTarget.select()}
				/>

				<div class="modal-botones">
					<a href={salaUrl} target="_blank" rel="external noopener" class="btn-secundario"
						>Abrir sala</a
					>
					<button onclick={copiarLink} class="btn-primary">
						{copiado ? '¡Copiado!' : 'Copiar link'}
					</button>
					<button onclick={() => (pasoSala = 'cerrado')} class="btn-cerrar">Cerrar</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* ===== LAYOUT ===== */
	.pantalla-reporte {
		display: grid;
		grid-template-columns: 1.8fr 1.2fr;
		gap: 24px;
		padding: 20px;
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

	/* ===== COLUMNAS DE ACCIONES ===== */
	.panel-acciones {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.columna-historial {
		background-color: white;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 16px;
		display: flex;
		flex-direction: column;
	}

	.columna-historial h3 {
		font-size: 1.1rem;
		font-weight: 700;
		color: #334155;
		margin-top: 0;
		margin-bottom: 16px;
		border-bottom: 1px solid #f1f5f9;
		padding-bottom: 8px;
	}

	.lista-scroll {
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

	/* ===== PANEL DE OPERACIONES ===== */
	.panel-operaciones {
		grid-column: 1 / -1;
		display: flex;
		gap: 16px;
		justify-content: center;
	}

	.tarjeta-op {
		margin-top: 24px;
		flex: 1;
		max-width: 340px; /* acotado: nunca ocupan todo el ancho */
		background-color: white;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.tarjeta-op h3 {
		margin: 0;
		font-size: 1.05rem;
		color: #0f172a;
		font-weight: 700;
	}

	.tarjeta-op p {
		margin: 0;
		font-size: 0.85rem;
		color: #64748b;
		flex: 1;
	}

	.tarjeta-op .btn-primary {
		align-self: center;
		margin-top: 8px;
	}

	/* ===== BOTONES ===== */
	.btn-primary {
		background-color: #0068ce;
		color: white;
		border: none;
		padding: 12px 24px;
		font-size: 1rem;
		font-weight: bold;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.1s ease;
	}

	.btn-primary:hover {
		background-color: #0050a0;
	}

	.btn-secundario {
		background-color: white;
		color: #0068ce;
		border: 1px solid #0068ce;
		padding: 12px 24px;
		font-size: 1rem;
		font-weight: bold;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.1s ease;
		text-decoration: none;
	}

	.btn-secundario:hover {
		background-color: #f0f6fd;
	}

	.btn-cerrar {
		background-color: transparent;
		color: #64748b;
		border: none;
		padding: 12px 16px;
		font-size: 1rem;
		cursor: pointer;
	}

	/* ===== MODAL ===== */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(15, 23, 42, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
	}

	.modal {
		background-color: white;
		border-radius: 10px;
		padding: 24px;
		width: 960px;
		max-width: 95vw;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.modal h3 {
		margin: 0;
		font-size: 1.2rem;
		color: #0f172a;
		font-weight: 700;
	}

	.modal-sub {
		margin: 0;
		color: #64748b;
		font-size: 0.9rem;
	}

	.modal-link {
		width: 100%;
		box-sizing: border-box;
		padding: 10px 12px;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		font-family: monospace;
		font-size: 0.85rem;
		color: #0068ce;
		background-color: #f0f6fd;
	}

	.modal-botones {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		align-items: center;
	}

	.modal-chico {
		max-width: 420px;
	}

	.modal-lista {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 12px;
		max-height: 420px;
		overflow-y: auto;
	}

	.columna-grupo {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.columna-grupo h4 {
		margin: 0 0 6px 0;
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		color: #0068ce;
	}

	.filtro-skill {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.9rem;
		color: #1e293b;
		cursor: pointer;
		user-select: none;
	}

	.filtro-skill.sin-acciones {
		color: #cbd5e1;
		cursor: not-allowed;
	}

	.modal-leyendas {
		display: flex;
		flex-direction: column;
		gap: 6px;
		border-top: 1px solid #f1f5f9;
		padding-top: 12px;
	}

	.leyenda-gris {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	/* ===== UTILIDADES ===== */
	.alerta-error {
		color: #dc2626;
		font-size: 0.85rem;
		margin-top: 8px;
	}
</style>
