<script lang="ts">
	let { cambiarVista } = $props();

	function nuevoAnalisis() {
		cambiarVista();
	}
</script>

<section class="pantalla-cierre">
	<h2>Muchas gracias por usar Stats Rugby</h2>
	<br/>
	<button onclick={nuevoAnalisis} class="btn-primary"> Nuevo análisis </button>
</section>

<style>
	.pantalla-cierre {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 16px;
		padding: 80px 32px;
		font-family: sans-serif;
		max-width: 480px;
		margin: 0 auto;
		justify-content: center;
	}

	h2 {
		color: #0f172a;
		margin: 0;
		font-size: 1.35rem;
		font-weight: 700;
	}

	.btn-primary {
		background-color: #2563eb;
		color: white;
		border: none;
		padding: 12px 24px;
		font-size: 0.95rem;
		font-weight: bold;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.2s;
		font-family: sans-serif;
	}

	.btn-primary:hover {
		background-color: #1d4ed8;
	}
</style>
