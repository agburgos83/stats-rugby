<script lang="ts">
	// 1. Defino tipos y datos fijos

	interface Props {
		urlVideo: string;
		equipo: Puesto[];
		cambiarVista: () => void;
	}

	type Accion = {
		timestamp: number;
		player: Player;
		skill: Skill;
		calificacion: Calificacion;
	};

	type TeamAccion = {
		timestamp: number;
		situacion: SituacionJuego;
		calificacion: CalificacionGrupal;
	};

	type Player = {
		id: number;
		nombre: string;
		apellido: string;
		posicion: string;
		categoria: string;
	};

	type Puesto = {
		player: Player | null;
		numero: number;
		posicionOriginal: string;
	};

	const LISTADO_SKILLS = [
		'Duelo',
		'Tackle',
		'Pase',
		'Ruck',
		'Pesca',
		'Contra ruck',
		'Recepción',
		'Intercepción',
		'Patada',
		'Drop',
		'Palos',
		'Salida',
		'Lanzamiento line'
	] as const;

	const SKILLS_CON_NEUTRO = ['Tackle', 'Duelo'];

	const LISTADO_CALIFICACIONES_SKILLS = ['Negativo', 'Neutro', 'Positivo'] as const;
	const LISTADO_CALIFICACIONES_GRUPALES = ['Negativo', 'Neutro', 'Positivo'] as const;

	const LISTADO_SITUACIONES_JUEGO = [
		'Scrum propio',
		'Line propio',
		'Salida recibida',
		'Scrum rival',
		'Line rival',
		'Salida cargada',
		'Puntos en ZD'
	] as const;

	type Skill = (typeof LISTADO_SKILLS)[number];
	type Calificacion = (typeof LISTADO_CALIFICACIONES_SKILLS)[number];
	type CalificacionGrupal = (typeof LISTADO_CALIFICACIONES_GRUPALES)[number];
	type SituacionJuego = (typeof LISTADO_SITUACIONES_JUEGO)[number];

	// 2. Defino el estado en memoria

	let acciones = $state<Accion[]>([]);
	let teamAcciones = $state<TeamAccion[]>([]);
	let jugadorElegido = $state<Player | null>(null);
	let skillElegido = $state<Skill | null>(null);
	let sitJuegoElegida = $state<SituacionJuego | null>(null);
	let califIndividualElegida = $state<Calificacion | null>(null);
	let califGrupalElegida = $state<Calificacion | null>(null);
	let { urlVideo = $bindable(), cambiarVista, equipo = $bindable() }: Props = $props();

	// funciones locas

	// FUNCIÓN AUXILIAR: Transforma links normales en links aptos para IFRAME
	// function formatearUrlParaIframe(url: string): string {
	// 	if (!url) return '';

	// 	// CASO YOUTUBE: Captura si es watch?v=, live/, shorts/ o youtu.be/
	// 	if (url.includes('youtube.com') || url.includes('youtu.be')) {
	// 		let videoId = '';

	// 		if (url.includes('watch?v=')) {
	// 			videoId = url.split('watch?v=')[1].split('&')[0];
	// 		} else if (url.includes('/live/')) {
	// 			videoId = url.split('/live/')[1].split('?')[0];
	// 		} else if (url.includes('youtu.be/')) {
	// 			videoId = url.split('youtu.be/')[1].split('?')[0];
	// 		}

	// 		return `https://youtube.com{videoId}`;
	// 	}

	// 	// CASO VEO: Si el analista pega el link normal de app.veo.co, lo redirigimos a su reproductor embebido público
	// 	if (url.includes('veo.co') && url.includes('/matches/')) {
	// 		// Cambiamos 'app.veo.co' por 'live.veo.co' o el formato embed que te dé su plataforma
	// 		return url.replace('app.veo.co', 'live.veo.co');
	// 	}

	// 	// Si es otra plataforma o ya viene formateada, la dejamos pasar limpia
	// 	return url;
	// }

	function confirmarAccionJugador(): void {
		if (!jugadorElegido || !skillElegido || !califIndividualElegida) return;

		const accion: Accion = {
			player: jugadorElegido,
			skill: skillElegido,
			calificacion: califIndividualElegida,
			timestamp: Date.now()
		};

		jugadorElegido = null;
		skillElegido = null;
		califIndividualElegida = null;

		acciones.push(accion);
	}

	function confirmarAccionEquipo(): void {
		if (!sitJuegoElegida || !califGrupalElegida) return;

		const accion: TeamAccion = {
			situacion: sitJuegoElegida,
			calificacion: califGrupalElegida,
			timestamp: Date.now()
		};

		sitJuegoElegida = null;
		califGrupalElegida = null;

		teamAcciones.push(accion);
	}

	function deshacerAccionJugador(): void {
		if (!acciones) return;
		acciones.pop();
		jugadorElegido = null;
		skillElegido = null;
		califIndividualElegida = null;
		acciones = [...acciones];
	}

	function deshacerAccionEquipo(): void {
		if (!teamAcciones) return;
		teamAcciones.pop();
		sitJuegoElegida = null;
		califIndividualElegida = null;
		teamAcciones = [...teamAcciones];
	}

	function hayPilaAcciones(): boolean {
		return acciones.length !== null || teamAcciones.length !== null;
	}
</script>

<div class="pantalla-analisis">
	<div class="panel-video">
		<h2>Video del partido</h2>
		<iframe
			src={urlVideo}
			title="Video Player"
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen
		></iframe>
	</div>

	<div class="contenedor-boton">
		<button disabled={hayPilaAcciones()} onclick={cambiarVista} class="btn-primary">
			← Finalizar análisis
		</button>
	</div>

	<!-- panel acciones individuales -->
	<div class="bloque-paneles-derecha">
		<div class="panel-interaccion">
			<div class="seccion-bloque">
				<h3>Jugadores</h3>
				{#each equipo as p (p.numero)}
					{#if p.player !== null}
					<button
							onclick={() => (jugadorElegido = p.player)}
							disabled={sitJuegoElegida !== null ||
								(jugadorElegido !== null && jugadorElegido.id !== p.player.id)}
							class:activo={jugadorElegido?.id === p.player.id}
							class="btn-chip">{p.player.apellido}</button
						>
					{/if}
				{/each}
			</div>

			<div class="seccion-bloque">
				<h3>Acción individual</h3>
				{#each LISTADO_SKILLS as s (s)}
					<button
						onclick={() => (skillElegido = s)}
						disabled={jugadorElegido === null || (skillElegido !== null && skillElegido !== s)}
						class:activo={skillElegido === s}
						class="btn-chip">{s}</button
					>
				{/each}
			</div>

			<div class="seccion-bloque">
				<h3>Calificación</h3>
				{#each LISTADO_CALIFICACIONES_SKILLS as c (c)}
					<button
						onclick={() => (califIndividualElegida = c)}
						disabled={jugadorElegido === null || skillElegido === null}
						class:activo={califIndividualElegida === c}
						class="btn-chip">{c}</button
					>
				{/each}

			<div class="acciones-finales">
				<button onclick={deshacerAccionJugador} disabled={acciones.length === 0} class="btn-primary" style="padding: 8px 16px;">
					Deshacer
				</button>
				<button
					onclick={confirmarAccionJugador}
					disabled={jugadorElegido === null ||
						skillElegido === null ||
						califIndividualElegida === null}
					class="btn-primary"
				>
					Confirmar
				</button>
			</div>
			</div>
		</div>

		<!-- panel acciones grupales -->
		<div class="panel-interaccion">
			<!-- 3. ACCIONES GRUPALES (Toggleable) -->
			<div class="seccion-bloque">
				<h3>Acciones grupales</h3>
				{#each LISTADO_SITUACIONES_JUEGO as sj (sj)}
					<button
						onclick={() => (sitJuegoElegida = sj)}
						disabled={jugadorElegido !== null ||
							(sitJuegoElegida !== null && sitJuegoElegida !== sj)}
						class:activo={sitJuegoElegida === sj}
						class="btn-chip">{sj}</button
					>
				{/each}
			</div>

			<!-- 4. CALIFICACIÓN GRUPAL INDEPENDIENTE -->
			<div class="seccion-bloque">
				<h3>Calificación</h3>
				{#each LISTADO_CALIFICACIONES_GRUPALES as c (c)}
					{#if c !== 'Neutro' || (sitJuegoElegida && SKILLS_CON_NEUTRO.includes(sitJuegoElegida))}
						<button
							onclick={() => (califGrupalElegida = califGrupalElegida === c ? null : c)}
							disabled={sitJuegoElegida === null}
							class:activo={califGrupalElegida === c}
							class="btn-chip">{c}</button
						>
					{/if}
				{/each}
			</div>

			<div class="acciones-finales">
				<button onclick={deshacerAccionEquipo} disabled={teamAcciones.length === 0} class="btn-primary" style="padding: 8px 16px;"
					>Deshacer</button
				>
				<button
					onclick={confirmarAccionEquipo}
					disabled={sitJuegoElegida === null || califGrupalElegida === null}
					class="btn-primary">Confirmar</button
				>
			</div>
		</div>
	</div>
</div>

<style>
	/* Contenedor principal en formato Grid */
	.pantalla-analisis {
		display: grid;
		grid-template-columns: 1.8fr 1.2fr; /* 2/3 aproximado video, 1/3 panel */
		gap: 24px;
		padding: 20px;
		font-family: sans-serif;
	}

	.panel-video h2 {
		margin-top: 0;
		margin-bottom: 12px;
		color: #1e293b;
	}

	/* Panel de botones agrupado */
	.panel-interaccion {
		display: flex;
		flex-direction: column;
		gap: 20px;
		background-color: #f8fafc;
		padding: 16px;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
	}

	.seccion-bloque {
		margin: 0 0 10px 0;
		font-size: 0.95rem;
		font-weight: bold;
		/* color: #475569; */
		color: #212831;
		/* border-bottom: 2px solid #cbd5e1; */
		padding-bottom: 4px;
	}

	.bloque-paneles-derecha {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.contenedor-boton {
		margin-bottom: 12px;
	}

	/* Chips de selección */
	.btn-chip {
		padding: 8px 12px;
		margin: 4px;
		font-weight: bold;
		font-size: 0.9rem;
		border-radius: 6px;
		border: 1px solid #cbd5e1;
		background: white;
		color: #1e293b;
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.btn-chip:disabled {
		background-color: #cbd5e1;
		color: #94a3b8;
		border-color: #cbd5e1;
		cursor: not-allowed;
	}

	.btn-chip.activo {
		background-color: #2563eb !important;
		color: white !important;
		border-color: #2563eb !important;
	}

	/* Botones de acción primarios */
	.btn-primary {
		background-color: #2563eb;
		color: white;
		border: none;
		padding: 12px 24px;
		font-size: 1rem;
		font-weight: bold;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-primary:hover {
		background-color: #1d4ed8;
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
		margin-top: 16px;
		padding-top: 12px;
		border-top: 1px solid #e2e8f0;
	}

	.acciones-finales .btn-primary {
		flex: 1;
		text-align: center;
	}
</style>
