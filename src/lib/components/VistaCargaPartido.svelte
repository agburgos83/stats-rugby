<script lang="ts">
	import { type PropsCargapartido } from '$lib/types';

	let { partido = $bindable(), cambiarVista }: PropsCargapartido = $props();

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
			partido.puntosLocal !== null &&
			partido.puntosVisitante !== null &&
			partido.union.trim() !== '' &&
			partido.division.trim() !== '' &&
			partido.fecha.trim() !== '' &&
			partido.urlVideo.trim() !== ''
	);

	let botonHabilitado = $derived(esUrlValida(partido.urlVideo) && formValido);
</script>

<div class="contenedor-centrado">
	<div class="tarjeta-formulario">
		<h2>Datos del Partido</h2>
		<p class="subtitulo">Información clave para la cabecera del reporte final.</p>

		<!-- Fila 1: Torneo y División paralelos -->
		<div class="fila-formulario">
			<div class="campo-formulario flex-1">
				<label for="union-select">Unión / Torneo</label>
				<select id="union-select" bind:value={partido.union} class="input-control">
					<option value="URBA">URBA (Buenos Aires)</option>
					<option value="URS">URS (Sur)</option>
					<option value="UROBA">UROBA (Oeste)</option>
					<option value="URMDP">URMDP (Mar del Plata)</option>
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
				<label>Equipo Local</label>
				<input
					type="text"
					bind:value={partido.local}
					placeholder="Ej: Berisso R.C."
					class="input-control"
				/>
			</div>
			<div class="campo-formulario flex-1">
				<label>Equipo Visitante</label>
				<input
					type="text"
					bind:value={partido.visitante}
					placeholder="Ej: Beromama R.C."
					class="input-control"
				/>
			</div>
		</div>

		<!-- Fila 3: Tanteador y Fecha balanceados -->
		<div class="fila-formulario">
			<div class="campo-formulario flex-sub">
				<label>Puntos Local</label>
				<input
					type="number"
					min="0"
					bind:value={partido.puntosLocal}
					placeholder="0"
					class="input-control"
				/>
			</div>
			<div class="campo-formulario flex-sub">
				<label>Puntos Visitante</label>
				<input
					type="number"
					min="0"
					bind:value={partido.puntosVisitante}
					placeholder="0"
					class="input-control"
				/>
			</div>
			<div class="campo-formulario flex-1">
				<label for="fecha-partido">Fecha del Partido</label>
				<input id="fecha-partido" type="date" bind:value={partido.fecha} class="input-control" />
			</div>
		</div>

		<hr class="separador" />

		<h2>Video del Partido</h2>
		<p class="subtitulo">Acepta enlaces de YouTube, Vimeo, Veo y plataformas web.</p>
		<input
			type="text"
			bind:value={partido.urlVideo}
			placeholder="https://youtube.com..."
			class="input-control input-url"
		/>

		<div class="contenedor-boton">
			<button disabled={!botonHabilitado} onclick={cambiarVista} class="btn-primary">
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
		font-family: sans-serif;
		padding: 40px 20px;
		background-color: #f8fafc;
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
	/* Proporción más chica para los inputs de puntaje */
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
		font-family: sans-serif;
	}
	.input-control:focus {
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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
		background-color: #2563eb;
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
		background-color: #1d4ed8;
	}
	.btn-primary:disabled {
		background-color: #cbd5e1;
		color: #94a3b8;
		cursor: not-allowed;
	}
</style>
