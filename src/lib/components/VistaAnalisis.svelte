<script lang="ts">
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
	const LISTADO_CALIFICACIONES_GRUPALES = ['Negativo', 'Positivo'] as const; // Grupal directo sin Neutro

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

	let acciones = $state<Accion[]>([]);
	let teamAcciones = $state<TeamAccion[]>([]);
	let jugadorElegido = $state<Player | null>(null);
	let skillElegido = $state<Skill | null>(null);
	let sitJuegoElegida = $state<SituacionJuego | null>(null);
	let califIndividualElegida = $state<Calificacion | null>(null);
	let califGrupalElegida = $state<CalificacionGrupal | null>(null);
	let { urlVideo = $bindable(), cambiarVista, equipo = $bindable() }: Props = $props();
	const urlEmbed = $derived(cocinarEnlaceVideo(urlVideo));

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
		acciones = [...acciones, accion];
	}

	function confirmarAccionEquipo(): void {
		if (!sitJuegoElegida || !califGrupalElegida) return;

		const teamAccion: TeamAccion = {
			situacion: sitJuegoElegida,
			calificacion: califGrupalElegida,
			timestamp: Date.now()
		};

		sitJuegoElegida = null;
		califGrupalElegida = null;
		teamAcciones = [...teamAcciones, teamAccion];
	}

	function deshacerAccionJugador(): void {
		if (acciones.length === 0) return;
		acciones.pop();
		jugadorElegido = null;
		skillElegido = null;
		califIndividualElegida = null;
		acciones = [...acciones];
	}

	function deshacerAccionEquipo(): void {
		if (teamAcciones.length === 0) return;
		teamAcciones.pop();
		sitJuegoElegida = null;
		califGrupalElegida = null; // Corregido: antes limpiaba la individual
		teamAcciones = [...teamAcciones];
	}

	function hayPilaAcciones(): boolean {
		return acciones.length > 0 || teamAcciones.length > 0;
	}

	function cocinarEnlaceVideo(enlace: string): string {
		if (!enlace) return '';

		// Si ya viene formateada con embed, pasa directo
		if (enlace.includes('/embed/') || enlace.includes('://vimeo.com')) {
			return enlace;
		}

		// CASO YOUTUBE
		if (enlace.includes('youtube.com') || enlace.includes('youtu.be')) {
			let codigoFinal = '';

			if (enlace.includes('watch?v=')) {
				// [.split('watch?v=')[1]] extrae el ID, y el [.split('&')[0]] limpia parámetros extras
				codigoFinal = enlace.split('watch?v=')[1].split('&')[0];
			} else if (enlace.includes('youtu.be/')) {
				codigoFinal = enlace.split('youtu.be/')[1].split('?')[0];
			} else if (enlace.includes('/shorts/')) {
				codigoFinal = enlace.split('/shorts/')[1].split('?')[0];
			} else if (enlace.includes('/live/')) {
				codigoFinal = enlace.split('/live/')[1].split('?')[0];
			}

			// Si logramos sacar el ID, armamos la URL de embed oficial
			return codigoFinal ? 'https://youtube.com/embed/' + codigoFinal : enlace;
		}

		// CASO VEO (app.veo.co -> embed.veo.co)
		if (enlace.includes('veo.co') && enlace.includes('app.veo.co')) {
			return enlace.replace('app.veo.co', 'embed.veo.co');
		}

		return enlace;
	}
</script>

<div class="pantalla-analisis">
	<div class="panel-video">
		<h2>Video del partido</h2>

		<iframe
			src={urlEmbed}
			title="Video Player"
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen
		></iframe>

		<div class="contenedor-boton">
			<button disabled={!hayPilaAcciones()} onclick={cambiarVista} class="btn-primary">
				← Finalizar análisis
			</button>
		</div>
	</div>

	<div class="bloque-paneles-derecha">
		<!-- Panel Individual -->
		<div class="panel-interaccion">
			<div class="seccion-bloque">
				<h3>Jugadores</h3>
				<div class="grupo-chips">
					{#each equipo as p (p.numero)}
						{#if p.player !== null}
							<button
								onclick={() =>
									(jugadorElegido = jugadorElegido?.id === p.player?.id ? null : p.player)}
								disabled={sitJuegoElegida !== null}
								class:activo={jugadorElegido?.id === p.player.id}
								class="btn-chip">{p.player.apellido}</button
							>
						{/if}
					{/each}
				</div>
			</div>

			<div class="seccion-bloque">
				<h3>Acción individual</h3>
				<div class="grupo-chips">
					{#each LISTADO_SKILLS as s (s)}
						<button
							onclick={() => (skillElegido = skillElegido === s ? null : s)}
							disabled={jugadorElegido === null}
							class:activo={skillElegido === s}
							class="btn-chip">{s}</button
						>
					{/each}
				</div>
			</div>

			<div class="seccion-bloque">
				<h3>Calificación</h3>
				<div class="grupo-chips">
					{#each LISTADO_CALIFICACIONES_SKILLS as c (c)}
						{#if c !== 'Neutro' || (skillElegido && SKILLS_CON_NEUTRO.includes(skillElegido))}
							<button
								onclick={() => (califIndividualElegida = califIndividualElegida === c ? null : c)}
								disabled={jugadorElegido === null || skillElegido === null}
								class:activo={califIndividualElegida === c}
								class="btn-chip">{c}</button
							>
						{/if}
					{/each}
				</div>
			</div>

			<div class="acciones-finales">
				<button
					onclick={deshacerAccionJugador}
					disabled={acciones.length === 0}
					class="btn-primary outline"
				>
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

		<!-- Panel Grupal -->
		<div class="panel-interaccion">
			<div class="seccion-bloque">
				<h3>Acciones grupales</h3>
				<div class="grupo-chips">
					{#each LISTADO_SITUACIONES_JUEGO as sj (sj)}
						<button
							onclick={() => (sitJuegoElegida = sitJuegoElegida === sj ? null : sj)}
							disabled={jugadorElegido !== null}
							class:activo={sitJuegoElegida === sj}
							class="btn-chip">{sj}</button
						>
					{/each}
				</div>
			</div>

			<div class="seccion-bloque">
				<h3>Calificación</h3>
				<div class="grupo-chips">
					{#each LISTADO_CALIFICACIONES_GRUPALES as c (c)}
						<button
							onclick={() => (califGrupalElegida = califGrupalElegida === c ? null : c)}
							disabled={sitJuegoElegida === null}
							class:activo={califGrupalElegida === c}
							class="btn-chip">{c}</button
						>
					{/each}
				</div>
			</div>

			<div class="acciones-finales">
				<button
					onclick={deshacerAccionEquipo}
					disabled={teamAcciones.length === 0}
					class="btn-primary outline"
				>
					Deshacer
				</button>
				<button
					onclick={confirmarAccionEquipo}
					disabled={sitJuegoElegida === null || califGrupalElegida === null}
					class="btn-primary"
				>
					Confirmar
				</button>
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
		font-family: sans-serif;
	}

	.panel-video h2 {
		margin-top: 0;
		margin-bottom: 12px;
		color: #1e293b;
	}

	.panel-video {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
	}

	/* Le damos proporciones firmes de pantalla de TV al reproductor */
	.panel-video iframe {
		width: 100%;
		aspect-ratio: 16 / 9; /* Mantiene la proporción de video estándar */
		border-radius: 8px;
		background-color: #000000; /* Fondo negro de carga */
		border: 1px solid #e2e8f0;
	}

	.panel-interaccion {
		display: flex;
		flex-direction: column;
		gap: 16px;
		background-color: #f8fafc;
		padding: 20px;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
	}
	.seccion-bloque h3 {
		margin: 0 0 8px 0;
		font-size: 0.95rem;
		font-weight: bold;
		color: #212831;
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
		background-color: #2563eb !important;
		color: white !important;
		border-color: #2563eb !important;
	}
	.btn-primary {
		background-color: #2563eb;
		color: white;
		border: none;
		padding: 10px 20px;
		font-size: 0.95rem;
		font-weight: bold;
		border-radius: 8px;
		cursor: pointer;
	}
	.btn-primary.outline {
		background-color: transparent;
		border: 1px solid #cbd5e1;
		color: #475569;
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
</style>
