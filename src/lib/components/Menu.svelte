<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import { loadFromStorage } from '$lib/stores.svelte';

	const links = [
		{ path: '/', label: 'Inicio' },
		{ path: '/acerca-de', label: 'Acerca de' },
		{ path: '/contacto', label: 'Contacto' }
	] as const;

	function isActive(path: string): boolean {
		if (path === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(path);
	}

	let hayDatos = $state(false);

	$effect(() => {
		if (!browser) return;
		void $page.url.pathname;
		const saved = loadFromStorage();
		hayDatos = Array.isArray(saved.jugadores) && saved.jugadores.length > 0;
	});

	let mostrarRetomar = $derived(hayDatos && !$page.url.pathname.startsWith('/app'));
</script>

<nav>
	<ul>
		{#each links as link (link.path)}
			<li>
				<a href={resolve(link.path)} class:active={isActive(link.path)}>
					{link.label}
				</a>
			</li>
		{/each}
		<div class="flex flex-wrap gap-4">
			{#if mostrarRetomar}
				<a href={resolve('/app')} class="retomar-btn"> Retomar análisis </a>
			{/if}
		</div>
	</ul>
</nav>

<style>
	nav {
		position: sticky;
		top: 0;
		z-index: 50;
		/* background: #ffffff; */
		background-color: #2563ebff;
		border-bottom: 1px solid #e5e7eb;
		/* border-bottom: 1px solid #ff2a2aff; */
		padding: 0.75rem 2rem;
	}
	ul {
		display: flex;
		gap: 2rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	a {
		text-decoration: none;
		color: #ffffff;
		font-weight: 500;
		transition: color 0.15s;
	}
	a:hover {
		color: #1f2937;
	}
	a.active {
		/* color: #2563eb; */
		color: #ffffff;
		font-weight: 700;
	}

	.retomar-btn {
		position: relative;
		display: inline-block;
		background: white;
		color: #1d4ed8;
		font-weight: 600;
		padding: 0.2rem 2rem 0.2rem 0.75rem;
		border-radius: 4px;
		text-decoration: none;
		font-size: 0.85rem;
		transition: all 0.2s ease;
	}

	.retomar-btn::after {
		content: '';
		position: absolute;
		right: 13px;
		top: 50%;
		transform: translateY(-50%);
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: rgba(220, 38, 38, 0.7);
		box-shadow: 0 0 6px 2px rgba(220, 38, 38, 0.5);
		animation: blink-red 1.5s ease-in-out infinite;
	}

	@keyframes blink-red {
		0%, 100% {
			opacity: 0.3;
			box-shadow: 0 0 4px 1px rgba(220, 38, 38, 0.3);
		}
		50% {
			opacity: 1;
			box-shadow: 0 0 10px 4px rgba(220, 38, 38, 0.7);
		}
	}

	.retomar-btn:hover {
		background: #eff6ff;
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
</style>
