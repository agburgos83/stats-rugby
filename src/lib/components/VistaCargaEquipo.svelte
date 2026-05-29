<script lang="ts">

	type Player = {
        id: number;
		nombre: string;
		apellido: string;
		posicion: string;
        categoria: string;
	}

    type Puesto = {
	   player: Player | null; 
	   numero: number;
	   posicionOriginal: string; 
	}

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
		console.log("drop detectado! Player:", player, "camiseta:", numeroCamiseta);
        if(!player) return;
		equipo[numeroCamiseta - 1].player = player;
		equipo = [...equipo];
	}

	function jugando(jug: Player): boolean {
	   return equipo.some(casillero => {
	      if (casillero.player !== null) { 
            return casillero.player.id === jug.id 
        }
	      return false;
	});
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = "move";
		}
  	}

  function iniciarArrastre(e: DragEvent, jugador: Player) {
    jugadorSiendoArrastrado = jugador;
	if (e.dataTransfer) {
		e.dataTransfer.setData("text/plain", jugador.id.toString());
	}
  }

  function alMenosQuince(): boolean {
	const jugadoresCargados = equipo.filter(casillero => casillero.player != null);
	return jugadoresCargados.length >= 3;
  }
	

</script>

<div class="pantalla-carga">
	<!-- COLUMNA 1: FORWARDS -->
	<div class="columna-disponibles">
		<h2>Forwards</h2>
		{#each jugadores as j (j.id)}
			{#if j.categoria === "forward"}
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
			{#if j.categoria === "back"}
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
	
	<!-- COLUMNA 3: EQUIPO -->
	<div class="columna-equipo">
		<h2>Equipo (23)</h2>
		
		<!-- Recorremos nuestro array global 'equipo', cada elemento lo llamamos 'p' -->
		{#each equipo as p (p.numero)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="tarjeta-casillero"
						ondragover={handleDragOver}
						ondrop={(e) => { e.preventDefault(); asignarJugador(jugadorSiendoArrastrado, p.numero); }}>
				
				<!-- CASO A: El casillero está vacío -->
				{#if p.player === null}
					
					<div class="estado-vacio">
						<!-- Mostramos la info fija del puesto -->
						<span class="numero">{p.numero}</span>
						<span class="posicion">{p.posicionOriginal}</span>
					</div>
				{/if}
				
				<!-- CASO B: El casillero tiene un jugador asignado -->
				{#if p.player != null}
					<div class="estado-ocupado">
						<span class="numero">{p.numero}</span>
						<!-- Accedemos al objeto player que vive dentro del puesto -->
						<p class="nombre-jugador">
							{p.player.apellido}, {p.player.nombre}
						</p>
						<!-- El botón de remover que definimos antes -->
						<button onclick={() => removerJugador(p.numero)} class="btn-remover">
							×
						</button>
					</div>
				{/if}

			</div>
		{/each}
	</div>

    <div class="contenedor-boton">
		<!-- Ejecutamos la función del padre al hacer click -->
		<button disabled={!alMenosQuince()} onclick={cambiarVista} class="btn-primary">
			Confirmar equipo →
		</button>
	</div>

</div>


<style>
	/* 1. CONTENEDOR PRINCIPAL: Pone las 3 columnas una al lado de la otra */
	.pantalla-carga {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 480px)); 
		gap: 24px;
		padding: 20px;
		height: 85vh;
		box-sizing: border-box;
		font-family: sans-serif;
		margin: 0 auto; 
		
	}

	/* 2. LAS COLUMNAS: Fondo gris sutil y scroll interno independiente */
	.columna-disponibles, .columna-equipo {
		background-color: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 16px;
		overflow-y: auto; /* Activa el scroll si hay muchos nombres */
	}

	/* 3. LAS TARJETAS DE LOS JUGADORES (Forwards / Backs) */
	.tarjeta-jugador {
		background: white;
		padding: 12px;
		margin-bottom: 8px;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		cursor: grab; /* Cambia el mouse a una manito de agarre */
		box-shadow: 0 1px 3px rgba(0,0,0,0.05);
	}
	.tarjeta-jugador p {
		margin: 0;
		font-weight: 500;
	}

	/* Esta clase la activa tu función jugando(j) de forma automática */
	.deshabilitado {
		opacity: 0.4;
		pointer-events: none; /* Clave: ya no permite que se vuelva a arrastrar */
		background-color: #e2e8f0;
	}

	/* 4. LOS CASILLEROS DE LOS 23 */
	.tarjeta-casillero {
		margin-bottom: 10px;
	}

	/* Estado Vacío: Punteado para arrastrar */
	.estado-vacio {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background-color: #ffffff;
		border: 2px dashed #cbd5e1;
		border-radius: 6px;
		color: #64748b;
	}

	/* Estado Ocupado: Sólido azul */
	.estado-ocupado {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background-color: #eff6ff;
		border: 2px solid #3b82f6;
		border-radius: 6px;
	}

	/* Elementos comunes de las camisetas */
	.numero {
		font-weight: bold;
		background: #cbd5e1;
		color: #1e293b;
		padding: 4px 8px;
		border-radius: 4px;
		min-width: 24px;
		text-align: center;
	}
	.estado-ocupado .numero {
		background: #3b82f6;
		color: white;
	}

	.posicion, .placeholder {
		font-size: 0.9rem;
	}

	.nombre-jugador {
		margin: 0;
		font-weight: 600;
		color: #1e293b;
		flex-grow: 1; /* Empuja el botón X hacia la derecha */
	}

	/* Botón rojo de remover */
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
	}

	/* 5. EL BOTÓN INFERIOR DE CONFIRMAR */
	.contenedor-boton {
		grid-column: span 3; /* Hace que ocupe el ancho de las 3 columnas abajo */
		text-align: right;
		padding-top: 10px;
	}
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


</style>
