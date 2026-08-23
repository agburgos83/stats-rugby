<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import { loadFromStorage } from '$lib/stores.svelte';
	import type { PartidoContexto } from '$lib/types';

	let {
		vistaActual,
		partido,
		hayAcciones,
		onEditarPartido,
		onTerminarAnalisis,
		onVolverAnalisis,
		onFinalizar
	}: {
		vistaActual?: number;
		partido?: PartidoContexto;
		hayAcciones?: boolean;
		onEditarPartido?: () => void;
		onTerminarAnalisis?: () => void;
		onVolverAnalisis?: () => void;
		onFinalizar?: () => void;
	} = $props();

	let hayDatos = $state(false);

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		$page.url.pathname; // ← fuerza re-ejecución en cada navegación
		if (!browser) return;
		const saved = loadFromStorage();
		hayDatos = Array.isArray(saved.jugadores) && saved.jugadores.length > 0;
	});

	const esApp = $derived($page.url.pathname.startsWith('/app'));
	const esSala = $derived($page.url.pathname.startsWith('/sala'));
</script>

<header class="cabecera">
	<div class="cabecera-izq">
		<a href={resolve('/')} class="cabecera-marca">Stats Rugby</a>
		{#if esApp && vistaActual === 4}
			<span class="cabecera-titulo">Análisis {partido?.local} vs {partido?.visitante}</span>
		{:else if esApp && vistaActual === 5}
			<span class="cabecera-titulo"
				>Resumen de acciones {partido?.local} vs {partido?.visitante}</span
			>
		{/if}
		{#if !esApp && !esSala && hayDatos}
			<a href={resolve('/app')} class="retomar-btn">Retomar análisis</a>
		{/if}
	</div>

	{#if esApp && vistaActual === 4}
		<div class="cabecera-botones">
			<button onclick={onEditarPartido} class="btn-secundario">← Editar partido</button>
			<button onclick={onTerminarAnalisis} disabled={!hayAcciones} class="btn-primary">
				Terminar análisis →
			</button>
		</div>
	{:else if esApp && vistaActual === 5}
		<div class="cabecera-botones">
			<button onclick={onVolverAnalisis} class="btn-secundario">← Retomar análisis</button>
			<button onclick={onFinalizar} class="btn-primary">Finalizar</button>
		</div>
	{/if}
</header>

<style>
	.cabecera {
		position: sticky;
		top: 0;
		z-index: 40;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 2rem;
		background: white;
		border-bottom: 1px solid #e5e7eb;
	}
	.cabecera-izq {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}
	.cabecera-marca {
		font-weight: 700;
		color: #0068ce;
	}

	.cabecera-titulo {
		font-weight: 600;
		color: #111827;
	}

	.cabecera-botones {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.btn-secundario {
		background-color: white;
		color: #0068ce;
		border: 1px solid #0068ce;
		padding: 8px 16px;
		font-size: 0.9rem;
		font-weight: bold;
		border-radius: 6px;
		cursor: pointer;
	}
	.btn-secundario:hover {
		background-color: #f0f6fd;
	}
	.btn-primary {
		background-color: #0068ce;
		color: white;
		border: none;
		padding: 8px 16px;
		font-size: 0.9rem;
		font-weight: bold;
		border-radius: 6px;
		cursor: pointer;
	}
	.btn-primary:hover {
		background-color: #0050a0;
	}
	.btn-primary:disabled {
		background-color: #cbd5e1;
		color: #94a3b8;
		cursor: not-allowed;
	}

	.retomar-btn {
		position: relative;
		display: inline-block;
		background: white;
		color: #0050a0;
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
		0%,
		100% {
			opacity: 0.3;
			box-shadow: 0 0 4px 1px rgba(220, 38, 38, 0.3);
		}
		50% {
			opacity: 1;
			box-shadow: 0 0 10px 4px rgba(220, 38, 38, 0.7);
		}
	}

	.retomar-btn:hover {
		/* background: #f0f6fd; */
		transform: scale(1.05);
		/* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); */
	}
</style>
