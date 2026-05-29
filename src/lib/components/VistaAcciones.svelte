<script lang="ts">
	interface Props {
		urlVideo: string;
		equipo: Puesto[];
		cambiarVista: () => void;
	}

    type Puesto = {
		player: Player | null;
		numero: number;
		posicionOriginal: string;
	};

	type Accion = {
		timestamp: number;
		player: Player;
		skill: Skill;
		calificacion: Calificacion;
	};

	type Player = {
		id: number;
		nombre: string;
		apellido: string;
		posicion: string;
		categoria: string;
	};

	type Skill = (typeof LISTADO_SKILLS)[number];

	type Calificacion = (typeof LISTADO_CALIFICACIONES_SKILLS)[number];

	const LISTADO_SKILLS = [
		'Duelo',
		'Tackle',
		'Pase',
		'Ruck',
		'Pesca',
		'Contra ruck',
		'Recepción',
		'Intercepción',
		'Patada',
		'Drop',
		'Palos',
		'Salida',
		'Lanzamiento line'
	] as const;

	const LISTADO_CALIFICACIONES_SKILLS = ['Negativo', 'Neutro', 'Positivo'] as const;

	let { acciones }: { acciones: Accion[] } = $props();
</script>

<div>
	<div>
		{#each acciones as a (a)}
			a
		{/each}
	</div>

</div>

<style>
</style>
