<script lang="ts">
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

	interface Props {
		jugadores: Player[];
		equipo: Puesto[];
		cambiarVista: () => void;
	}

	let { jugadores, equipo = $bindable(), cambiarVista }: Props = $props();
	let jugadorSiendoArrastrado: Player | null = null;

	function removerJugador(numeroCamiseta: number): void {
		if (numeroCamiseta >= 1 && numeroCamiseta <= equipo.length) {
			equipo[numeroCamiseta - 1].player = null;
		}
		equipo = [...equipo];
	}

	function asignarJugador(player: Player | null, numeroCamiseta: number): void {
		if (!player) return;
		equipo[numeroCamiseta - 1].player = player;
		equipo = [...equipo];
	}

	function jugando(jug: Player): boolean {
		return equipo.some((casillero) => casillero.player !== null && casillero.player.id === jug.id);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
	}

	function iniciarArrastre(e: DragEvent, jugador: Player) {
		jugadorSiendoArrastrado = jugador;
		if (e.dataTransfer) e.dataTransfer.setData('text/plain', jugador.id.toString());
	}

	function titularesCompletos(): boolean {
		// Volvemos a los 15 reglamentarios para producción
		const titulares = equipo.slice(0, 3);
		return titulares.every((p) => p.player !== null);
	}
</script>

<div class="contenedor-centrado">
	<div class="pantalla-carga">
		
		<!-- CABECERA: Ocupa las 3 columnas de forma nativa -->
		<div class="encabezado-carga">
			<h2>Armá el equipo</h2>
			<p class="subtitulo">Los 15 titulares del fin de semana no pueden quedar incompletos.</p>
		</div>

		<!-- COLUMNA 1: FORWARDS -->
		<div class="columna-disponibles">
			<h2>Forwards</h2>
			{#each jugadores as j (j.id)}
				{#if j.categoria === 'forward'}
					<div
						class="tarjeta-jugador"
						class:deshabilitado={jugando(j)}
						draggable="true"
						ondragstart={(e) => iniciarArrastre(e, j)}
					>
						<p>{j.apellido}, {j.nombre}</p>
					</div>
				{/if}
			{/each}
		</div>

		<!-- COLUMNA 2: BACKS -->
		<div class="columna-disponibles">
			<h2>Backs</h2>
			{#each jugadores as j (j.id)}
				{#if j.categoria === 'back'}
					<div
						class="tarjeta-jugador"
						class:deshabilitado={jugando(j)}
						draggable="true"
						ondragstart={(e) => iniciarArrastre(e, j)}
					>
						<p>{j.apellido}, {j.nombre}</p>
					</div>
				{/if}
			{/each}
		</div>

		<!-- COLUMNA 3: EL EQUIPO DE 23 -->
		<div class="columna-equipo">
			<h2>Equipo (23)</h2>
			{#each equipo as p (p.numero)}
				<div
					class="tarjeta-casillero"
					ondragover={handleDragOver}
					ondrop={(e) => {
						e.preventDefault();
						asignarJugador(jugadorSiendoArrastrado, p.numero);
					}}
				>
					{#if p.player === null}
						<div class="estado-vacio">
							<span class="numero">{p.numero}</span>
							<span class="posicion">{p.posicionOriginal}</span>
						</div>
					{/if}
					{#if p.player != null}
						<div class="estado-ocupado">
							<span class="numero">{p.numero}</span>
							<p class="nombre-jugador">{p.player.apellido}, {p.player.nombre}</p>
							<button onclick={() => removerJugador(p.numero)} class="btn-remover">×</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- PIE: Ocupa las 3 columnas -->
		<div class="contenedor-boton">
			<button disabled={!titularesCompletos()} onclick={cambiarVista} class="btn-primary">
				Confirmar equipo →
			</button>
		</div>
	</div>
</div>

<style>
	/* Envuelve y centra todo el bloque de la aplicación en la pantalla */
	.contenedor-centrado {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		font-family: sans-serif;
		padding: 20px;
		background-color: #f8fafc;
		box-sizing: border-box;
	}

	/* La grilla principal limita el ancho máximo para estar centrada siempre */
	.pantalla-carga {
		display: grid;
		grid-template-columns: repeat(3, minmax(280px, 380px)); /* Columnas responsivas pero firmes */
		grid-template-rows: auto 1fr auto; /* Fila cabecera, Fila columnas, Fila botón */
		gap: 24px;
		width: 100%;
		max-width: 1200px; /* Ancho ideal de escritorio */
		height: 90vh;
		box-sizing: border-box;
	}

	/* Truco maestro: El encabezado abarca las 3 columnas del grid */
	.encabezado-carga {
		grid-column: span 3;
		text-align: left;
		margin-bottom: -10px; /* Acerca el título a las columnas */
	}

	.encabezado-carga h2 {
		color: #0f172a;
		margin: 0 0 4px 0;
		font-size: 1.75rem;
		font-weight: 700;
	}

	.subtitulo {
		color: #64748b;
		margin: 0;
		font-size: 0.95rem;
	}

	.columna-disponibles,
	.columna-equipo {
		background-color: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 20px;
		overflow-y: auto; /* Scroll interno si los nombres desbordan */
		box-shadow: 0 1px 3px rgba(0,0,0,0.02);
	}

	/* Estilos internos de las columnas */
	.columna-disponibles h2, .columna-equipo h2 {
		font-size: 1.1rem;
		color: #334155;
		margin-top: 0;
		margin-bottom: 16px;
		border-bottom: 1px solid #f1f5f9;
		padding-bottom: 8px;
	}

	.tarjeta-jugador {
		background: #f8fafc;
		padding: 12px;
		margin-bottom: 8px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		cursor: grab;
		transition: background-color 0.15s;
	}

	.tarjeta-jugador:hover {
		background: #f1f5f9;
	}

	.tarjeta-jugador p {
		margin: 0;
		font-weight: 500;
		color: #1e293b;
	}

	.deshabilitado {
		opacity: 0.35;
		pointer-events: none;
		background-color: #cbd5e1;
	}

	.tarjeta-casillero {
		margin-bottom: 10px;
	}

	.estado-vacio {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: white;
		border: 2px dashed #cbd5e1;
		border-radius: 6px;
		color: #64748b;
	}

	.estado-ocupado {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: #eff6ff;
		border: 1px solid #3b82f6;
		border-radius: 6px;
	}

	.numero {
		font-weight: bold;
		background: #e2e8f0;
		color: #475569;
		padding: 4px 8px;
		border-radius: 4px;
		min-width: 24px;
		text-align: center;
		font-size: 0.85rem;
	}

	.estado-ocupado .numero {
		background: #3b82f6;
		color: white;
	}

	.posicion {
		font-size: 0.85rem;
		font-weight: 500;
	}

	.nombre-jugador {
		margin: 0;
		font-weight: 600;
		color: #1e293b;
		font-size: 0.9rem;
		flex-grow: 1;
	}

	.btn-remover {
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 50%;
		width: 22px;
		height: 22px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		transition: background-color 0.15s;
	}

	.btn-remover:hover {
		background: #dc2626;
	}

	/* El botón inferior abarca las 3 columnas del grid */
	.contenedor-boton {
		grid-column: span 3;
		text-align: right;
		padding-top: 10px;
	}

	.btn-primary {
		background-color: #2563eb;
		color: white;
		border: none;
		padding: 12px 28px;
		font-size: 0.95rem;
		font-weight: bold;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.btn-primary:hover {
		background-color: #1d4ed8;
	}

	.btn-primary:disabled {
		background-color: #cbd5e1;
		color: #94a3b8;
		cursor: not-allowed;
	}
</style>
