<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Cabecera from '$lib/components/Cabecera.svelte';
	import fondo from '$lib/assets/fondo2.svg';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head
	><link rel="icon" href={favicon} />

	<title>Stats Rugby — App de análisis para entrenadores</title>
	<meta
		name="description"
		content="App gratuita para entrenadores y analistas de rugby. Cargá tu equipo, registrá acciones individuales y grupales, y compartí el análisis con tus jugadores."
	/>
	<meta property="og:title" content="Stats Rugby" />
	<meta property="og:description" content="App gratuita para entrenadores y analistas de rugby." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://stats-rugby.netlify.app/" />
</svelte:head>

{#if !$page.url.pathname.startsWith('/app')}
	<Cabecera />
{/if}

<main
	class="min-h-screen"
	class:with-bg={$page.url.pathname !== '/'}
	style:background-image={`url("${fondo}")`}
	style:background-size="cover"
	style:background-position="center"
	style:background-repeat="no-repeat"
>
	{@render children()}
</main>

<footer class="site-footer">
	<div class="footer-inner">
		<div class="footer-col">
			<a href={resolve('/')} class="footer-marca">Stats Rugby</a>
			<p class="footer-tagline">App gratuita para analistas de rugby</p>
			<p class="footer-license">
				<a
					href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
					target="_blank"
					rel="noopener noreferrer"
					class="ig-link">CC BY-NC-ND 4.0 — © 2025 Agustín Burgos</a
				>
			</p>
		</div>
		<div class="footer-col">
			<a href={resolve('/acerca-de')}>Acerca de</a>
			<a href={resolve('/contacto')}>Contacto</a>
			<a
				href="https://www.instagram.com/stats.rugby/"
				target="_blank"
				rel="noopener noreferrer"
				class="ig-link">@stats.rugby</a
			>
		</div>
	</div>
</footer>

<style>
	.site-footer {
		background-color: #0068ce;
		color: white;
		text-align: left;
		padding: 24px 2rem;
		font-size: 0.85rem;
	}
	.footer-inner p {
		margin: 0;
	}
	.ig-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		text-decoration: none !important;
	}
	.ig-link:hover {
		text-decoration: none !important;
	}
	.footer-license {
		font-size: 0.8rem;
	}
	.footer-license a {
		color: white;
	}

	.site-footer {
		background-color: #0068ce;
		color: white;
		padding: 32px 2rem;
		font-size: 0.85rem;
	}
	.footer-inner {
		display: flex;
		justify-content: space-between;
		gap: 2rem;
		max-width: 1100px;
		margin: 0 auto;
		flex-wrap: wrap;
	}
	.footer-col {
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-weight: bold;
	}
	.footer-marca {
		font-weight: 700;
		font-size: 1.1rem;
		color: white;
		text-decoration: none;
	}
	.footer-tagline {
		margin: 0;
	}
	.footer-license {
		margin: 0;
		font-size: 0.8rem;
	}
	.footer-col a {
		color: white;
		width: fit-content;
	}
	.footer-col a:hover {
		color: #cce4f7;
	}
</style>
