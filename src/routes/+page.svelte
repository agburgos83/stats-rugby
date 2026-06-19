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
		<div>
			<img src="/logo-app-blue-400.svg" alt="Stats Rugby Logo" />
		</div>
		<p class="max-w-lg text-xl leading-relaxed font-medium text-gray-800">
			App gratuita para entrenadores y analistas de rugby. Cargá tu equipo, registrá acciones
			individuales y grupales y compartí el reporte con tu equipo.
		</p>
		<div class="flex flex-wrap justify-center gap-4">

			{#if hayDatos}
				<a
					href={resolve('/app')}
					class="inline-block rounded-sm bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
				>
					Retomar análisis
				</a>
			{/if}
			<button
				onclick={empezarNuevo}
				class="inline-block rounded-sm bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
			>
				Comenzar nuevo análisis
			</button>

			
		</div>
	</div>
	<div class="bloque-paneles-derecha">
		<div class="panel-video">
			<!-- <h2>Video del partido</h2> -->
			<h2>Cómo usar la app</h2>
			<br />
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
</section>

<style>
	.pantalla-analisis {
		display: grid;
		grid-template-columns: 1.2fr 1.8fr;
		/* 2. Reducido ligeramente el espacio entre columnas para ganar ancho interno */
		gap: 32px;
		max-width: 1400px;
		margin: 0 auto;
		padding: 48px 24px;
		min-height: calc(100vh - 80px);
		align-items: center;
	}

	.bloque-paneles-izquierda {
		align-items: center;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 100%; /* Asegura que ocupe todo su espacio */
	}

	.panel-video h2 {
		border-left: 4px solid #2563eb; /* blue-600 */
		padding-left: 12px;
		font-size: 1.5rem;
		color: #1e293b; /* slate-800 */
		font-weight: 500;
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
		text-align: left;
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
