import type { Accion, Skill, TeamAccion } from './types';

export const DURACION_CORTA = 3000;
export const DURACION_MEDIA = 5000;
export const DURACION_LARGA = 8000;

const DURACION_POR_SKILL: Record<Skill, number> = {
	// — 3 s —
	Pase: DURACION_CORTA,
	Bloqueo: DURACION_CORTA,
	'Intercep.': DURACION_CORTA,
	'Fwd. pass': DURACION_CORTA,
	'Off load': DURACION_CORTA,
	'Rec. line': DURACION_CORTA,
	'Recup. div.': DURACION_CORTA,
	'Lanz. line': DURACION_CORTA,
	'Knock on': DURACION_CORTA,
	// — 5 s —
	'Ast. duelo': DURACION_MEDIA,
	'Ast. tackle': DURACION_MEDIA,
	'Ctr. ruck': DURACION_MEDIA,
	Ruck: DURACION_MEDIA,
	Kick: DURACION_MEDIA,
	Salida: DURACION_MEDIA,
	Penal: DURACION_MEDIA,
	Pesca: DURACION_MEDIA,
	'Rec. aérea': DURACION_MEDIA,
	Duelo: DURACION_MEDIA,
	Tackle: DURACION_MEDIA,
	'Free kick': DURACION_MEDIA,
	Palos: DURACION_MEDIA,
	Drop: DURACION_MEDIA
};

export type ItemClip =
	| { tipo: 'individual'; accion: Accion }
	| { tipo: 'equipo'; accion: TeamAccion };

export function duracionClip(item: ItemClip): number {
	return item.tipo === 'equipo' ? DURACION_LARGA : DURACION_POR_SKILL[item.accion.skill];
}
