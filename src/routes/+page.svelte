<script lang="ts">
	import { resolve } from '$app/paths';
	import { loadFromStorage, clearStorage } from '$lib/stores.svelte';
	import { browser } from '$app/environment';

	let hayDatos = $state(false);

	if (browser) {
		const saved = loadFromStorage();
		hayDatos = Object.keys(saved).length > 0;
	}

	function empezarNuevo() {
		if (browser) {
			clearStorage();
			window.location.href = resolve('/app') + '?nuevo=1';
		}
	}
</script>

<section class="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 py-24 text-center">
	<h1 class="text-5xl font-bold tracking-tight text-gray-900">Lupa Rugby</h1>
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
</section>
