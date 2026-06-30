<script lang="ts">
	import { procesarReporte } from '$lib/processing/reporte-data';
	import { descargarPDF } from '$lib/pdf/reporte';

	let { equipo, partido, acciones, teamAcciones, cambiarVista } = $props();

	async function generarReporte(): Promise<void> {
		const { matrizProcesada, dixTotales } = procesarReporte(equipo, acciones, teamAcciones);
		await descargarPDF(equipo, partido, matrizProcesada, dixTotales);
	}
	
</script>

<div class="pantalla-reporte">
	<h2>Resumen de acciones {partido.local} vs {partido.visitante}</h2>
	<div class="contenedor-pilas">
		<!-- pila acciones jugador -->
		<div class="columna-historial">
			<h3>Historial de acciones individuales</h3>
			<div class="lista-scroll">
				{#each acciones as a (a)}
					<div class="tarjeta-log individual">
						<!-- <span class="badge-fase">{a.timestamp}</span> -->
						<span class="badge-jugador">{a.player.apellido}</span>
						<span class="texto-accion"><strong>{a.skill}</strong>: {a.calificacion}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- pila situaciones juego -->
		<div class="columna-historial">
			<h3>Historial de situaciones de juego</h3>
			<div class="lista-scroll">
				{#each teamAcciones as ta (ta)}
					<div class="tarjeta-log equipo">
						<!-- <span>Time: {new Date(ta.timestamp).toLocaleTimeString()}</span> -->
						<!-- <span class="badge-fase">{ta.timestamp}</span> -->
						<span class="badge-fase">{ta.situacion}</span>
						<span class="texto-accion">Resultado: <strong>{ta.calificacion}</strong></span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="contenedor-acciones-pie">
		<button
			onclick={() => {
				generarReporte();
				cambiarVista();
			}}
			class="btn-primary"
		>
			Descargar Reporte PDF →
		</button>
	</div>
</div>

<style>
	.pantalla-reporte {
		padding: 24px;
		font-family: sans-serif;
		max-width: 1200px;
		margin: 0 auto;
	}

	h2 {
		color: #0f172a;
		margin: 0 0 32px 0;
		font-size: 1.35rem;
		font-weight: 700;
	}

	/* Disposición en dos columnas paralelas */
	.contenedor-pilas {
		display: flex;
		gap: 24px;
		margin-bottom: 24px;
	}

	.columna-historial {
		flex: 1;
		background-color: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 16px;
		display: flex;
		flex-direction: column;
	}

	.columna-historial h3 {
		font-size: 1.1rem;
		font-weight: 700;
		color: #334155;
		margin-top: 0;
		margin-bottom: 16px;
		border-bottom: 1px solid #f1f5f9;
		padding-bottom: 8px;
	}

	/* LA CLAVE: Altura fija de 400px y scroll vertical automático si desborda */
	.lista-scroll {
		max-height: 400px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-right: 4px;
	}

	/* Tarjetas visuales de cada fila del log */
	.tarjeta-log {
		display: flex;
		align-items: center;
		gap: 12px;
		background-color: white;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 10px 12px;
		font-size: 0.85rem;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
	}

	.badge-jugador {
		background-color: #eff6ff;
		color: #2563eb;
		font-weight: bold;
		padding: 4px 8px;
		border-radius: 4px;
	}
	.badge-fase {
		background-color: #f0fdf4;
		color: #16a34a;
		font-weight: bold;
		padding: 4px 8px;
		border-radius: 4px;
	}
	.texto-accion {
		color: #334155;
	}

	.contenedor-acciones-pie {
		display: flex;
		justify-content: flex-end;
		border-top: 1px solid #e2e8f0;
		padding-top: 16px;
	}

	.btn-primary {
		background-color: #2563eb;
		color: white;
		border: none;
		padding: 12px 24px;
		font-size: 1rem;
		font-weight: bold;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.1s ease;
	}
	.btn-primary:hover {
		background-color: #1d4ed8;
	}
</style>
