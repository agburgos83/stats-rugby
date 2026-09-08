<script lang="ts">
	import {
		type PropsCargaPartido,
		EQUIPOS_POR_UNION,
		TORNEO_REGIONAL_PAMPEANO,
		type UnionClave
	} from '$lib/types';

	type TorneoValor = UnionClave | 'REGIONAL_PAMPEANO';

	let { partido = $bindable(), cambiarVista }: PropsCargaPartido = $props();

	let torneo = $state<TorneoValor>(partido.usuarioUnion);

	function esUrlValida(texto: string): boolean {
		if (!texto) return false;
		try {
			const objetoUrl = new URL(texto);
			return objetoUrl.protocol === 'http:' || objetoUrl.protocol === 'https:';
		} catch {
			return false;
		}
	}

	// 2. Validación estricta y segura
	let formValido = $derived(
		partido.local.trim() !== '' &&
			partido.visitante.trim() !== '' &&
			esPuntajeValido(partido.puntosLocal) &&
			esPuntajeValido(partido.puntosVisitante) &&
			(partido.usuarioUnion ?? '').trim() !== '' &&
			(partido.usuarioClub ?? '').trim() !== '' &&
			partido.division.trim() !== '' &&
			partido.fecha.trim() !== '' &&
			partido.urlVideo.trim() !== '' &&
			partido.local !== partido.visitante &&
			(partido.local === partido.usuarioClub || partido.visitante === partido.usuarioClub)
	);

	let botonHabilitado = $derived(esUrlValida(partido.urlVideo) && formValido);

	function esPuntajeValido(n: number | null): boolean {
		if (n === null) return false;
		return n !== 1 && n !== 2 && n !== 4;
	}

	function clubesDisponibles(): string[] {
		let labels: string[];
		if (torneo === 'REGIONAL_PAMPEANO') {
			labels = TORNEO_REGIONAL_PAMPEANO.uniones.flatMap((u) =>
				EQUIPOS_POR_UNION[u].map((e) => e.label)
			);
		} else {
			labels = EQUIPOS_POR_UNION[torneo].map((e) => e.label);
		}
		return [...new Set(labels)];
	}
</script>

<div class="contenedor-centrado">
	<div class="tarjeta-formulario">
		<h2>Datos del partido</h2>

		<!-- Fila 1: Torneo y División paralelos -->
		<div class="fila-formulario">
			<div class="campo-formulario flex-1">
				<label for="union-select">Torneo</label>
				<select id="union-select" bind:value={torneo} class="input-control">
					<option value={partido.usuarioUnion}>{partido.usuarioUnion}</option>
					{#if TORNEO_REGIONAL_PAMPEANO.uniones.some((u) => u === partido.usuarioUnion)}
						<option value="REGIONAL_PAMPEANO">Torneo Regional Pampeano</option>
					{/if}
				</select>
			</div>

			<div class="campo-formulario flex-1">
				<label for="division-select">División</label>
				<select id="division-select" bind:value={partido.division} class="input-control">
					<option value="Primera">Primera</option>
					<option value="Intermedia">Intermedia</option>
					<option value="Pre A">Pre A</option>
					<option value="Pre B">Pre B</option>
					<option value="M22 A">M22 A</option>
					<option value="M22 B">M22 B</option>
					<option value="M19 A">M19 A</option>
					<option value="M19 B">M19 B</option>
				</select>
			</div>
		</div>

		<!-- Fila 2: Equipos en paralelo -->

		<div class="fila-formulario">
			<div class="campo-formulario flex-1">
				<div class="fila-formulario">
					<div class="campo-formulario flex-1">
						<label for="equipo-local-select">Equipo Local</label>
						<select id="equipo-local-select" bind:value={partido.local} class="input-control">
							{#each clubesDisponibles().filter((e) => e !== partido.visitante) as equipo (equipo)}
								<option value={equipo}>{equipo}</option>
							{/each}
						</select>
					</div>

					<div class="campo-formulario flex-1">
						<label for="equipo-visitante-select">Equipo Visitante</label>
						<select
							id="equipo-visitante-select"
							bind:value={partido.visitante}
							class="input-control"
						>
							{#each clubesDisponibles().filter((e) => e !== partido.local) as equipo (equipo)}
								<option value={equipo}>{equipo}</option>
							{/each}
						</select>
					</div>
				</div>

				<div>
					{#if partido.local !== '' && partido.visitante !== ''}
						{#if partido.local !== partido.usuarioClub && partido.visitante !== partido.usuarioClub}
							<span class="error-texto"
								>Alguno de los dos equipos debe ser {partido.usuarioClub}</span
							>
						{/if}
					{/if}
				</div>
			</div>
		</div>

		<!-- Fila 3: Tanteador y Fecha balanceados -->
		<div class="fila-formulario">
			<div class="campo-formulario flex-sub">
				<label for="partido-puntos-local">Puntos Local</label>
				<input
					id="partido-puntos-local"
					type="number"
					min="0"
					bind:value={partido.puntosLocal}
					placeholder="0"
					class="input-control"
				/>
				{#if partido.puntosLocal !== null && !esPuntajeValido(partido.puntosLocal)}
					<span class="error-texto">Puntaje inválido</span>
				{/if}
			</div>
			<div class="campo-formulario flex-sub">
				<label for="partido-puntos-visitante">Puntos Visitante</label>
				<input
					id="partido-puntos-visitante"
					type="number"
					min="0"
					bind:value={partido.puntosVisitante}
					placeholder="0"
					class="input-control"
				/>
				{#if partido.puntosVisitante !== null && !esPuntajeValido(partido.puntosVisitante)}
					<span class="error-texto">Puntaje inválido</span>
				{/if}
			</div>
			<div class="campo-formulario flex-1">
				<label for="fecha-partido">Fecha del Partido</label>
				<input id="fecha-partido" type="date" bind:value={partido.fecha} class="input-control" />
			</div>
		</div>

		<hr class="separador" />

		<h2>Video del partido</h2>
		<p class="subtitulo">Acepta enlaces de Veo, YouTube y Vimeo.</p>
		<input
			type="text"
			bind:value={partido.urlVideo}
			placeholder="https://youtube.com..."
			class="input-control input-url"
		/>

		<div class="contenedor-boton">
			<button disabled={!botonHabilitado} onclick={() => cambiarVista(4)} class="btn-primary">
				Comenzar Análisis →
			</button>
		</div>
	</div>
</div>

<style>
	.contenedor-centrado {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 90vh;
		padding: 40px 20px;
		/* background-color: #f8fafc; */
	}
	.tarjeta-formulario {
		background: white;
		padding: 32px;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
		width: 100%;
		max-width: 550px;
		box-sizing: border-box;
		text-align: left;
	}
	h2 {
		color: #0f172a;
		margin: 0 0 4px 0;
		font-size: 1.35rem;
		font-weight: 700;
	}
	.subtitulo {
		color: #64748b;
		margin: 0 0 20px 0;
		font-size: 0.88rem;
		line-height: 1.4;
	}
	.fila-formulario {
		display: flex;
		gap: 16px;
		margin-bottom: 4px;
	}
	.campo-formulario {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 14px;
	}
	.flex-1 {
		flex: 1;
	}
	.flex-sub {
		flex: 0.6;
	}
	label {
		font-size: 0.85rem;
		font-weight: 600;
		color: #475569;
	}
	.input-control {
		width: 100%;
		padding: 10px 12px;
		font-size: 0.95rem;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		outline: none;
		box-sizing: border-box;
		background-color: #fff;
		color: #1e293b;
		transition: border-color 0.15s ease;
	}
	.input-control:focus {
		border-color: #0068ce;
		box-shadow: 0 0 0 3px rgba(0, 104, 206, 0.1);
	}
	.separador {
		border: 0;
		border-top: 1px solid #e2e8f0;
		margin: 24px 0;
	}
	.input-url {
		margin-bottom: 20px;
	}
	.contenedor-boton {
		text-align: right;
	}
	.btn-primary {
		background-color: #0068ce;
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
		background-color: #0050a0;
	}
	.btn-primary:disabled {
		background-color: #cbd5e1;
		color: #94a3b8;
		cursor: not-allowed;
	}

	.error-texto {
		color: #e63946;
		font-size: 0.72rem;
		font-weight: 500;
		margin-top: 2px;

		/* Truco avanzado de CSS: ocupa espacio visual pero no empuja el diseño */
		height: 0px;
		overflow: visible;
		white-space: nowrap;
	}
	.input-control:has(+ .error-texto) {
		border-color: #e63946;
	}
</style>
