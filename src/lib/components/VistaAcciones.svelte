<script lang="ts">
	import { procesarReporte } from '$lib/processing/reporte-data';
	import { descargarPDF } from '$lib/pdf/reporte';
	import type { PropsAcciones, ModalidadClave } from '$lib/types';
	import { INFRACCION_SKILLS } from '$lib/types';
	import { cocinarEnlaceVideo, formatTime } from '$lib/video';
	import '$lib/video-types.d.ts';

	let { equipo, partido, acciones, teamAcciones, cambiarVista, modalidad } = $props<
		PropsAcciones & { modalidad: ModalidadClave }
	>();

	let generando = $state(false);
	let errorMsg = $state('');

	let embedPermitido = $state<boolean | null>(null);
	let veoVideoUrl = $state<string | null>(null);
	let veoLoading = $state(false);
	let videoEl = $state<HTMLVideoElement | null>(null);

	const urlEmbed = $derived(cocinarEnlaceVideo(partido.urlVideo));

	$effect(() => {
		const url = partido.urlVideo;
		if (!url) {
			embedPermitido = null;
			return;
		}

		// Extraer ID de YouTube
		// eslint-disable-next-line no-useless-assignment
		let videoId = '';
		if (url.includes('watch?v=')) videoId = url.split('watch?v=')[1].split('&')[0];
		else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
		else {
			embedPermitido = true;
			return;
		} // no es YT, asumir permitido

		if (!videoId) {
			embedPermitido = true;
			return;
		}

		embedPermitido = null; // loading
		fetch(
			`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
		)
			.then((r) => {
				embedPermitido = r.ok;
			})
			.catch(() => {
				embedPermitido = true;
			}); // si falla la consulta, asumir permitido
	});

	$effect(() => {
		const url = partido.urlVideo;
		if (url && url.includes('veo.co') && url.includes('app.veo.co')) {
			veoLoading = true;
			veoVideoUrl = null;
			const slug = url.replace(/\/$/, '').split('/').pop() || '';
			fetch(`/api/veo-video?slug=${encodeURIComponent(slug)}`)
				.then((r) => r.json())
				.then((data) => {
					if (data.videoUrl) veoVideoUrl = data.videoUrl;
					else console.error('Veo API error:', data.error);
				})
				.catch((e) => console.error('Error fetching Veo video:', e))
				.finally(() => (veoLoading = false));
		} else {
			veoVideoUrl = null;
			veoLoading = false;
		}
	});

	async function generarReporte(): Promise<void> {
		generando = true;
		errorMsg = '';
		try {
			const { matrizProcesada, dixTotales } = procesarReporte(equipo, acciones, teamAcciones);
			await descargarPDF(equipo, partido, matrizProcesada, dixTotales, modalidad);
			cambiarVista();
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

	function colorCalificacion(skill: string, calificacion: string): string {
		if ((INFRACCION_SKILLS as readonly string[]).includes(skill)) return 'negativa';
		if (calificacion === 'Positivo' || calificacion === 'Dominante'  || (calificacion === 'Neutro' && skill === 'Tackle')) return 'positiva';
		if (calificacion === 'Negativo') return 'negativa';
		if (calificacion === 'Neutro' && skill === 'Duelo') return 'negativa';
		return '';
	}
</script>

<div class="pantalla-reporte">
	<h2>Resumen de acciones {partido.local} vs {partido.visitante}</h2>

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
			<video bind:this={videoEl} src={veoVideoUrl} controls preload="metadata"></video>
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
					<button
						class="tarjeta-log"
						class:positiva={colorCalificacion(a.skill, a.calificacion) === 'positiva'}
						class:negativa={colorCalificacion(a.skill, a.calificacion) === 'negativa'}
						onclick={() => seekToVideo(a.videoTime)}
					>
						<span class="badge-tiempo">{formatTime(a.videoTime)}</span>
						<span class="badge-tiempo">{a.skill}</span>
					</button>
				{/each}
			</div>
		</div>
		<div class="columna-historial">
			<h3>Situaciones de juego</h3>
			<div class="lista-scroll">
				{#each teamAcciones as ta (ta)}
					<button
						class="tarjeta-log"
						class:positiva={ta.calificacion === 'Positivo'}
						class:negativa={ta.calificacion === 'Negativo'}
						onclick={() => seekToVideo(ta.videoTime)}
					>
						<span class="badge-tiempo">{formatTime(ta.videoTime)}</span>
						<span class="badge-tiempo">{ta.situacion}</span>
					</button>
					{#if errorMsg}
						<p class="alerta-error">{errorMsg}</p>
					{/if}
				{/each}
			</div>
		</div>
	</div>

	<div class="contenedor-acciones-pie">
		<button onclick={generarReporte} disabled={generando} class="btn-primary">
			{generando ? 'Generando PDF...' : 'Descargar Reporte PDF →'}
		</button>
	</div>
</div>

<style>
	.badge-tiempo {
		background-color: black;
		color: #0068ce;
		font-family: monospace;
		font-weight: bold;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.8rem;
		min-width: 72px; /* H:MM:SS siempre cabe */
		text-align: right; /* alineado a derecha */
	}

	.tarjeta-log.positiva {
		/* background-color: #f0fdf4; */
		background-color: #357c4a;
		/* border-left: 3px solid #16a34a; */
	}

	.tarjeta-log.negativa {
		/* background-color: #fef2f2; */
		background-color: #a13838;
		/* border-left: 3px solid #dc2626; */
	}

	.tarjeta-log.positiva:hover {
		/* background-color: #dcfce7; */
		background-color: #438055;
	}

	.tarjeta-log.negativa:hover {
		/* background-color: #fee2e2; */
		background-color: #a14747;
	}

	.alerta-error {
		color: #dc2626;
		font-size: 0.85rem;
		margin-top: 8px;
	}
	.pantalla-reporte {
		display: grid;
		grid-template-columns: 1.8fr 1.2fr;
		gap: 24px;
		padding: 20px;
	}

	.pantalla-reporte h2 {
		grid-column: 1 / -1;
	}

	.panel-video iframe,
	.panel-video video {
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: 8px;
		background-color: #000;
	}

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
		background-color: white;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 10px 12px;
		font-size: 0.85rem;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
		cursor: pointer;
		transition: background-color 0.1s ease;
		border: none;
		text-align: left;
		width: 100%;
		font-family: inherit;
	}

	.tarjeta-log:hover {
		background-color: #f0f6fd;
		border-color: #99c9ef;
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

	.badge-tiempo {
		background-color: #f0f6fd;
		color: #0068ce;
		font-family: monospace;
		font-weight: bold;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.8rem;
		min-width: 45px;
		text-align: center;
	}

	.contenedor-acciones-pie {
		grid-column: 1 / -1;
		display: flex;
		justify-content: flex-end;
	}

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
</style>
