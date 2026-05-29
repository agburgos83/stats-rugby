<script lang="ts">
	let { cambiarVista } = $props();
</script>

<div class="pantalla-bienvenida">
	<img src="/1f575.svg" alt="Logo Analizador Rugby" class="logo" />
	<h1>Analizador de Partidos</h1>
	<p class="descripcion">
		Cargá los 23 jugadores convocados del fin de semana <br>
		y empezá a calificar las acciones del partido.
	</p>
	<button onclick={cambiarVista} class="btn-primary">
		Cargar jugadores →
	</button>
</div>

<style>
	.pantalla-bienvenida {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		text-align: center;
		font-family: sans-serif;
		background-color: #f8fafc;
		padding: 20px;
	}
	.logo {
		width: 150px;
		margin-bottom: 24px;
	}
	h1 {
		color: #1e293b;
		margin-bottom: 12px;
		font-size: 2.5rem;
	}
	.descripcion {
		color: #64748b;
		max-width: 500px;
		font-size: 1.1rem;
		line-height: 1.6;
		margin-bottom: 32px;
	}
	.btn-primary {
		background-color: #2563eb;
		color: white;
		border: none;
		padding: 12px 24px;
		font-size: 1rem;
		font-weight: bold;
		border-radius: 8px;
		cursor: pointer;
	}
</style>
