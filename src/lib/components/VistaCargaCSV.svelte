<script lang="ts">
	import type { Player } from '$lib/types';

	let { jugadores = $bindable(), cambiarVista }: { jugadores: Player[]; cambiarVista: () => void } =
		$props();

	let error = $state('');
	let parsed = $state<Player[]>([]);
	let dragOver = $state(false);

	function handleFile(file: File) {
		error = '';
		parsed = [];

		if (!file.name.endsWith('.csv')) {
			error = 'El archivo debe ser .csv';
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			const lines = text.trim().split(/\r?\n/);
			const data = lines
				.slice(1)
				.filter((l) => l.split(',').length >= 4)
				.map((l, i) => {
					const c = l.split(',');
					return {
						id: i + 1,
						nombre: c[0].trim(),
						apellido: c[1].trim(),
						posicion: c[2].trim(),
						categoria: c[3].trim().toLowerCase() as 'forward' | 'back'
					};
				});

			if (!data.length) {
				error = 'No se encontraron jugadores válidos en el CSV';
				return;
			}

			parsed = data;
		};
		reader.readAsText(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const file = e.dataTransfer?.files[0];
		if (file) handleFile(file);
	}

	function confirmar() {
		jugadores = parsed;
		cambiarVista();
	}

	function replaceCSV(): void {
		if (jugadores.length === 0 && parsed.length === 0) return;
		jugadores = [];
		jugadores = [...jugadores];
		parsed = [];
		error = '';
	}

	function simularPlantel(): void {
		const fileUrl = '/plantilla-jugadores.csv';
		parsed = [];

		fetch(fileUrl)
			.then((response) => {
				if (!response.ok) {
					throw new Error('No se pudo cargar el archivo');
				}
				return response.text();
			})
			.then((text) => {
				const lines = text.trim().split(/\r?\n/);
				const data = lines
					.slice(1)
					.filter((l) => l.split(',').length >= 4)
					.map((l, i) => {
						const c = l.split(',');
						return {
							id: i + 1,
							nombre: c[0].trim(),
							apellido: c[1].trim(),
							posicion: c[2].trim(),
							categoria: c[3].trim().toLowerCase() as 'forward' | 'back'
						};
					});

				parsed = data;
				confirmar(); // Se ejecuta dentro del flujo asíncrono
			})
			.catch((error) => {
				console.error('Error al simular plantel:', error);
			});
	}
</script>

<section class="pantalla-carga">
	<h2>Cargar plantel</h2>

	<div class="tarjeta-opcion">
		<h2>Tengo un excel de jugadores</h2>
		<label
			for="csv-upload"
			class="zona-drop"
			class:drag-over={dragOver}
			ondragover={(e) => {
				e.preventDefault();
				dragOver = true;
			}}
			ondragleave={() => {
				dragOver = false;
			}}
			ondrop={handleDrop}
		>
			<input
				id="csv-upload"
				type="file"
				accept=".csv"
				class="input-hidden"
				onchange={(e) => {
					const file = (e.target as HTMLInputElement).files?.[0];
					if (file) handleFile(file);
				}}
			/>
			<span class="texto-secundario">Hacé clic o arrastrá un archivo CSV</span>
			<span class="texto-ayuda">Columnas: nombre, apellido, posición, categoría (forward/back)</span
			>
		</label>

		{#if error}
			<p class="mensaje-error">{error}</p>
		{/if}

		{#if parsed.length > 0}
			<div class="contenedor-tabla">
				<div class="tabla-preview">
					<table>
						<thead>
							<tr>
								<th>Nombre</th>
								<th>Apellido</th>
								<th>Posición</th>
								<th>Categoría</th>
							</tr>
						</thead>
						<tbody>
							{#each parsed as p (p.id)}
								<tr>
									<td>{p.nombre}</td>
									<td>{p.apellido}</td>
									<td>{p.posicion}</td>
									<td>{p.categoria}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<p class="texto-contador">
					{parsed.length} jugador{parsed.length === 1 ? '' : 'es'} cargados
				</p>

				<div class="contenedor-acciones">
					<button onclick={replaceCSV} class="btn-secondary"> Reemplazar CSV 🗑 </button>

					<button onclick={confirmar} class="btn-primary"> Confirmar plantel </button>
				</div>
			</div>
		{/if}
	</div>

	<div class="tarjeta-opcion">
		<h2>No tengo un excel de jugadores</h2>
		<button onclick={simularPlantel} class="btn-primary"> Simular plantel </button>
	</div>
</section>

<style>
	/* ========== LAYOUT PRINCIPAL ========== */
	.pantalla-carga {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 32px;
		padding: 40px 32px;
		font-family: sans-serif;
		max-width: 960px;
		margin: 0 auto;
	}

	@media (max-width: 768px) {
		.pantalla-carga {
			grid-template-columns: 1fr;
		}
	}

	/* ========== TÍTULOS ========== */
	h2 {
		color: #0f172a;
		margin: 0 0 4px 0;
		font-size: 1.35rem;
		font-weight: 700;
	}

	.pantalla-carga > h2 {
		grid-column: 1 / -1;
		margin-bottom: 8px;
	}

	.tarjeta-opcion h2 {
		font-size: 1.1rem;
		margin: 0;
	}

	/* ========== TARJETAS ========== */
	.tarjeta-opcion {
		background: white;
		padding: 32px 24px;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 16px;
		/* justify-content: center; */
	}

	/* ========== TEXTOS AUXILIARES ========== */
	.texto-secundario {
		font-size: 0.875rem;
		line-height: 1.25rem;
		color: rgb(107, 114, 128);
		margin: 0;
	}

	.texto-ayuda {
		font-size: 0.875rem;
		line-height: 1.25rem;
		color: rgb(107, 114, 128);
		margin: 0;
	}

	.texto-contador {
		color: #334155;
		margin: 0;
	}

	.mensaje-error {
		color: #dc2626;
		margin: 0;
		width: 100%;
		text-align: left;
	}

	/* ========== BOTONES ========== */
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
		margin: 50px;
	}

	.btn-primary:hover {
		background-color: #1d4ed8;
	}

	.btn-primary:disabled {
		background-color: #cbd5e1;
		color: #94a3b8;
		cursor: not-allowed;
	}

	.btn-secondary {
		background-color: transparent;
		border: 1px solid #cbd5e1;
		color: #475569;
		padding: 12px 24px;
		font-size: 0.95rem;
		font-weight: bold;
		border-radius: 8px;
		cursor: pointer;
		transition:
			background-color 0.2s,
			border-color 0.2s;
		font-family: sans-serif;
	}

	.btn-secondary:hover {
		background-color: #f8fafc;
		border-color: #94a3b8;
	}

	/* ========== ZONA DE DROP ========== */
	.zona-drop {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		cursor: pointer;
		padding: 48px;
		border: 2px dashed #d1d5db;
		border-radius: 8px;
		transition:
			border-color 0.2s,
			background-color 0.2s;
		width: 100%;
		box-sizing: border-box;
	}

	.zona-drop.drag-over {
		border-color: #2563eb;
		background-color: #eff6ff;
	}

	.input-hidden {
		display: none;
	}

	/* ========== TABLA DE PREVIEW ========== */
	.contenedor-tabla {
		margin-top: 32px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		width: 100%;
	}

	.tabla-preview {
		overflow-x: auto;
		border-radius: 0.125rem;
		border: 1px solid rgb(229, 231, 235);
	}

	.tabla-preview table {
		width: 100%;
		text-align: left;
		font-size: 0.875rem;
		line-height: 1.25rem;
		border-collapse: collapse;
	}

	.tabla-preview th {
		border-bottom: 1px solid rgb(229, 231, 235);
		background-color: rgb(249, 250, 251);
		padding: 0.5rem 1rem;
		font-weight: 500;
		color: rgb(75, 85, 99);
	}

	.tabla-preview td {
		padding: 0.5rem 1rem;
		border-bottom: 1px solid rgb(243, 244, 246);
	}

	.tabla-preview tbody tr:last-child td {
		border-bottom: none;
	}

	/* ========== CONTENEDOR DE ACCIONES ========== */
	.contenedor-acciones {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}
</style>
