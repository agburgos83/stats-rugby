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

<section class="hero">
	<video class="hero-video" muted autoplay loop playsinline disablepictureinpicture>
		<source src="/bg-stats-rugby4.webm" type="video/webm" />
	</video>

	<div class="hero-grid">
		<div class="hero-texto">
			<img src="/logo-app-white-400.svg" alt="Stats Rugby Logo" class="hero-logo" />
			<p class="hero-descripcion">
				<span class="text-band">App gratuita para entrenadores y analistas de rugby. <br /></span>
				<span class="text-band"
					>Cargá tu equipo, registrá acciones individuales y grupales <br /></span
				>
				<span class="text-band">y compartí el análisis con tus jugadores.</span>
			</p>
			<div class="hero-botones">
				<button onclick={empezarNuevo} class="btn-contratame"> Analizar partido </button>
				<a
					href="mailto:agburgos83@gmail.com?subject=Contratar%20an%C3%A1lisis%20de%20partido"
					class="btn-contratame"
				>
					Solicitar análisis
				</a>
			</div>
		</div>

		<!-- Columna derecha: tutorial -->
		<div class="hero-video-col">
			<p class="video-titulo">Cómo usar la app</p>
			<div class="aspect-video w-full overflow-hidden shadow-2xl">
				<iframe
					src="https://www.youtube.com/embed/_Z09DZYnLnQ?si=dYaZWp1Q1pq-CzsA"
					title="YouTube video player"
					class="h-full w-full"
					frameborder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
					allowfullscreen
				></iframe>
			</div>
		</div>
	</div>
</section>

<style>
	.hero {
		position: relative;
		display: flex;
		align-items: center;
		min-height: 100vh;
		overflow: hidden;
	}

	.hero-video {
		position: absolute;
		inset: 0;
		z-index: -10;
		height: 100%;
		width: 100%;
		object-fit: cover;
	}

	.hero-grid {
		position: relative;
		z-index: 10;
		margin: 0 auto;
		width: 100%;
		max-width: 1280px;
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		padding: 0 1.5rem;
	}
	@media (min-width: 1024px) {
		.hero-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.hero-texto {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	@media (min-width: 1024px) {
		.hero-texto {
			align-items: flex-start;
			text-align: left;
		}
	}

	.hero-video-col {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: flex-start;
		gap: 0.75rem;
	}
	@media (min-width: 1024px) {
		.hero-video-col {
			align-items: flex-start;
		}
	}

	.video-titulo {
		font-size: 1.5rem;
		font-weight: 600;
		color: white;
		padding-left: 12px;
		background: white;
		color: #0068CE;
		padding: 4px 14px;
		display: inline-block;
	}

	.hero-logo {
		margin-bottom: 1.5rem;
		height: auto;
		width: 16rem;
	}

	.hero-descripcion {
		margin-bottom: 2rem;
		font-size: 1.125rem;
		line-height: 1.625;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.9);
	}
	@media (min-width: 1024px) {
		.hero-descripcion {
			font-size: 1.25rem;
		}
	}

	.hero-botones {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.hero::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -5; /* entre el video (-10) y el contenido (10) */
		background: linear-gradient(135deg, transparent 0%, rgba(255 255 255 / 0.5) 100%);
		pointer-events: none;
	}

	.text-band {
		background: white;
		color: #0068CE;
		padding: 0px 8px;
		display: inline-block;
		margin-bottom: 8px;
		font-weight: 600;
	}

	.panel-video iframe {
		width: 100%;
		aspect-ratio: 16 / 9;
		/* border-radius: 12px; */
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
	}

	.btn-contratame {
		padding: 12px 24px;
		font-size: 0.95rem;
		font-weight: bold;
		border-radius: 8px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		text-decoration: none;
		transition: background-color 0.2s;
	}
	.btn-contratame {
		background-color: #fff;
		color: #0068CE;
		border: none;
	}
	.btn-contratame:hover {
		background-color: #f1f5f9;
	}
</style>
