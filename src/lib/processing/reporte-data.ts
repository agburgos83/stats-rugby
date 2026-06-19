import { BALL_SKILLS, CONTACT_SKILLS, FOOT_SKILLS, type Skill, type Puesto, type Accion, type TeamAccion } from '$lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MatrizProcesada = Record<number, any>;
export type DixTotales = Record<string, [number, number]>;

function crearContadorVacio() {
    return { Negativo: 0, Neutro: 0, Positivo: 0, Dominante: 0, Total: 0 };
}

export function procesarReporte(
    equipo: Puesto[],
    acciones: Accion[],
    teamAcciones: TeamAccion[]
): { matrizProcesada: MatrizProcesada; dixTotales: DixTotales } {
    const matrizProcesada: MatrizProcesada = {};
    const dixTotales: DixTotales = {
        'Scrum propio': [0, 0],
        'Line propio': [0, 0],
        'Salida recibida': [0, 0],
        'Scrum rival': [0, 0],
        'Line rival': [0, 0],
        'Salida cargada': [0, 0],
        'Efect. AT. 22m': [0, 0],
        'Efect. DEF. 22m': [0, 0]
    };

    for (const puesto of equipo) {
        if (!puesto.player) continue;

        const jugador = puesto.player;
        const dixSkills: Record<string, unknown> = {};
        const ALL_SKILLS = [...BALL_SKILLS, ...CONTACT_SKILLS, ...FOOT_SKILLS];
        for (const skill of ALL_SKILLS) {
            dixSkills[skill] = crearContadorVacio();
        }

        matrizProcesada[jugador.id] = {
            id: jugador.id,
            nombre: jugador.nombre,
            apellido: jugador.apellido,
            skills: dixSkills,
            totalGeneral: 0,
            totalPelota: 0,
            totalContacto: 0,
            totalPie: 0,
            efectividadPelota: 0,
            efectividadContacto: 0,
            efectividadPie: 0
        };
    }

    for (const a of acciones) {
        const jugadorID = a.player.id;
        const skill: Skill = a.skill;
        const calificacion = a.calificacion;

        matrizProcesada[jugadorID].skills[skill][calificacion]++;
        matrizProcesada[jugadorID].totalGeneral++;

        if ((BALL_SKILLS as readonly string[]).includes(skill)) {
            matrizProcesada[jugadorID].totalPelota++;
        } else if ((CONTACT_SKILLS as readonly string[]).includes(skill)) {
            matrizProcesada[jugadorID].totalContacto++;
        } else if ((FOOT_SKILLS as readonly string[]).includes(skill)) {
            matrizProcesada[jugadorID].totalPie++;
        }

        const esFavorable = calificacion === 'Positivo' || calificacion === 'Dominante'
            || (calificacion === 'Neutro' && skill !== 'Duelo');

        if (esFavorable) {
            if ((BALL_SKILLS as readonly string[]).includes(skill)) {
                matrizProcesada[jugadorID].efectividadPelota++;
            } else if ((CONTACT_SKILLS as readonly string[]).includes(skill)) {
                matrizProcesada[jugadorID].efectividadContacto++;
            } else if ((FOOT_SKILLS as readonly string[]).includes(skill)) {
                matrizProcesada[jugadorID].efectividadPie++;
            }
        }
    }

    for (const ta of teamAcciones) {
        const situacion = ta.situacion;
        const calificacion = ta.calificacion;

        if (calificacion === 'Negativo') {
            dixTotales[situacion][0]++;
        } else {
            dixTotales[situacion][1]++;
        }
    }

    return { matrizProcesada, dixTotales };
}
