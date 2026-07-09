<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Menu from '$lib/components/Menu.svelte';
	import fondo from '$lib/assets/fondo.svg';
	import { page } from '$app/stores';

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

<Menu />

<main
	class="min-h-screen"
	class:with-bg={$page.url.pathname !== '/'}
	style:background-image={$page.url.pathname !== '/' ? `url("${fondo}")` : ''}
	style:background-size="cover"
	style:background-position="center"
	style:background-repeat="no-repeat"
>
	{@render children()}
</main>

<footer class="site-footer">
	<div class="footer-inner">
		<p class="footer-desc">Stats Rugby — App gratuita para entrenadores y analistas de rugby</p>
		<div class="footer-links">
			<a
				href="https://www.instagram.com/stats.rugby/"
				target="_blank"
				rel="noopener noreferrer"
				class="ig-link"
			>
				<img src="/logo-instagram-svgrepo-com.svg" alt="Instagram" class="ig-icon" />
				@stats.rugby
			</a>
			<span class="footer-sep">·</span>
			<a href="mailto:agburgos83@gmail.com">agburgos83@gmail.com</a>
		</div>
		<p class="footer-license">
			CC BY-NC-ND 4.0 — © 2025 Agustín Burgos —
			<a
				href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
				target="_blank"
				rel="noopener noreferrer">Ver licencia</a
			>
		</p>
	</div>
</footer>

<style>
	.site-footer {
		background-color: #2563eb;
		color: white;
		text-align: left;
		padding: 24px 2rem;
		font-size: 0.85rem;
	}
	.footer-inner p {
		margin: 0;
	}
	.footer-desc {
		font-size: 0.9rem;
		font-weight: 600;
	}
	.footer-links {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.footer-links a {
		color: white;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.footer-links a:hover {
		color: #dbeafe;
	}
	.ig-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		text-decoration: none !important;
	}
	.ig-link:hover {
		text-decoration: underline !important;
	}
	.ig-icon {
		width: 18px;
		height: 18px;
		display: block;
	}
	.footer-sep {
		opacity: 0.5;
	}
	.footer-license {
		opacity: 0.75;
		font-size: 0.8rem;
	}
	.footer-license a {
		color: white;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
