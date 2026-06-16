<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Menu from '$lib/components/Menu.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Menu />

<main class="min-h-screen">
	{@render children()}
</main>
