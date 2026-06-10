import { SKILLS, type Skill, type Puesto, type Accion, type TeamAccion } from '$lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MatrizProcesada = Record<number, any>;
export type DixTotales = Record<string, [number, number]>;

function crearContadorVacio() {
    return { Negativo: 0, Neutro: 0, Positivo: 0, Dominante: 0, Total: 0, TotalPositivas: 0 };
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
        'Puntos en ZD': [0, 0]
    };

    for (const puesto of equipo) {
        if (!puesto.player) continue;

        const jugador = puesto.player;
        const dixSkills: Record<string, unknown> = {};
        for (const skill of SKILLS) {
            dixSkills[skill] = crearContadorVacio();
        }

        matrizProcesada[jugador.id] = {
            id: jugador.id,
            nombre: jugador.nombre,
            apellido: jugador.apellido,
            skills: dixSkills,
            totalGeneral: 0,
            totalPositivas: 0
        };
    }

    for (const a of acciones) {
        const jugadorID = a.player.id;
        const skill: Skill = a.skill;
        const calificacion = a.calificacion;

        matrizProcesada[jugadorID].skills[skill][calificacion]++;
        matrizProcesada[jugadorID].totalGeneral++;

        if (calificacion === 'Positivo' || calificacion === 'Dominante') {
            matrizProcesada[jugadorID].totalPositivas++;
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
