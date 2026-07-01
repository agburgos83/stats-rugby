<script lang="ts">
	import { resolve } from '$app/paths';
	import { clearStorage } from '$lib/stores.svelte';
	import { browser } from '$app/environment';

	function empezarNuevo() {
		if (browser) {
			clearStorage();
			window.location.href = resolve('/app') + '?nuevo=1';
		}
	}
</script>

<section class="relative flex min-h-screen items-center overflow-hidden">
	<!-- Video de fondo -->
	<video
		class="absolute inset-0 -z-10 h-full w-full object-cover"
		muted
		autoplay
		loop
		playsinline
		disablepictureinpicture
	>
		<source src="/bg-stats-rugby4.webm" type="video/webm" />
	</video>

	<!-- Overlay oscuro -->
	<!-- <div class="absolute inset-0 z-0 bg-gradient-to-r from-black/70 via-black/50 to-black/60"></div> -->

	<!-- Contenido -->
	<div class="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-6 lg:grid-cols-5">
		<!-- Columna izquierda: texto + botones (3/5) -->
		<div
			class="flex flex-col items-center justify-center text-center lg:col-span-3 lg:items-start lg:text-left"
		>
			<!-- <img src="/logo-app-blue-400.svg" alt="Stats Rugby Logo" class="mb-6 h-auto w-64" /> -->
			<img src="/logo-app-white-400.svg" alt="Stats Rugby Logo" class="mb-6 h-auto w-64" />
			<p class="mb-8 text-lg leading-relaxed font-medium text-white/90 lg:text-xl">
				App gratuita para entrenadores y analistas de rugby. <br />Cargá tu equipo, registrá tanto
				acciones individuales <br />
				como grupales y compartí el análisis con tus jugadores.
			</p>
			<div class="flex flex-wrap gap-4">
				<button
					onclick={empezarNuevo}
					class="rounded-sm bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
				>
					Analizar partido
				</button>
			</div>
		</div>

		<!-- Columna derecha: tutorial (2/5) -->
		<div class="flex items-center justify-center lg:col-span-2">
			<div class="w-full max-w-lg">
				<h2 class="mb-4 border-l-4 border-blue-500 pl-3 text-2xl font-medium text-white">Cómo usar la app</h2>
				<div class="aspect-video w-full overflow-hidden rounded-xl shadow-2xl">
					<iframe
						src="https://www.youtube.com/embed/EB0SmVEKD3c?si=xneN9LCyg3vAIxma"
						title="YouTube video player"
						class="h-full w-full"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowfullscreen
					></iframe>
				</div>
			</div>
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
		padding: 24px;
		min-height: calc(100vh - 80px);
		align-items: center;
	}

	.bloque-paneles-izquierda {
		align-items: center;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 28px;
		width: 100%;
		height: 100%;
		justify-content: center;
	}

	.bloque-paneles-izquierda img {
		max-width: 280px;
		width: 100%;
		height: auto;
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
