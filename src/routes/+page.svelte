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
				App gratuita para entrenadores y analistas de rugby. <br />Cargá tu equipo, registrá
				acciones individuales y grupales <br/>
				y compartí el análisis con tus jugadores.
			</p>
			<div class="hero-botones">
				<button onclick={empezarNuevo} class="btn-contratame"> Analizar partido </button>
				<a
					href="mailto:agburgos83@gmail.com?subject=Contratar%20an%C3%A1lisis%20de%20partido"
					class="btn-contratame"
				>
					Contratame
				</a>
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
			grid-template-columns: 3fr 2fr;
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

	.btn-primary,
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
	.btn-primary {
		background-color: #2563eb;
		color: white;
		border: none;
	}
	.btn-primary:hover {
		background-color: #1d4ed8;
	}
	.btn-contratame {
		background-color: #fff;
		color: #2563eb;
		border: none;
	}
	.btn-contratame:hover {
		background-color: #f1f5f9;
	}
</style>
