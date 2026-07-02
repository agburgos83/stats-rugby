<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Menu from '$lib/components/Menu.svelte';
	import fondo from '$lib/assets/fondo.svg';
	import { page } from '$app/stores';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

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
