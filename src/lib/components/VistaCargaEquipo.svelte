<script lang="ts">
	import {
		type Player,
		type PropsCargaEquipo,
		type UnionClave,
		EQUIPOS_POR_UNION
	} from '$lib/types';

	let {
		jugadores,
		equipo,
		usuarioUnion = $bindable(),
		usuarioClub = $bindable(),
		cambiarVista
	}: PropsCargaEquipo = $props();
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

	function formularioCompleto(): boolean {
		return usuarioClub !== '' &&
			equipo.slice(0, 15).every((p) => p.player !== null);
	}
</script>

<div class="contenedor-centrado">
	<div class="pantalla-carga">
		<!-- CABECERA: Arma el equipo (ocupa las 4 columnas) -->
		<div class="encabezado-carga">
			<h2>Armá el equipo</h2>
		</div>

		<!-- COLUMNA 1: UNION Y CLUB -->
		<div class="columna-union-club">
			<h2>Elegí tu Unión y club</h2>
			<p class="subtitulo">Seleccioná tu unión y club antes de armar el equipo</p>

			<label for="union-select">Elegí tu unión</label>
			<select id="union-select" bind:value={usuarioUnion} class="input-control">
				{#each Object.keys(EQUIPOS_POR_UNION) as union (union)}
					<option value={union as UnionClave}>{union}</option>
				{/each}
			</select>

			<label for="club-select">Elegí tu club</label>
			<select id="club-select" bind:value={usuarioClub} class="input-control">
				{#each EQUIPOS_POR_UNION[usuarioUnion] as club (club)}
					<option value={club.label}>{club.label}</option>
				{/each}
			</select>
		</div>

		<!-- COLUMNA 2: FORWARDS -->
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

		<!-- COLUMNA 3: BACKS -->
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

		<!-- COLUMNA 4: EL EQUIPO DE 23 -->
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

		<!-- PIE: Ocupa las 4 columnas -->
		<div class="contenedor-boton">
			<button disabled={!formularioCompleto()} onclick={cambiarVista} class="btn-primary">
				Confirmar equipo →
			</button>
		</div>
	</div>
</div>

<style>
	.contenedor-centrado {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		min-height: 100vh;
		font-family: sans-serif;
		padding: 24px 20px;
		background-color: #f8fafc;
		box-sizing: border-box;
	}

	/* La grilla principal limitada en ancho y centrada */
	.pantalla-carga {
		display: grid;
		grid-template-columns: 280px 1fr 1fr 1fr;
		grid-template-rows: auto 1fr auto;
		gap: 20px;
		width: 100%;
		max-width: 1400px;
		min-height: 85vh;
		box-sizing: border-box;
	}

	/* Encabezado que abarca las 4 columnas */
	.encabezado-carga {
		grid-column: span 4;
		text-align: left;
		padding-bottom: 12px;
	}

	.encabezado-carga h2 {
		color: #0f172a;
		margin: 0;
		font-size: 1.35rem;
		font-weight: 700;
	}

	.subtitulo {
		color: #64748b;
		margin: 0 0 16px 0;
		font-size: 0.82rem;
		line-height: 1.4;
	}

	.input-control {
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
		font-family: sans-serif;
		margin-bottom: 14px;
	}

	.input-control:focus {
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	label {
		font-size: 0.82rem;
		font-weight: 600;
		color: #475569;
		margin-bottom: 4px;
		display: block;
	}

	.columna-union-club,
	.columna-disponibles,
	.columna-equipo {
		background-color: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 20px;
		overflow-y: auto;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
	}

	.columna-union-club h2,
	.columna-disponibles h2,
	.columna-equipo h2 {
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

	/* El botón inferior abarca las 4 columnas del grid */
	.contenedor-boton {
		grid-column: span 4;
		text-align: right;
		padding-top: 6px;
	}

	.btn-primary {
		background-color: #2563eb;
		color: white;
		border: none;
		padding: 12px 24px;
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
