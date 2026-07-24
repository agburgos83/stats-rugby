<script lang="ts">
	import {
		INFRACCION_SKILLS,
		BALL_SKILLS,
		CONTACT_SKILLS,
		FOOT_SKILLS,
		type Skill,
		type SituacionJuego,
		type CalificacionIndividual,
		type CalificacionGrupal,
		type Player,
		type TeamAccion,
		type PropsAnalisis
	} from '$lib/types';

	import '$lib/video-types.d.ts';

	import { cocinarEnlaceVideo } from '$lib/video';

	// importadas desde el orquestador
	let {
		equipo,
		partido,
		acciones = $bindable(),
		teamAcciones = $bindable(),
		cambiarVista
	}: PropsAnalisis = $props();

	// let jugadorElegido = $state<Player | null>(null);
	let jugadoresElegidos = $state<Player[]>([]);
	let nextAccionId = 0;
	let ultimaAccionClickeada = $state<string | null>(null);
	let prevAccionesLength = $state(0);
	let puedeDeshacerIndividual = $state(false);
	let puedeDeshacerGrupal = $state(false);
	let totalAccionesIndividuales = $derived(acciones.length);
	let totalAccionesGrupales = $derived(teamAcciones.length);
	let embedPermitido = $state<boolean | null>(null);

	const urlEmbed = $derived(cocinarEnlaceVideo(partido.urlVideo));

	let veoVideoUrl = $state<string | null>(null);
	let veoLoading = $state(false);

	let videoEl = $state<HTMLVideoElement | null>(null);
	let cachedYouTubeTime = $state(0);

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

	$effect(() => {
		const url = partido.urlVideo;
		const isYT = url?.includes('youtube.com') || url?.includes('youtu.be');
		if (!isYT) return;

		const handler = (event: MessageEvent) => {
			if (event.origin !== 'https://www.youtube.com') return;
			try {
				const data = JSON.parse(event.data);
				if (data.event === 'infoDelivery' && data.info?.currentTime !== undefined) {
					cachedYouTubeTime = data.info.currentTime;
				}
			} catch {
				/* not a JSON message from YT */
			}
		};

		const sendListening = () => {
			const iframe = document.querySelector(
				'iframe[src*="youtube.com/embed"]'
			) as HTMLIFrameElement | null;
			if (iframe?.contentWindow) {
				iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
			}
		};

		window.addEventListener('message', handler);
		sendListening();
		const interval = setInterval(sendListening, 1000);
		const timeout = setTimeout(() => clearInterval(interval), 10000);

		return () => {
			window.removeEventListener('message', handler);
			clearInterval(interval);
			clearTimeout(timeout);
		};
	});

	// 1. FUNCIONES DE ACCIONES Y VIDEO

	function obtenerTiempoVideo(offset: number = 0): number | null {
		try {
			let t: number | null = null;
			if (videoEl) t = videoEl.currentTime;
			else if (
				partido.urlVideo?.includes('youtube.com') ||
				partido.urlVideo?.includes('youtu.be')
			) {
				t = cachedYouTubeTime;
			}
			if (t === null) return null;
			return Math.max(0, t - offset);
		} catch {
			return null;
		}
	}

	function registrarAccionDirecta(
		skillElegida: Skill,
		califIndividualElegida: CalificacionIndividual,
		shiftKey: boolean = false
	): void {
		if (jugadoresElegidos.length === 0) {
			alert('Primero selecciona un jugador de la grilla superior');
			return;
		}

		if (shiftKey && jugadoresElegidos.length > 1) {
			alert('Para usar Shift debe haber solo un jugador seleccionado');
			return;
		}

		prevAccionesLength = acciones.length;

		for (const j of jugadoresElegidos) {
			acciones.push({
				id: nextAccionId++,
				player: j,
				skill: skillElegida,
				calificacion: califIndividualElegida,
				videoTime: obtenerTiempoVideo(2)
			});
		}

		acciones = [...acciones];

		puedeDeshacerIndividual = true;

		if (!shiftKey) jugadoresElegidos = [];

		ultimaAccionClickeada = `${skillElegida}-${califIndividualElegida}`;

		setTimeout(() => {
			ultimaAccionClickeada = null;
		}, 300);
	}

	function registrarAccionEquipo(
		sitJuegoElegida: SituacionJuego,
		califGrupalElegida: CalificacionGrupal
	) {
		if (!sitJuegoElegida) {
			alert('Primero selecciona una situación de juego');
			return;
		}

		const nuevaTeamAccion: TeamAccion = {
			situacion: sitJuegoElegida,
			calificacion: califGrupalElegida,
			videoTime: obtenerTiempoVideo(4)
		};

		teamAcciones.push(nuevaTeamAccion);
		teamAcciones = [...teamAcciones];

		puedeDeshacerGrupal = true;

		// Activamos el flash visual
		ultimaAccionClickeada = `${sitJuegoElegida}-${califGrupalElegida}`;

		// Lo apagamos después de 300ms
		setTimeout(() => {
			ultimaAccionClickeada = null;
		}, 300);
	}

	function deshacerAccionIndividual() {
		if (!puedeDeshacerIndividual) return;
		acciones = acciones.slice(0, prevAccionesLength);
		acciones = [...acciones];
		puedeDeshacerIndividual = false;
	}

	function deshacerAccionGrupal(): void {
		if (teamAcciones.length === 0 || !puedeDeshacerGrupal) return;
		teamAcciones.pop();
		puedeDeshacerGrupal = false;
		teamAcciones = [...teamAcciones];
	}

	function limpiarAccionesIndividuales(): void {
		if (acciones.length === 0) return;
		acciones = [];
		acciones = [...acciones];
		puedeDeshacerIndividual = false;
	}

	function limpiarAccionesGrupales(): void {
		if (teamAcciones.length === 0) return;
		teamAcciones = [];
		teamAcciones = [...teamAcciones];
		puedeDeshacerGrupal = false;
	}

	function hayAccionesIndividuales(): boolean {
		return acciones.length > 0;
	}

	function hayAccionesGrupales(): boolean {
		return teamAcciones.length > 0;
	}

	function toggleJugador(p: Player, ctrlKey: boolean): void {
		if (ctrlKey) {
			if (jugadoresElegidos.some((j) => j.id === p.id)) {
				jugadoresElegidos = jugadoresElegidos.filter((j) => j.id !== p.id);
			} else {
				jugadoresElegidos = [...jugadoresElegidos, p];
			}
		} else {
			if (jugadoresElegidos.length === 1 && jugadoresElegidos[0].id === p.id) {
				jugadoresElegidos = [];
			} else {
				jugadoresElegidos = [p];
			}
		}
	}

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
</script>

<div class="pantalla-analisis">
	<!-- PANEL IZQUIERDO: REPRODUCTOR DE VIDEO -->

	<div class="bloque-paneles-izquierda">
		<div class="panel-video">
			<h2>
				Análisis {partido.local} vs {partido.visitante} ({partido.puntosLocal} - {partido.puntosVisitante})
			</h2>
			<p class="subtitulo-torneo">{partido.usuarioUnion} - {partido.division} | {partido.fecha}</p>
			{#if urlEmbed}
				{#if embedPermitido === null}
					<div class="veo-loading">Verificando disponibilidad del video…</div>
				{:else if embedPermitido}
					<iframe
						src={urlEmbed}
						title="Video Player"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
					></iframe>
				{:else}
					<div class="embed-bloqueado">
						<span>El propietario del video inhabilitó la reproducción en otros sitios web.</span>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a href={partido.urlVideo} target="_blank" rel="noopener" class="btn-primary">
							Abrir en YouTube ↗
						</a>
					</div>
				{/if}
			{:else if veoVideoUrl}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video bind:this={videoEl} src={veoVideoUrl} controls preload="metadata"></video>
			{:else if veoLoading}
				<div class="veo-loading">Cargando video de Veo…</div>
			{/if}
		</div>

		<div class="acciones-finales">
			<div class="contenedor-boton">
				<button
					disabled={!hayAccionesGrupales() && !hayAccionesIndividuales()}
					onclick={cambiarVista}
					class="btn-primary"
				>
					Terminar análisis →
				</button>
			</div>
		</div>
	</div>

	<!-- PANEL DERECHO: INTERACCIÓN Y BOTONERAS -->
	<div class="bloque-paneles-derecha">
		<!-- 1. ACCIONES INDIVIDUALES -->
		<div class="panel-interaccion">
			<div class="seccion-bloque">
				<h3>JUGADORES</h3>

				<div class="grupo-chips">
					{#each equipo as p (p.numero)}
						{#if p.player !== null}
							<button
								onclick={(e) => toggleJugador(p.player!, e.ctrlKey)}
								class:activo={jugadoresElegidos.some((j) => j.id === p.player?.id)}
								class="btn-chip"
							>
								{p.numero}. {p.player.apellido}
							</button>
						{/if}
					{/each}
				</div>
			</div>

			<div class="seccion-bloque">
				<div class="grilla-skills">
					<h3>MANEJO DE PELOTA</h3>
					<div class="grilla-tiras">
						{#each BALL_SKILLS as s (s)}
							<div class="tarjeta-skill">
								<span class="titulo-skill">{s}</span>
								<button
									disabled={jugadoresElegidos.length === 0}
									onclick={(e) => registrarAccionDirecta(s, 'Negativo', e.shiftKey)}
									class="btn-calif neg">-</button
								>
								<button
									disabled={jugadoresElegidos.length === 0}
									onclick={(e) => registrarAccionDirecta(s, 'Positivo', e.shiftKey)}
									class="btn-calif pos">+</button
								>
							</div>
						{/each}
					</div>

					<h3>JUEGO EN EL CONTACTO</h3>
					<div class="grilla-tiras">
						{#each CONTACT_SKILLS as s (s)}
							<div class="tarjeta-skill">
								{#if s === 'Tackle' || s === 'Duelo'}
									<span class="titulo-skill">{s}</span>
									<button
										disabled={jugadoresElegidos.length === 0}
										onclick={(e) => registrarAccionDirecta(s, 'Negativo', e.shiftKey)}
										class="btn-calif neg">-</button
									>
									<button
										disabled={jugadoresElegidos.length === 0}
										onclick={(e) => registrarAccionDirecta(s, 'Neutro', e.shiftKey)}
										class="btn-calif neu">=</button
									>
									<button
										disabled={jugadoresElegidos.length === 0}
										onclick={(e) => registrarAccionDirecta(s, 'Positivo', e.shiftKey)}
										class="btn-calif pos">+</button
									>
									<button
										disabled={jugadoresElegidos.length === 0}
										onclick={(e) => registrarAccionDirecta(s, 'Dominante', e.shiftKey)}
										class="btn-calif dom">++</button
									>
								{:else}
									<span class="titulo-skill">{s}</span>
									<button
										disabled={jugadoresElegidos.length === 0}
										onclick={(e) => registrarAccionDirecta(s, 'Negativo', e.shiftKey)}
										class="btn-calif neg">-</button
									>
									<button
										disabled={jugadoresElegidos.length === 0}
										onclick={(e) => registrarAccionDirecta(s, 'Positivo', e.shiftKey)}
										class="btn-calif pos">+</button
									>
								{/if}
							</div>
						{/each}
					</div>

					<h3>JUEGO CON EL PIE</h3>
					<div class="grilla-tiras">
						{#each FOOT_SKILLS as s (s)}
							<div class="tarjeta-skill">
								<span class="titulo-skill">{s}</span>
								<button
									disabled={jugadoresElegidos.length === 0}
									onclick={(e) => registrarAccionDirecta(s, 'Negativo', e.shiftKey)}
									class="btn-calif neg">-</button
								>
								<button
									disabled={jugadoresElegidos.length === 0}
									onclick={(e) => registrarAccionDirecta(s, 'Positivo', e.shiftKey)}
									class="btn-calif pos">+</button
								>
							</div>
						{/each}
					</div>

					<h3>INFRACCIONES</h3>
					<div class="grilla-tiras">
						{#each INFRACCION_SKILLS as i (i)}
							<div class="tarjeta-skill">
								<span class="titulo-skill">{i}</span>
								<button
									disabled={jugadoresElegidos.length === 0}
									onclick={(e) => registrarAccionDirecta(i, 'Positivo', e.shiftKey)}
									class="btn-calif pos">+</button
								>
							</div>
						{/each}
					</div>

					<div class="barra-herramientas">
						<span class="contador-texto"
							>Total acciones individuales: <strong>{totalAccionesIndividuales}</strong></span
						>
						<div class="grupo-botones-control">
							<button
								onclick={deshacerAccionIndividual}
								disabled={!puedeDeshacerIndividual}
								class="btn-accion-barra"
								title="Deshacer última acción"
							>
								Deshacer acción ↺
							</button>
							<button
								onclick={limpiarAccionesIndividuales}
								disabled={!hayAccionesIndividuales()}
								class="btn-accion-barra peligro"
								title="Borrar todo el historial de jugadores"
							>
								Borrar historial 🗑
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 2. ACCIONES GRUPALES -->
		<div class="panel-interaccion">
			<div class="seccion-bloque">
				<h3>SITUACIONES DE JUEGO</h3>

				<!-- Contenedor vertical que apila las 3 líneas -->
				<div class="contenedor-lineas-grupales">
					<div class="linea-grupal">
						<div class="tarjeta-situacion">
							<span class="titulo-situacion">Line propio</span>
							<button
								onclick={() => (
									registrarAccionEquipo('Line propio', 'Negativo'),
									(puedeDeshacerGrupal = true)
								)}
								class="btn-calif neg"
								class:flash={ultimaAccionClickeada === 'Line propio-Negativo'}>-</button
							>
							<button
								onclick={() => (
									registrarAccionEquipo('Line propio', 'Positivo'),
									(puedeDeshacerGrupal = true)
								)}
								class="btn-calif pos"
								class:flash={ultimaAccionClickeada === 'Line propio-Positivo'}>+</button
							>
						</div>
						<div class="tarjeta-situacion">
							<span class="titulo-situacion">Scrum propio</span>
							<button
								onclick={() => (
									registrarAccionEquipo('Scrum propio', 'Negativo'),
									(puedeDeshacerGrupal = true)
								)}
								class="btn-calif neg"
								class:flash={ultimaAccionClickeada === 'Scrum propio-Negativo'}>-</button
							>
							<button
								onclick={() => (
									registrarAccionEquipo('Scrum propio', 'Positivo'),
									(puedeDeshacerGrupal = true)
								)}
								class="btn-calif pos"
								class:flash={ultimaAccionClickeada === 'Scrum propio-Positivo'}>+</button
							>
						</div>
						<div class="tarjeta-situacion">
							<span class="titulo-situacion">Salida recibida</span>
							<button
								onclick={() => registrarAccionEquipo('Salida recibida', 'Negativo')}
								class="btn-calif neg"
								class:flash={ultimaAccionClickeada === 'Salida recibida-Negativo'}>-</button
							>
							<button
								onclick={() => registrarAccionEquipo('Salida recibida', 'Positivo')}
								class="btn-calif pos"
								class:flash={ultimaAccionClickeada === 'Salida recibida-Positivo'}>+</button
							>
						</div>

						<div class="tarjeta-situacion">
							<span class="titulo-situacion">Efectividad 22m At.</span>
							<button
								onclick={() => registrarAccionEquipo('Efect. AT. 22m', 'Negativo')}
								class="btn-calif neg"
								class:flash={ultimaAccionClickeada === 'Efect. AT. 22m-Negativo'}>-</button
							>
							<button
								onclick={() => registrarAccionEquipo('Efect. AT. 22m', 'Positivo')}
								class="btn-calif pos"
								class:flash={ultimaAccionClickeada === 'Efect. AT. 22m-Positivo'}>+</button
							>
						</div>
					</div>

					<div class="linea-grupal">
						<div class="tarjeta-situacion">
							<span class="titulo-situacion">Line rival</span>
							<button
								onclick={() => registrarAccionEquipo('Line rival', 'Negativo')}
								class="btn-calif neg"
								class:flash={ultimaAccionClickeada === 'Line rival-Negativo'}>-</button
							>
							<button
								onclick={() => registrarAccionEquipo('Line rival', 'Positivo')}
								class="btn-calif pos"
								class:flash={ultimaAccionClickeada === 'Line rival-Positivo'}>+</button
							>
						</div>
						<div class="tarjeta-situacion">
							<span class="titulo-situacion">Scrum rival</span>
							<button
								onclick={() => registrarAccionEquipo('Scrum rival', 'Negativo')}
								class="btn-calif neg"
								class:flash={ultimaAccionClickeada === 'Scrum rival-Negativo'}>-</button
							>
							<button
								onclick={() => registrarAccionEquipo('Scrum rival', 'Positivo')}
								class="btn-calif pos"
								class:flash={ultimaAccionClickeada === 'Scrum rival-Positivo'}>+</button
							>
						</div>
						<div class="tarjeta-situacion">
							<span class="titulo-situacion">Salida cargada</span>
							<button
								onclick={() => registrarAccionEquipo('Salida cargada', 'Negativo')}
								class="btn-calif neg"
								class:flash={ultimaAccionClickeada === 'Salida cargada-Negativo'}>-</button
							>
							<button
								onclick={() => registrarAccionEquipo('Salida cargada', 'Positivo')}
								class="btn-calif pos"
								class:flash={ultimaAccionClickeada === 'Salida cargada-Positivo'}>+</button
							>
						</div>

						<div class="tarjeta-situacion">
							<span class="titulo-situacion">Efectividad 22m Def.</span>
							<button
								onclick={() => registrarAccionEquipo('Efect. DEF. 22m', 'Negativo')}
								class="btn-calif neg"
								class:flash={ultimaAccionClickeada === 'Efect. DEF. 22m-Negativo'}>-</button
							>
							<button
								onclick={() => registrarAccionEquipo('Efect. DEF. 22m', 'Positivo')}
								class="btn-calif pos"
								class:flash={ultimaAccionClickeada === 'Efect. DEF. 22m-Positivo'}>+</button
							>
						</div>
					</div>
				</div>

				<div class="barra-herramientas">
					<span class="contador-texto"
						>Total acciones grupales: <strong>{totalAccionesGrupales}</strong></span
					>
					<div class="grupo-botones-control">
						<button
							onclick={deshacerAccionGrupal}
							disabled={!puedeDeshacerGrupal}
							class="btn-accion-barra"
							title="Deshacer última acción"
						>
							Deshacer acción ↺
						</button>
						<button
							onclick={limpiarAccionesGrupales}
							disabled={!hayAccionesGrupales()}
							class="btn-accion-barra peligro"
							title="Borrar todo el historial de jugadores"
						>
							Borrar historial 🗑
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.pantalla-analisis {
		display: grid;
		grid-template-columns: 1.8fr 1.2fr;
		gap: 24px;
		padding: 20px;
	}
	.panel-video h2 {
		margin-top: 0;
		margin-bottom: 0px;
		color: #1e293b;
	}

	.panel-video {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
	}

	/* Le damos proporciones firmes de pantalla de TV al reproductor */
	.panel-video iframe,
	.panel-video video {
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: 8px;
		background-color: #000;
		border: 1px solid #e2e8f0;
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
		border: 1px solid #e2e8f0;
	}

	.panel-interaccion {
		display: flex;
		flex-direction: column;
		gap: 16px;
		background-color: white;
		padding: 20px;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
	}
	.seccion-bloque h3 {
		margin: 0 0 8px 0;
		font-size: 0.95rem;
		font-weight: bold;
		color: #0068ce;
	}
	.grupo-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.bloque-paneles-derecha {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.bloque-paneles-izquierda {
		display: flex;
		flex-direction: column;
		gap: 20px;
		background-color: #f8fafc;
	}

	.contenedor-boton {
		margin-top: 12px;
	}
	.btn-chip {
		padding: 8px 12px;
		font-weight: bold;
		font-size: 0.85rem;
		border-radius: 6px;
		border: 1px solid #cbd5e1;
		background: white;
		color: #1e293b;
		cursor: pointer;
		transition: all 0.1s ease;
	}
	.btn-chip:disabled {
		background-color: #e2e8f0;
		color: #94a3b8;
		border-color: #e2e8f0;
		cursor: not-allowed;
	}
	.btn-chip.activo {
		background-color: #0068ce !important;
		color: white !important;
		border-color: #0068ce !important;
	}
	.btn-primary {
		background-color: #0068ce;
		color: white;
		border: none;
		padding: 10px 20px;
		font-size: 0.95rem;
		font-weight: bold;
		border-radius: 8px;
		cursor: pointer;
	}
	
	.btn-primary:disabled {
		background-color: #cbd5e1;
		color: #94a3b8;
		cursor: not-allowed;
	}
	.acciones-finales {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		margin-top: 8px;
		padding-top: 12px;
		border-top: 1px solid #e2e8f0;
	}
	.acciones-finales .btn-primary {
		flex: 1;
		text-align: center;
	}

	h2 {
		color: #0f172a;
		margin: 0 0 4px 0;
		font-size: 1.35rem;
		font-weight: 700;
	}

	.tarjeta-skill {
		background-color: white;
		border: 1px solid #cbd5e1;
		border-radius: 4px;
		padding: 3px 8px;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.titulo-skill {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 600;
		color: #334155;
		text-align: left;
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Botones compactos internos de las tarjetas */
	.btn-calif {
		padding: 4px 8px;
		font-size: 0.75rem;
		font-weight: bold;
		border-radius: 4px;
		border: 1px solid #cbd5e1;
		background-color: #f8fafc;
		color: #334155;
		cursor: pointer;
		text-align: center;
		transition: background-color 0.1s ease;
	}

	.btn-calif:disabled {
		background-color: #f1f5f9;
		color: #cbd5e1;
		border-color: #e2e8f0;
		cursor: not-allowed;
	}

	/* Colores suaves para identificar rápido los botones activos */
	.btn-calif.pos:not(:disabled) {
		background-color: #ecfdf5;
		color: #059669;
		border-color: #a7f3d0;
	}
	.btn-calif.neg:not(:disabled) {
		background-color: #fef2f2;
		color: #dc2626;
		border-color: #fecaca;
	}
	.btn-calif.neu:not(:disabled) {
		background-color: #f1f5f9;
		color: #475569;
		border-color: #cbd5e1;
	}
	.btn-calif.dom:not(:disabled) {
		background-color: #f0f6fd;
		color: #0068ce;
		border-color: #99c9ef;
	}

	/* Cada línea de tarjetas de situación usa misma grilla que skills */
	.linea-grupal {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
		width: 100%;
	}

	/* Tarjeta de situación con mismo aspecto compacto que tarjeta-skill */
	.tarjeta-situacion {
		background-color: white;
		border: 1px solid #cbd5e1;
		border-radius: 4px;
		padding: 3px 8px;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.titulo-situacion {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 600;
		color: #334155;
		text-align: left;
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* La clase que se inyecta temporalmente por 300ms */
	.btn-calif.flash {
		animation: pulso-flash 0.3s ease-out;
		border-color: #0068ce !important;
		box-shadow: 0 0 8px rgba(0, 104, 206, 0.5);
	}

	/* Animación que genera el cambio de color rápido */
	@keyframes pulso-flash {
		0% {
			background-color: #0068ce;
			color: white;
			transform: scale(0.95);
		}
		50% {
			background-color: #3399ee;
			color: white;
			transform: scale(1.05);
		}
		100% {
			transform: scale(1);
		}
	}

	/* 1. Modificamos el contenedor del bloque para que use Flexbox vertical */
	.seccion-bloque {
		display: flex;
		flex-direction: column;
		height: 100%; /* Obliga al bloque a usar todo el alto disponible */
	}

	.grilla-skills {
		display: flex;
		flex-direction: column;
	}

	.grilla-tiras {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
		margin-bottom: 16px;
	}

	.grilla-tiras:last-of-type {
		margin-bottom: 0;
	}

	.contenedor-lineas-grupales {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 16px;
		flex-grow: 1;
	}

	/* 3. El contenedor de los botones se pega al fondo */
	.contenedor-boton {
		margin-top: auto; /* Truco de Flexbox: empuja el contenedor al límite inferior */
		padding-top: 16px;
		display: flex;
		gap: 10px; /* Si hay dos botones (como en individual), los pone lado a lado */
	}

	.contenedor-boton .btn-primary {
		flex: 1; /* Hace que si hay dos botones, midan exactamente lo mismo */
	}

	/* Contenedor horizontal que distribuye el total a la izquierda y botones a la derecha */
	.barra-herramientas {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		background-color: #f1f5f9; /* Fondo gris claro unificado de barra */
		padding: 8px 12px;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
		box-sizing: border-box;
	}

	/* Texto del contador */
	.contador-texto {
		font-size: 0.85rem;
		color: #475569;
	}
	.contador-texto strong {
		color: #1e293b;
		font-size: 0.95rem;
	}

	/* Agrupador de los dos botones en el extremo derecho */
	.grupo-botones-control {
		display: flex;
		gap: 8px;
	}

	/* Botón estilizado de barra de herramientas */
	.btn-accion-barra {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		font-size: 0.8rem;
		font-weight: bold;
		color: #475569;
		background-color: white;
		border: 1px solid #cbd5e1;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.btn-accion-barra:hover:not(:disabled) {
		background-color: #f8fafc;
		border-color: #94a3b8;
		color: #1e293b;
	}

	/* Variación sutil para el botón de borrar historia */
	.btn-accion-barra.peligro:hover:not(:disabled) {
		background-color: #fef2f2;
		border-color: #fca5a5;
		color: #dc2626;
	}

	/* Estado grisado/deshabilitado elegante para la barra */
	.btn-accion-barra:disabled {
		background-color: transparent;
		color: #cbd5e1;
		border-color: #e2e8f0;
		cursor: not-allowed;
	}

	.embed-bloqueado {
		/* flex-direction: column; */
		display: flex;
		align-items: center;
		/* justify-content: space-between; */
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
	}
	.embed-bloqueado .btn-primary {
		white-space: nowrap;
		background: #0068ce;
		color: white;
		padding: 10px 20px;
		border-radius: 8px;
		text-decoration: none;
		font-weight: bold;
		font-size: 0.9rem;
		flex-shrink: 0;
	}
</style>
