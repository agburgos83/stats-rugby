<script lang="ts">
	import VistaSala from '$lib/components/VistaSala.svelte';
	let { data } = $props();
</script>

<VistaSala sala={data.sala} />
