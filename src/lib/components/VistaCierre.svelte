<script lang="ts">
	let { cambiarVista } = $props();

	function nuevoAnalisis() {
		cambiarVista();
	}
</script>

<section class="pantalla-cierre">
	<h2>Muchas gracias por elegir</h2>
	<br/>
	<img src="/logo-app-blue-400.svg" alt="Stats Rugby Logo" class="logo-cierre" />
	<hr class="separador" />
	<button onclick={nuevoAnalisis} class="btn-primary"> Nuevo análisis </button>
</section>

<style>
	.logo-cierre {
		margin-bottom: 1.5rem;
		height: auto;
		width: 16rem;
	}

	.separador {
		border: none;
		border-top: 1px solid #e2e8f0;
		margin: 1.5rem 0;
		width: 100%;
	}

	.pantalla-cierre {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 16px;
		padding: 80px 32px;
		max-width: 480px;
		margin: 0 auto;
		justify-content: center;
	}

	h2 {
		color: #47484a;
		margin: 0;
		font-size: 1.35rem;
		font-weight: 700;
	}

	.btn-primary {
		background-color: #0068CE;
		color: white;
		border: none;
		padding: 12px 24px;
		font-size: 0.95rem;
		font-weight: bold;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	.btn-primary:hover {
		background-color: #0050A0;
	}
</style>
