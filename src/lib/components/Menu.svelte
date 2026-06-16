<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	const links = [
		{ path: '/', label: 'Inicio' },
		{ path: '/acerca-de', label: 'Acerca de' },
		{ path: '/contacto', label: 'Contacto' }
	] as const;

	function isActive(path: string): boolean {
		if (path === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(path);
	}
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
	</ul>
</nav>

<style>
	nav {
		position: sticky;
		top: 0;
		z-index: 50;
		background: #ffffff;
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
		color: #4b5563;
		font-weight: 500;
		transition: color 0.15s;
	}
	a:hover {
		color: #1f2937;
	}
	a.active {
		color: #2563eb;
		/* color: #ff2a2aff; */
		font-weight: 700;
	}
</style>