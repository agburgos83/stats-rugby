<script lang="ts">
	import {
		SKILLS,
		type Skill,
		type SituacionJuego,
		type CalificacionIndividual,
		type CalificacionGrupal,
		type Player,
		type Accion,
		type TeamAccion,
		type PropsAnalisis
	} from '$lib/types';

	// importadas desde el orquestador
	let { equipo, partido, acciones= $bindable(), teamAcciones= $bindable(), cambiarVista }: PropsAnalisis = $props();

	let jugadorElegido = $state<Player | null>(null);
	// let sitJuegoElegida = $state<SituacionJuego | null>(null);
	let ultimaAccionClickeada = $state<string | null>(null);

	let puedeDeshacerIndividual = $state(false);
	let puedeDeshacerGrupal = $state(false);

	let totalAccionesIndividuales = $derived(acciones.length);
	let totalAccionesGrupales = $derived(teamAcciones.length);

	const urlEmbed = $derived(cocinarEnlaceVideo(partido.urlVideo));

	// 1. FUNCIONES DE ACCIONES Y VIDEO
	function registrarAccionDirecta(
		skillElegida: Skill,
		califIndividualElegida: CalificacionIndividual
	): void {
		if (!jugadorElegido) {
			alert('Primero selecciona un jugador de la grilla superior');
			return;
		}

		const tiempoActual = obtenerTimestampVideo();

		const nuevaAccion: Accion = {
			timestamp: tiempoActual,
			player: jugadorElegido, // El que está activo en memoria
			skill: skillElegida, // El que viene de la celda
			calificacion: califIndividualElegida // El del botón que tocó
		};

		acciones.push(nuevaAccion);
		acciones = [...acciones];

		puedeDeshacerIndividual = true;

		jugadorElegido = null;

		// Activamos el flash visual
		ultimaAccionClickeada = `${skillElegida}-${califIndividualElegida}`;

		// Lo apagamos después de 300ms
		setTimeout(() => {
			ultimaAccionClickeada = null;
		}, 300);
	}

	function registrarAccionEquipo(
		sitJuegoElegida: SituacionJuego,
		califGrupalElegida: CalificacionGrupal
	) {
		if (!sitJuegoElegida) {
			alert('Primero selecciona un situaciòn de juego');
			return;
		}

		const tiempoActual = obtenerTimestampVideo();

		const nuevaTeamAccion: TeamAccion = {
			timestamp: tiempoActual,
			situacion: sitJuegoElegida, // El que está activo en memoria
			calificacion: califGrupalElegida // El del botón que tocó
		};

		teamAcciones.push(nuevaTeamAccion);
		teamAcciones = [...teamAcciones];

		puedeDeshacerGrupal = true;

		jugadorElegido = null;

		// Activamos el flash visual
		ultimaAccionClickeada = `${sitJuegoElegida}-${califGrupalElegida}`;

		// Lo apagamos después de 300ms
		setTimeout(() => {
			ultimaAccionClickeada = null;
		}, 300);
	}

	function deshacerAccionIndividual(): void {
		if (acciones.length === 0 || !puedeDeshacerIndividual) return;
		acciones.pop();
		puedeDeshacerIndividual = false;
		acciones = [...acciones];
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
	}

	function limpiarAccionesGrupales(): void {
		if (teamAcciones.length === 0) return;
		teamAcciones = [];
		teamAcciones = [...teamAcciones];
	}

	function hayAccionesIndividuales(): boolean {
		return acciones.length > 0;
	}

	function hayAccionesGrupales(): boolean {
		return teamAcciones.length > 0;
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

	function obtenerTimestampVideo(): number {
		const iframe = document.querySelector('iframe');
		if (!iframe) return Date.now(); // fallback por seguridad

		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const player = new (window as any).YT.Player(iframe);
			return player.getCurrentTime() * 1000; // Convertir a milisegundos
		} catch {
			return Date.now(); // Si algo falla, volvemos al timestamp general
		}
	}
</script>

<div class="pantalla-analisis">
	<!-- PANEL IZQUIERDO: REPRODUCTOR DE VIDEO -->

	<div class="bloque-paneles-izquierda">
		<div class="panel-video">
			<!-- <h2>Video del partido</h2> -->
			<h2>
				Análisis {partido.local} vs {partido.visitante} ({partido.puntosLocal} - {partido.puntosVisitante})
			</h2>
			<p class="subtitulo-torneo">{partido.union} - {partido.division} | {partido.fecha}</p>
			<iframe
				src={urlEmbed}
				title="Video Player"
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
			></iframe>
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
				<div
					style="display: flex; justify-content: space-between; align-items: baseline; width: 100%;"
				>
					<h3 style="margin: 0;">Jugadores</h3>
				</div>

				<div class="grupo-chips">
					{#each equipo as p (p.numero)}
						{#if p.player !== null}
							<button
								onclick={() =>
									(jugadorElegido = jugadorElegido?.id === p.player?.id ? null : p.player)}
								// disabled={sitJuegoElegida !== null}
								class:activo={jugadorElegido?.id === p.player.id}
								class="btn-chip">{p.player.apellido}</button
							>
						{/if}
					{/each}
				</div>
			</div>

			<div class="seccion-bloque">
				<!-- Grilla de habilidades -->
				<div class="grilla-skills">
					{#each SKILLS as s (s)}
						<div class="tarjeta-skill">
							<p class="titulo-skill">{s}</p>

							<div class="botones-calificacion">
								{#if s === 'Tackle'}
									<button
										disabled={jugadorElegido === null}
										onclick={() => registrarAccionDirecta(s, 'Negativo')}
										class="btn-calif neg">-</button
									>
									<button
										disabled={jugadorElegido === null}
										onclick={() => registrarAccionDirecta(s, 'Neutro')}
										class="btn-calif neu">=</button
									>
									<button
										disabled={jugadorElegido === null}
										onclick={() => registrarAccionDirecta(s, 'Positivo')}
										class="btn-calif pos">+</button
									>
									<button
										disabled={jugadorElegido === null}
										onclick={() => registrarAccionDirecta(s, 'Dominante')}
										class="btn-calif dom">++</button
									>
								{:else if s === 'Duelo'}
									<button
										disabled={jugadorElegido === null}
										onclick={() => registrarAccionDirecta(s, 'Negativo')}
										class="btn-calif neg">-</button
									>
									<button
										disabled={jugadorElegido === null}
										onclick={() => registrarAccionDirecta(s, 'Neutro')}
										class="btn-calif neu">=</button
									>
									<button
										disabled={jugadorElegido === null}
										onclick={() => registrarAccionDirecta(s, 'Positivo')}
										class="btn-calif pos">+</button
									>
								{:else}
									<button
										disabled={jugadorElegido === null}
										onclick={() => registrarAccionDirecta(s, 'Negativo')}
										class="btn-calif neg">-</button
									>
									<button
										disabled={jugadorElegido === null}
										onclick={() => registrarAccionDirecta(s, 'Positivo')}
										class="btn-calif pos">+</button
									>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<hr class="separador-panel" />

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

		<!-- 2. ACCIONES GRUPALES -->
		<div class="panel-interaccion">
			<div class="seccion-bloque">
				<h3>Situaciones de juego</h3>

				<!-- Contenedor vertical que apila las 3 líneas -->
				<div class="contenedor-lineas-grupales">
					<div class="linea-grupal">
						<div class="tarjeta-situacion">
							<div class="encabezado-tarjeta">
								<p class="titulo-situacion">Line propio</p>
								<span class="contador-badge">
									{teamAcciones.filter((ta) => ta.situacion === 'Line propio').length}
								</span>
							</div>
							<div class="botones-calificacion">
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
						</div>
						<div class="tarjeta-situacion">
							<div class="encabezado-tarjeta">
								<p class="titulo-situacion">Scrum propio</p>
								<span class="contador-badge">
									{teamAcciones.filter((ta) => ta.situacion === 'Scrum propio').length}
								</span>
							</div>
							<div class="botones-calificacion">
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
						</div>
						<div class="tarjeta-situacion">
							<div class="encabezado-tarjeta">
								<p class="titulo-situacion">Salida recibida</p>
								<span class="contador-badge">
									{teamAcciones.filter((ta) => ta.situacion === 'Salida recibida').length}
								</span>
							</div>
							<div class="botones-calificacion">
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
						</div>
					</div>

					<div class="linea-grupal">
						<div class="tarjeta-situacion">
							<div class="encabezado-tarjeta">
								<p class="titulo-situacion">Line rival</p>
								<span class="contador-badge">
									{teamAcciones.filter((ta) => ta.situacion === 'Line rival').length}
								</span>
							</div>
							<div class="botones-calificacion">
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
						</div>
						<div class="tarjeta-situacion">
							<div class="encabezado-tarjeta">
								<p class="titulo-situacion">Scrum rival</p>
								<span class="contador-badge">
									{teamAcciones.filter((ta) => ta.situacion === 'Scrum rival').length}
								</span>
							</div>
							<div class="botones-calificacion">
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
						</div>
						<div class="tarjeta-situacion">
							<div class="encabezado-tarjeta">
								<p class="titulo-situacion">Salida cargada</p>
								<span class="contador-badge">
									{teamAcciones.filter((ta) => ta.situacion === 'Salida cargada').length}
								</span>
							</div>
							<div class="botones-calificacion">
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
						</div>
					</div>

					<div class="linea-grupal">
						<div class="tarjeta-situacion tarjeta-ancha">
							<div class="encabezado-tarjeta">
								<p class="titulo-situacion">Puntos en 22</p>
								<span class="contador-badge">
									{teamAcciones.filter((ta) => ta.situacion === 'Puntos en ZD').length}
								</span>
							</div>
							<div class="botones-calificacion">
								<button
									onclick={() => registrarAccionEquipo('Puntos en ZD', 'Negativo')}
									class="btn-calif neg"
									class:flash={ultimaAccionClickeada === 'Puntos en ZD-Negativo'}>-</button
								>
								<button
									onclick={() => registrarAccionEquipo('Puntos en ZD', 'Positivo')}
									class="btn-calif pos"
									class:flash={ultimaAccionClickeada === 'Puntos en ZD-Positivo'}>+</button
								>
							</div>
						</div>
					</div>
				</div>

				<hr class="separador-panel" />

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

	.bloque-paneles-izquierda {
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

	.grilla-skills {
		display: grid;
		/* Distribuye tarjetas de mínimo 130px de ancho rellenando el espacio lateral */
		grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
		gap: 10px;
		margin-top: 10px;
	}

	.tarjeta-skill {
		background-color: white;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		padding: 8px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 8px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.titulo-skill {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 600;
		color: #334155;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis; /* Evita que nombres largos rompan la caja */
	}

	.botones-calificacion {
		display: flex;
		justify-content: center;
		gap: 4px;
		width: 100%;
	}

	/* Botones compactos internos de las tarjetas */
	.btn-calif {
		flex: 1;
		padding: 6px 4px;
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
		background-color: #eff6ff;
		color: #2563eb;
		border-color: #bfdbfe;
	}

	/* Contenedor vertical general de la sección grupal */
	.contenedor-lineas-grupales {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 10px;
	}

	/* Cada una de las 3 líneas de tarjetas horizontales */
	.linea-grupal {
		display: flex;
		gap: 10px;
		width: 100%;
	}

	/* Tarjeta individual de situación grupal (Líneas 1 y 2 se dividen en 3 partes iguales) */
	.tarjeta-situacion {
		flex: 1;
		background-color: white;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		padding: 8px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 8px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	/* Modificador para la Línea 3 (Puntos ZD) para que no se estire de forma gigante */
	.tarjeta-ancha {
		max-width: calc(33.33% - 7px); /* Ocupa exactamente el mismo ancho que una tarjeta de arriba */
	}

	.tarjeta-situacion-vacia {
		flex: 1;
		/* background-color: white; */
		/* border: 1px solid #cbd5e1;
		border-radius: 6px; */
		padding: 8px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 8px;
		/* box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); */
	}

	.tarjeta-ancha-vacia {
		max-width: calc(33.33% - 7px); /* Ocupa exactamente el mismo ancho que una tarjeta de arriba */
	}

	.titulo-situacion {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 600;
		color: #334155;
		text-align: center;
		white-space: nowrap;
	}

	.encabezado-tarjeta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		margin-bottom: 2px;
	}

	/* Diseño de esfera o etiqueta gris sutil para el contador individual */
	.contador-badge {
		background-color: #e2e8f0;
		color: #475569;
		font-size: 0.7rem;
		font-weight: bold;
		padding: 2px 6px;
		border-radius: 4px;
		min-width: 16px;
		text-align: center;
	}

	.contador-global {
		color: #2563eb;
		font-weight: bold;
		margin-left: 4px;
	}

	/* La clase que se inyecta temporalmente por 300ms */
	.btn-calif.flash {
		animation: pulso-flash 0.3s ease-out;
		border-color: #2563eb !important;
		box-shadow: 0 0 8px rgba(37, 99, 235, 0.5);
	}

	/* Animación que genera el cambio de color rápido */
	@keyframes pulso-flash {
		0% {
			background-color: #2563eb;
			color: white;
			transform: scale(0.95);
		}
		50% {
			background-color: #3b82f6;
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

	/* 2. En tu grilla-skills actual, le decimos que empuje lo que tenga abajo */
	.grilla-skills {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
		gap: 10px;
		margin-top: 10px;
		flex-grow: 1; /* Esto hace que la grilla ocupe el espacio medio sobrante */
	}

	/* lo mismo si tenés un contenedor de las líneas grupales */
	.contenedor-lineas-grupales {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 10px;
		flex-grow: 1; /* Empuja los botones hacia abajo */
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

	/* Línea divisoria sutil */
	.separador-panel {
		border: 0;
		border-top: 0px solid #e2e8f0;
		margin: 6px 0;
		width: 100%;
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

	/* Variación sutil para el botón de borrar historial */
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
</style>
