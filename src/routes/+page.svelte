<script lang="ts">
	import { resolve } from '$app/paths';
	import { loadFromStorage, clearStorage } from '$lib/stores.svelte';
	import { browser } from '$app/environment';

	import { type PropsCargaEquipo } from '$lib/types';

	let { jugadores }: PropsCargaEquipo = $props();

	let hayDatos = $state(false);

	if (browser) {
		const saved = loadFromStorage();
		// hayDatos = Object.keys(saved).length > 0;
		hayDatos = Array.isArray(saved.jugadores) && saved.jugadores.length > 0;
	}

	function empezarNuevo() {
		if (browser) {
			clearStorage();
			window.location.href = resolve('/app') + '?nuevo=1';
		}
	}
</script>

<section class="pantalla-analisis">
	<div class="bloque-paneles-izquierda">
		<div class="panel-video">
			<!-- <h2>Video del partido</h2> -->
			<h2>Cómo usar la app</h2>
			<iframe
				width="560"
				height="315"
				src="https://www.youtube.com/embed/QHBvR0hiq5I?si=kkMQJMvjf-cpOi3B"
				title="YouTube video player"
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				referrerpolicy="strict-origin-when-cross-origin"
				allowfullscreen
			></iframe>
		</div>
	</div>
	<div class="bloque-paneles-derecha">
		<div>
			<img src="/logo-app-blue-200.png" alt="Lupa Rugby Logo" />
		</div>
		<p class="max-w-lg text-lg leading-relaxed text-gray-600">
			Herramienta gratuita para entrenadores y analistas de rugby. Cargá tu equipo, analizá acciones
			individuales y grupales, y descargá reportes en PDF.
		</p>
		<div class="flex flex-wrap justify-center gap-4">
			{#if hayDatos}
				<a
					href={resolve('/app')}
					class="inline-block rounded-sm bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
				>
					Retomar análisis
				</a>
				<button
					onclick={empezarNuevo}
					class="inline-block rounded-sm border border-gray-300 bg-white px-8 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
				>
					Comenzar nuevo análisis
				</button>
			{:else}
				<button
					onclick={empezarNuevo}
					class="inline-block rounded-sm bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
				>
					Comenzar nuevo análisis
				</button>
			{/if}
		</div>
	</div>
</section>

<style>
	.pantalla-analisis {
		display: grid;
		/* 1. Cambiado a proporciones más equilibradas (o usa 1fr 1fr si quieres simetría) */
		grid-template-columns: 1.8fr 1.2fr;
		/* 2. Reducido ligeramente el espacio entre columnas para ganar ancho interno */
		gap: 32px;
		/* 3. Ampliado el ancho máximo para aprovechar pantallas modernas */
		max-width: 1400px;
		margin: 0 auto;
		padding: 48px 24px;
		min-height: calc(100vh - 80px);
		align-items: center;
	}

	.bloque-paneles-izquierda {
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 100%; /* Asegura que ocupe todo su espacio */
	}

	.panel-video h2 {
		margin: 0 0 16px 0;
		font-size: 1.4rem;
		color: #1e293b;
	}

	.panel-video iframe {
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: 12px;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
	}

	.bloque-paneles-derecha {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 32px;
		width: 100%; /* Asegura que ocupe todo su espacio */
	}

	.bloque-paneles-derecha img {
		/* 4. Aumentado el tamaño máximo del logo/imagen para que no quede insignificante */
		max-width: 280px;
		width: 100%;
		height: auto;
	}

	/* 5. RESPONSIVO: Si la pantalla es menor a 1024px, se apilan para que no se compriman */
	@media (max-width: 1024px) {
		.pantalla-analisis {
			grid-template-columns: 1fr;
			gap: 40px;
			padding: 24px 16px;
		}
	}
</style>
