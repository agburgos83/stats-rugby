<script lang="ts">
	import {
		type Player,
		type Puesto,
		type PartidoContexto,
		type UnionClave,
		type Accion,
		type TeamAccion,
		type ModalidadClave,
		MODALIDADES,
		POSICIONES_POR_MODALIDAD
	} from '$lib/types';
	import { browser } from '$app/environment';
	import { loadFromStorage, saveToStorage, clearStorage } from '$lib/stores.svelte';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	import VistaCargaCSV from '$lib/components/VistaCargaCSV.svelte';
	import VistaCargaEquipo from '$lib/components/VistaCargaEquipo.svelte';
	import VistaCargaPartido from '$lib/components/VistaCargaPartido.svelte';
	import VistaAnalisis from '$lib/components/VistaAnalisis.svelte';
	import VistaAcciones from '$lib/components/VistaAcciones.svelte';
	import Cabecera from '$lib/components/Cabecera.svelte';

	let usuarioUnion = $state<UnionClave>('URBA');
	let usuarioClub = $state('');
	let usuarioModalidad = $state<ModalidadClave>('quince');
	let confirmarFinalizar = $state(false);

	// 0. inicializacion de puestos
	function obtenerPosicionTeorica(modalidad: ModalidadClave, numero: number): string {
		const posiciones = POSICIONES_POR_MODALIDAD[modalidad];
		return posiciones[numero] || `Suplente ${numero}`;
	}

	// 1. Estados globales
	let jugadores = $state<Player[]>([]);
	let vistaActual = $state(1);

	let equipo = $state<Puesto[]>([]);
	let equipoModalidad = $state<ModalidadClave | null>(null);

	$effect(() => {
		if (equipoModalidad === usuarioModalidad) return;
		equipoModalidad = usuarioModalidad;
		const total = MODALIDADES[usuarioModalidad].total;
		equipo = Array.from({ length: total }, (_, i) => ({
			numero: i + 1,
			posicionOriginal: obtenerPosicionTeorica(usuarioModalidad, i + 1),
			player: i < equipo.length ? equipo[i].player : null
		}));
	});

	let partido = $state<PartidoContexto>({
		fecha: '',
		local: '',
		visitante: '',
		puntosLocal: null,
		puntosVisitante: null,
		usuarioUnion: 'URBA',
		usuarioClub: '',
		division: 'Primera',
		urlVideo: ''
	});

	let acciones = $state<Accion[]>([]);
	let teamAcciones = $state<TeamAccion[]>([]);

	const hayAcciones = $derived(acciones.length > 0 || teamAcciones.length > 0);

	// 3. Cargar estado persistido (solo en cliente)
	if (browser) {
		const esNuevo = $page.url.searchParams.has('nuevo');
		if (esNuevo) {
			clearStorage();
		} else {
			const saved = loadFromStorage();
			if (saved.usuarioUnion) usuarioUnion = saved.usuarioUnion as UnionClave;
			if (saved.usuarioClub) usuarioClub = saved.usuarioClub as string;
			if (saved.usuarioModalidad) usuarioModalidad = saved.usuarioModalidad as ModalidadClave;
			if (saved.vistaActual) vistaActual = saved.vistaActual as number;
			if (saved.jugadores) jugadores = saved.jugadores as Player[];
			if (saved.equipo) equipo = saved.equipo as Puesto[];
			if (saved.partido) partido = saved.partido as PartidoContexto;
			if (saved.acciones) acciones = saved.acciones as Accion[];
			if (saved.teamAcciones) teamAcciones = saved.teamAcciones as TeamAccion[];
			if (saved.equipo && !saved.usuarioModalidad) {
				const totalEquipo = equipo.length;
				const inferida = (Object.keys(MODALIDADES) as ModalidadClave[]).find(
					(mod) => MODALIDADES[mod].total === totalEquipo
				);
				if (inferida) usuarioModalidad = inferida;
			}
			equipoModalidad = usuarioModalidad;
		}
	}

	// ?mock=1: genera acciones de prueba con el equipo cargado y descarga PDF
	if (browser && $page.url.searchParams.has('mock')) {
		const equipoInicial = equipo;
		const partidoInicial = partido;
		if (equipoInicial.some((p) => p.player !== null)) {
			import('$lib/mock-data').then(async ({ generarMockData }) => {
				const { acciones: mockAcc, teamAcciones: mockTeam } = generarMockData(
					equipoInicial,
					partidoInicial
				);
				acciones = mockAcc;
				teamAcciones = mockTeam;
				vistaActual = 5;
				const [{ procesarReporte }, { descargarPDF }] = await Promise.all([
					import('$lib/processing/reporte-data'),
					import('$lib/pdf/reporte')
				]);
				const { matrizProcesada, dixTotales } = procesarReporte(
					equipoInicial,
					acciones,
					teamAcciones
				);
				await descargarPDF(
					equipoInicial,
					partidoInicial,
					matrizProcesada,
					dixTotales,
					usuarioModalidad
				);
			});
		}
	}

	// 4. Persistir automaticamente en cada cambio
	$effect(() => {
		if (!browser) return;
		if (typeof vistaActual !== 'number' || vistaActual < 1) return;
		saveToStorage({
			vistaActual,
			jugadores,
			equipo,
			partido,
			acciones,
			teamAcciones,
			usuarioUnion,
			usuarioClub,
			usuarioModalidad
		});
	});
	// 5. Funciones de navegación
	function cambiarVista(nuevaVista: number) {
		window.scrollTo(0, 0);
		if (nuevaVista === 3 && !partido.usuarioClub) {
			partido.usuarioUnion = usuarioUnion;
			partido.usuarioClub = usuarioClub;
		}
		vistaActual = nuevaVista;
	}

	function finalizarAnalisis() {
		clearStorage();
		window.location.href = resolve('/');
	}
</script>

<!-- 6. Renderizado condicional -->

<Cabecera
	{vistaActual}
	{partido}
	{hayAcciones}
	onEditarPartido={() => cambiarVista(3)}
	onTerminarAnalisis={() => cambiarVista(5)}
	onVolverAnalisis={() => cambiarVista(4)}
	onFinalizar={() => (confirmarFinalizar = true)}
/>

{#if vistaActual === 1}
	<VistaCargaCSV bind:jugadores cambiarVista={(v) => cambiarVista(v)} />
{:else if vistaActual === 2}
	<VistaCargaEquipo
		{jugadores}
		{equipo}
		bind:usuarioUnion
		bind:usuarioClub
		bind:usuarioModalidad
		cambiarVista={(v) => cambiarVista(v)}
	/>
{:else if vistaActual === 3}
	<VistaCargaPartido bind:partido cambiarVista={(v) => cambiarVista(v)} />
{:else if vistaActual === 4}
	<VistaAnalisis {equipo} {partido} bind:acciones bind:teamAcciones />
{:else if vistaActual === 5}
	<VistaAcciones
		{equipo}
		{partido}
		{acciones}
		{teamAcciones}
		modalidad={usuarioModalidad}
		{confirmarFinalizar}
		onCancelarFinalizar={() => (confirmarFinalizar = false)}
		onConfirmarFinalizar={finalizarAnalisis}
	/>
{/if}
