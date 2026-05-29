<script lang="ts">
	interface Props {
		urlVideo: string;
		equipo: Puesto[];
		cambiarVista: () => void;
	}

	type Player = {
		id: number;
		nombre: string;
		apellido: string;
		posicion: string;
		categoria: string;
	};

	type Puesto = {
		player: Player | null;
		numero: number;
		posicionOriginal: string;
	};

	// type Skill = 'Tackle' | 'Duelo' | 'Pase' | 'Ruck' | 'Patada' | 'Recepción';
	// type Calificacion = 'Negativo' | 'Neutro' | 'Positivo';

	type Accion = {
		timestamp: number;
		player: Player;
		skill: Skill;
		calificacion: Calificacion;
	};

	let skills = $state(['Tackle', 'Duelo', 'Pase', 'Ruck', 'Recepción', 'Patada'] as const);
	type Skill = (typeof skills)[number];

	let calificaciones = ['Negativo', 'Neutro', 'Positivo'] as const;
	type Calificacion = (typeof calificaciones)[number];

	let acciones = $state<Accion[]>([]);
	let pilaRedo = $state<Accion[]>([]);
	let { urlVideo = $bindable(), cambiarVista, equipo = $bindable() }: Props = $props();
	let playerSelected = $state<Player | null>(null);
	let skillSelected = $state<Skill | null>(null);
	let qualiSelected = $state<Calificacion | null>(null);

	function rehacer(): void {
		if (pilaRedo.length === 0) return;

		const recuperada = pilaRedo.pop();

		if (recuperada) {
			acciones.push(recuperada);
			acciones = [...acciones];
		}
	}

	function deshacer(): void {
		if (pilaRedo.length === 0) return;
		const recuperada = pilaRedo.pop();
		if (recuperada) {
            pilaRedo.push(recuperada);
			acciones = [...acciones];
		}
	}

	function seleccionarJugador(j: Player): void {
		const resto = equipo.filter((p) => p.player != j);
		resto.map((p) => p == null);
		equipo = [...resto];
	}

	function seleccionarSkill(s: Skill): void {
		const resto = skills.filter((sk) => sk != s);
		resto.map((s) => s == null);
		skills = [...resto];
	}
</script>

<div class="pantalla-analisis">
	<div class="video-container">
		<iframe
			src={urlVideo}
			title="Video Player"
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen
		></iframe>
	</div>

	<div class="equipo">
		<h2>Jugadores</h2>
		{#each equipo as j (j.numero)}
			<button
				disabled={playerSelected}
				onclick={() => seleccionarJugador(j.player)}
				class="btn-confirmar"
			>
				{j.player?.apellido}
			</button>
		{/each}
	</div>

	<div class="accion-grid">
		<h2>Acciones</h2>
		{#each skills as skill (skill)}
			<button disabled={!skillSelected} onclick={seleccionarSkill(skill)} class="btn-confirmar">
				{skill}
			</button>
		{/each}

		{#each calificaciones as quali (quali)}
			<button
				disabled={!qualiSelected}
				onclick={confirmarAccion(quali, skill)}
				class="btn-confirmar"
			>
				{quali}
			</button>
		{/each}
	</div>
</div>

<style>
	.pantalla-analisis {
		display: grid;
		grid-template-columns: 66.6% 1fr;
		gap: 24px;
		padding: 20px;
		height: 85vh;
		box-sizing: border-box;
		font-family: sans-serif;
		margin: 0 auto;
		justify-content: center;
	}

	.video-container {
		position: relative;
		padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
		height: 0;
		overflow: hidden;
		max-width: 100%;
	}

	.video-container iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.accion-grid {
		display: grid;
		grid-template-columns: 2fr repeat(3, 1fr);
		gap: 10px;
	}

	.btn-confirmar {
		background-color: #2563eb;
		color: white;
		border: none;
		padding: 12px 24px;
		font-size: 1rem;
		font-weight: bold;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	.btn-confirmar:hover {
		background-color: #1d4ed8;
	}

	.btn-confirmar:disabled {
		background-color: #cbd5e1;
		color: #94a3b8;
		cursor: not-allowed;
	}
</style>
