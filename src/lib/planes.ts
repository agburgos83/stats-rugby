import { CONTACT_SKILLS, BALL_SKILLS, FOOT_SKILLS, INFRACCION_SKILLS } from './types.ts';

export const GRUPOS = ['contacto', 'pelota', 'pie', 'infraccion', 'situaciones'] as const;
export type GrupoClave = (typeof GRUPOS)[number];

export const LIMITES_FREE: Record<GrupoClave, number> = {
	contacto: 2,
	pelota: 2,
	pie: 1,
	infraccion: 1,
	situaciones: 2
};

export const SITUACIONES = [
	'Scrum propio',
	'Line propio',
	'Salida recibida',
	'Scrum rival',
	'Line rival',
	'Salida cargada',
	'Efect. AT. 22m',
	'Efect. DEF. 22m'
] as const;

export function grupoDeSkill(skill: string): GrupoClave | null {
	if ((CONTACT_SKILLS as readonly string[]).includes(skill)) return 'contacto';
	if ((BALL_SKILLS as readonly string[]).includes(skill)) return 'pelota';
	if ((FOOT_SKILLS as readonly string[]).includes(skill)) return 'pie';
	if ((INFRACCION_SKILLS as readonly string[]).includes(skill)) return 'infraccion';
	if ((SITUACIONES as readonly string[]).includes(skill)) return 'situaciones';
	return null;
}
