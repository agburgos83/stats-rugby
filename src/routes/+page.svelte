<script lang="ts">
	import VistaBienvenida from '$lib/components/VistaBienvenida.svelte';
	import VistaCargaEquipo from '$lib/components/VistaCargaEquipo.svelte';
	import VistaInputVideo from '$lib/components/VistaInputVideo.svelte';
	import VistaAnalisis from '$lib/components/VistaAnalisis.svelte';
	import plantilla from '$lib/plantilla-jugadores.csv?raw';

	// tipos

	type Player = {
		id: number;
		nombre: string;
		apellido: string;
		posicion: string;
		categoria: string;
	};

	// 0. inicializacion de puestos

	function obtenerPosicionTeorica(numero: number): string {
		const posiciones: Record<number, string> = {
			1: 'Pilar izquierdo',
			2: 'Hooker',
			3: 'Pilar derecho',
			4: 'Segunda línea',
			5: 'Segunda línea',
			6: 'Ala',
			7: 'Ala',
			8: 'Octavo',
			9: 'Medio scrum',
			10: 'Apertura',
			11: 'Wing izquierdo',
			12: 'Primer centro',
			13: 'Segundo centro',
			14: 'Wing derecho',
			15: 'Fullback'
		};

		return posiciones[numero] || `Suplente ${numero}`;
	}

	// 1. parseador csv

	const filas = plantilla.trim().split(/\r?\n/);

	const jugadoresCargados = filas
		.slice(1)
		.filter((fila) => fila.split(',').length >= 4)
		.map((fila, index) => {
			const columnas = fila.split(',');

			// if (columnas.length < 4) return null;

			const categoriaLimpia = columnas[3].trim().toLowerCase();

			return {
				id: index + 1,
				nombre: columnas[0].trim(),
				apellido: columnas[1].trim(),
				posicion: columnas[2].trim(),
				categoria: categoriaLimpia as 'forward' | 'back'
			};
		});

	// 3. Estados Globales
	let vistaActual = $state(1);
	let jugadores = $state(jugadoresCargados as Player[]);
	let urlVideo = $state('');

	let equipo = $state(
		Array(23)
			.fill(null)
			.map((_, i) => ({
				numero: i + 1,
				posicionOriginal: obtenerPosicionTeorica(i + 1), // Función auxiliar
				player: null
			}))
	);

	// 4. Funciones de navegación
	function cambiarVista(nuevaVista: number) {
		vistaActual = nuevaVista;
	}
</script>

<!-- 3. Renderizado condicional limpio -->
{#if vistaActual === 1}
	<!-- Le pasamos la función para que el botón "Comenzar" pueda avanzar -->
	<VistaBienvenida cambiarVista={() => cambiarVista(2)} />
{:else if vistaActual === 2}
	<!-- Le pasamos los datos que necesita y la función para avanzar -->
	<VistaCargaEquipo {jugadores} bind:equipo cambiarVista={() => cambiarVista(3)} />
{:else if vistaActual === 3}
	<!-- Usamos bind para que la URL que tipee el usuario impacte en el Orquestador -->
	<VistaInputVideo bind:urlVideo cambiarVista={() => cambiarVista(4)} />
{:else if vistaActual === 4}
	<!-- El monstruo final recibe el equipo armado y el video listo -->
	<VistaAnalisis {equipo} {urlVideo} cambiarVista={() => cambiarVista(5)} />
{/if}
