import type { Puesto, Accion, TeamAccion, Skill, SituacionJuego, CalificacionIndividual, CalificacionGrupal } from './types';

function rand(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickCalif(weights: Record<CalificacionIndividual, number>): CalificacionIndividual {
	const entries = Object.entries(weights) as [CalificacionIndividual, number][];
	const total = entries.reduce((s, [, w]) => s + w, 0);
	let r = Math.random() * total;
	for (const [calif, w] of entries) {
		r -= w;
		if (r <= 0) return calif;
	}
	return entries[entries.length - 1][0];
}

export function generarMockData(
	equipo: Puesto[],
	partido: { puntosLocal: number | null; puntosVisitante: number | null }
): { acciones: Accion[]; teamAcciones: TeamAccion[] } {
	const acciones: Accion[] = [];
	let baseTs = Date.now();

	function push(p: NonNullable<Puesto['player']>, skill: Skill, calif: CalificacionIndividual) {
		acciones.push({ timestamp: baseTs, player: p, skill, calificacion: calif });
		baseTs += 100;
	}

	function buscarJug(numero: number) {
		return equipo.find(e => e.numero === numero)?.player ?? null;
	}

	const ourScore = partido.puntosLocal ?? 20;
	const theirScore = partido.puntosVisitante ?? 17;
	const ourTries = Math.max(1, Math.round(ourScore / 5));
	const theirTries = Math.max(1, Math.round(theirScore / 5));

	for (const puesto of equipo) {
		const p = puesto.player;
		if (!p) continue;
		const n = puesto.numero;

		// Pases
		const pases = n === 9 || n === 10 ? rand(40, 60)
			: n >= 1 && n <= 8 ? rand(5, 15)
			: n >= 16 ? rand(5, 15)
			: rand(10, 20);
		for (let i = 0; i < pases; i++) {
			push(p, 'Pase', pickCalif({ Negativo: 0.05, Neutro: 0.60, Positivo: 0.30, Dominante: 0.05 }));
		}

		// Tackles
		const tackles = rand(2, 12);
		for (let i = 0; i < tackles; i++) {
			push(p, 'Tackle', pickCalif({ Negativo: 0.15, Neutro: 0.30, Positivo: 0.40, Dominante: 0.15 }));
		}

		// Duelos (8, 12, 13 tienen mas)
		const duelos = n === 8 || n === 12 || n === 13 ? rand(5, 12) : rand(2, 6);
		for (let i = 0; i < duelos; i++) {
			push(p, 'Duelo', pickCalif({ Negativo: 0.20, Neutro: 0.30, Positivo: 0.30, Dominante: 0.20 }));
		}

		// Rec. line (4, 5)
		if (n === 4 || n === 5) {
			const recs = rand(3, 7);
			for (let i = 0; i < recs; i++) {
				push(p, 'Rec. line', pickCalif({ Negativo: 0, Neutro: 0.15, Positivo: 0.55, Dominante: 0.30 }));
			}
		}

		// Lanz. line (2)
		if (n === 2) {
			const lanzs = rand(10, 18);
			for (let i = 0; i < lanzs; i++) {
				push(p, 'Lanz. line', pickCalif({ Negativo: 0.10, Neutro: 0.20, Positivo: 0.50, Dominante: 0.20 }));
			}
		}

		// Rucks
		if (n >= 1 && n <= 8) {
			const rucks = rand(6, 12);
			for (let i = 0; i < rucks; i++) {
				push(p, 'Ruck', pickCalif({ Negativo: 0.10, Neutro: 0.40, Positivo: 0.40, Dominante: 0.10 }));
			}
		} else if (n >= 11 && n <= 15) {
			const rucks = rand(0, 4);
			for (let i = 0; i < rucks; i++) {
				push(p, 'Ruck', pickCalif({ Negativo: 0.10, Neutro: 0.40, Positivo: 0.40, Dominante: 0.10 }));
			}
		}

		// Ast. tackle (1-8: 2-3, resto: 0-2)
		const astTackles = n >= 1 && n <= 8 ? rand(2, 3) : rand(0, 2);
		for (let i = 0; i < astTackles; i++) {
			push(p, 'Ast. tackle', pickCalif({ Negativo: 0.10, Neutro: 0.40, Positivo: 0.40, Dominante: 0.10 }));
		}

		// Ast. duelo (1-8: 2-3, resto: 0-1)
		const astDuelos = n >= 1 && n <= 8 ? rand(2, 3) : rand(0, 1);
		for (let i = 0; i < astDuelos; i++) {
			push(p, 'Ast. duelo', pickCalif({ Negativo: 0.10, Neutro: 0.40, Positivo: 0.40, Dominante: 0.10 }));
		}

		// Kicks (9, 10, 11, 14, 15)
		if (n === 10) {
			const kicks = rand(10, 15);
			for (let i = 0; i < kicks; i++) {
				push(p, 'Kick', pickCalif({ Negativo: 0.10, Neutro: 0.40, Positivo: 0.40, Dominante: 0.10 }));
			}
		} else if ([9, 11, 14, 15].includes(n)) {
			const kicks = rand(2, 5);
			for (let i = 0; i < kicks; i++) {
				push(p, 'Kick', pickCalif({ Negativo: 0.10, Neutro: 0.40, Positivo: 0.40, Dominante: 0.10 }));
			}
		}

		// Rec. aérea (4,5,6,7,8,11,14,15: 2-3)
		if ([4, 5, 6, 7, 8, 11, 14, 15].includes(n)) {
			const recs = rand(2, 3);
			for (let i = 0; i < recs; i++) {
				push(p, 'Rec. aérea', pickCalif({ Negativo: 0.10, Neutro: 0.30, Positivo: 0.45, Dominante: 0.15 }));
			}
		} else {
			const recs = rand(0, 1);
			for (let i = 0; i < recs; i++) {
				push(p, 'Rec. aérea', pickCalif({ Negativo: 0.10, Neutro: 0.30, Positivo: 0.45, Dominante: 0.15 }));
			}
		}
	}

	const jugs = equipo.map(p => p.player).filter((p): p is NonNullable<typeof p> => p !== null);
	const poolJug = () => jugs[rand(0, jugs.length - 1)];

	// Kick off (por #10; mas si el resultado es en contra)
	const diez = buscarJug(10);
	const baseKickOffs = Math.max(1, ourTries);
	const extraKickOffs = theirScore > ourScore ? rand(1, 2) : 0;
	const totalKickOffs = baseKickOffs + extraKickOffs;
	if (diez) {
		for (let i = 0; i < totalKickOffs; i++) {
			push(diez, 'Kick off', pickCalif({ Negativo: 0.10, Neutro: 0.20, Positivo: 0.50, Dominante: 0.20 }));
		}
	}

	// Palos (~70% acierto, raro >80%)
	const pateador = diez || buscarJug(15) || poolJug();
	const palosAttempts = rand(4, 8);
	for (let i = 0; i < palosAttempts; i++) {
		push(pateador, 'Palos', pickCalif({ Negativo: 0.20, Neutro: 0.10, Positivo: 0.60, Dominante: 0.10 }));
	}

	// Off load (~5 total, mayormente backs 9-15)
	const offLoads = rand(4, 6);
	for (let i = 0; i < offLoads; i++) {
		const backs = jugs.filter(j => {
			const p = equipo.find(e => e.player?.id === j.id);
			return p && p.numero >= 9 && p.numero <= 15;
		});
		push(backs.length > 0 ? backs[rand(0, backs.length - 1)] : poolJug(), 'Off load',
			pickCalif({ Negativo: 0.10, Neutro: 0.30, Positivo: 0.45, Dominante: 0.15 }));
	}

	// Recu. div. (2-3 total)
	const recuDivs = rand(2, 3);
	for (let i = 0; i < recuDivs; i++) {
		push(poolJug(), 'Recu. div.', pickCalif({ Negativo: 0.10, Neutro: 0.20, Positivo: 0.50, Dominante: 0.20 }));
	}

	// Intercep. (1-2 total, tipicamente backs)
	const interceps = rand(1, 2);
	for (let i = 0; i < interceps; i++) {
		const backs = jugs.filter(j => {
			const p = equipo.find(e => e.player?.id === j.id);
			return p && p.numero >= 11 && p.numero <= 15;
		});
		push(backs.length > 0 ? backs[rand(0, backs.length - 1)] : poolJug(), 'Intercep.',
			pickCalif({ Negativo: 0.05, Neutro: 0.10, Positivo: 0.50, Dominante: 0.35 }));
	}

	// Infracciones (se contabilizan en Positivo = ocurrio la infraccion)
	const knockOns = rand(3, 4);
	for (let i = 0; i < knockOns; i++) push(poolJug(), 'Knock on', 'Positivo');
	const fwdPass = rand(1, 2);
	for (let i = 0; i < fwdPass; i++) push(poolJug(), 'Fwd. pass', 'Positivo');
	const penales = rand(8, 12);
	for (let i = 0; i < penales; i++) push(poolJug(), 'Penal', 'Positivo');

	// Team acciones
	const teamAcciones: TeamAccion[] = [];
	function pushTeam(situacion: SituacionJuego, calif?: CalificacionGrupal) {
		teamAcciones.push({ timestamp: baseTs += 100, situacion, calificacion: calif ?? (Math.random() > 0.3 ? 'Positivo' : 'Negativo') });
	}

	for (let i = 0; i < 5; i++) pushTeam('Scrum propio');
	for (let i = 0; i < 5; i++) pushTeam('Scrum rival');
	const linesPropio = rand(7, 8);
	for (let i = 0; i < linesPropio; i++) pushTeam('Line propio');
	for (let i = 0; i < 15 - linesPropio; i++) pushTeam('Line rival');
	const salidasRecibida = Math.max(1, theirTries);
	for (let i = 0; i < salidasRecibida; i++) pushTeam('Salida recibida');
	for (let i = 0; i < totalKickOffs; i++) pushTeam('Salida cargada');
	for (let i = 0; i < rand(2, 4); i++) pushTeam('Efect. AT. 22m');
	for (let i = 0; i < rand(2, 4); i++) pushTeam('Efect. DEF. 22m');

	return { acciones, teamAcciones };
}
