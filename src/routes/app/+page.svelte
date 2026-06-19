<script lang="ts">
	import {
		type Player,
		type Puesto,
		type PartidoContexto,
		type Accion,
		type TeamAccion
	} from '$lib/types';
	import { browser } from '$app/environment';
	import { loadFromStorage, saveToStorage, clearStorage } from '$lib/stores.svelte';
	import { page } from '$app/stores';

	import VistaCargaCSV from '$lib/components/VistaCargaCSV.svelte';
	import VistaCargaEquipo from '$lib/components/VistaCargaEquipo.svelte';
	import VistaCargaPartido from '$lib/components/VistaCargaPartido.svelte';
	import VistaAnalisisAmpliada from '$lib/components/VistaAnalisisAmpliada.svelte';
	import VistaAcciones from '$lib/components/VistaAcciones.svelte';

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

	// 1. Estados globales
	let jugadores = $state<Player[]>([]);
	let vistaActual = $state(1);

	let equipo = $state(
		Array.from({ length: 23 }, (_, i) => ({
			numero: i + 1,
			posicionOriginal: obtenerPosicionTeorica(i + 1),
			player: null as Player | null
		}))
	);

	let partido = $state({
		fecha: '',
		local: '',
		visitante: '',
		puntosLocal: null as number | null,
		puntosVisitante: null as number | null,
		union: 'URBA',
		division: 'Primera',
		urlVideo: ''
	});

	let acciones = $state<Accion[]>([]);
	let teamAcciones = $state<TeamAccion[]>([]);

	// 3. Cargar estado persistido (solo en cliente)
	if (browser) {
		const esNuevo = $page.url.searchParams.has('nuevo');
		if (esNuevo) {
			clearStorage();
		} else {
			const saved = loadFromStorage();
			if (saved.vistaActual) vistaActual = saved.vistaActual as number;
			if (saved.jugadores) jugadores = saved.jugadores as Player[];
			if (saved.equipo) equipo = saved.equipo as Puesto[];
			if (saved.partido) partido = saved.partido as PartidoContexto;
			if (saved.acciones) acciones = saved.acciones as Accion[];
			if (saved.teamAcciones) teamAcciones = saved.teamAcciones as TeamAccion[];
		}
	}

	// 4. Persistir automaticamente en cada cambio
	$effect(() => {
		if (!browser) return;
		if (typeof vistaActual !== 'number' || vistaActual < 1) return;
		saveToStorage({ vistaActual, jugadores, equipo, partido, acciones, teamAcciones });
	});
	// 5. Funciones de navegación
	function cambiarVista(nuevaVista: number) {
		vistaActual = nuevaVista;
	}
</script>

<!-- 6. Renderizado condicional -->
{#if vistaActual === 1}
	<VistaCargaCSV bind:jugadores cambiarVista={() => cambiarVista(2)} />
{:else if vistaActual === 2}
	<VistaCargaEquipo {jugadores} bind:equipo cambiarVista={() => cambiarVista(3)} />
{:else if vistaActual === 3}
	<VistaCargaPartido bind:partido cambiarVista={() => cambiarVista(4)} />
{:else if vistaActual === 4}
	<VistaAnalisisAmpliada
		{equipo}
		{partido}
		bind:acciones
		bind:teamAcciones
		cambiarVista={() => cambiarVista(5)}
	/>
{:else if vistaActual === 5}
	<VistaAcciones
		{equipo}
		{partido}
		{acciones}
		{teamAcciones}
		cambiarVista={() => cambiarVista(5)}
	/>
{/if}
