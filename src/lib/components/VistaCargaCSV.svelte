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
</script>

<section>
	<h2 class="titulo-seccion">Cargar plantel</h2>

	{#if jugadores.length === 0 && parsed.length === 0}
		<label
			for="csv-upload"
			class="flex cursor-pointer flex-col items-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors"
			class:border-blue-500={dragOver}
			class:border-gray-300={!dragOver}
			class:bg-blue-50={dragOver}
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
				class="hidden"
				onchange={(e) => {
					const file = (e.target as HTMLInputElement).files?.[0];
					if (file) handleFile(file);
				}}
			/>
			<span class="text-gray-500">Hacé clic o arrastrá un archivo CSV</span>
			<span class="text-sm text-gray-400"
				>Columnas: nombre, apellido, posición, categoría (forward/back)</span
			>
		</label>

		{#if error}
			<p class="mt-6 text-red-600">{error}</p>
		{/if}
	{/if}

	{#if parsed.length > 0}
		<div class="space-y-6">
			<div class="overflow-x-auto rounded-sm border border-gray-200">
				<table class="w-full text-left text-sm">
					<thead class="border-b border-gray-200 bg-gray-50">
						<tr>
							<th class="px-4 py-2 font-medium text-gray-600">Nombre</th>
							<th class="px-4 py-2 font-medium text-gray-600">Apellido</th>
							<th class="px-4 py-2 font-medium text-gray-600">Posición</th>
							<th class="px-4 py-2 font-medium text-gray-600">Categoría</th>
						</tr>
					</thead>
					<tbody>
						{#each parsed as p (p.id)}
							<tr class="border-b border-gray-100 last:border-0">
								<td class="px-4 py-2">{p.nombre}</td>
								<td class="px-4 py-2">{p.apellido}</td>
								<td class="px-4 py-2">{p.posicion}</td>
								<td class="px-4 py-2">{p.categoria}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<p class="text-gray-700">
				{parsed.length} jugador{parsed.length === 1 ? '' : 'es'} cargados
			</p>

			<div class="flex justify-end gap-4">
				<button
					onclick={replaceCSV}
					class="rounded-sm bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
				>
					Reemplazar CSV 🗑
				</button>

				<button
					onclick={confirmar}
					class="rounded-sm bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
				>
					Confirmar plantel
				</button>
			</div>
		</div>
	{/if}
</section>

<style>
	section {
		margin: 0 auto;
		max-width: 42rem;
		padding: 2rem 1.5rem;
	}

	.titulo-seccion {
		font-size: 1.35rem;
		font-weight: 700;
		color: #0f172a;
		margin: 0 0 32px 0;
	}
</style>
