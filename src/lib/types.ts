// domain types

export type Player = {
    id: number;
    nombre: string;
    apellido: string;
    posicion: string;
    categoria: string;
};

export type Puesto = {
    player: Player | null;
    numero: number;
    posicionOriginal: string;
};

export type Accion = {
    timestamp: number; // Podríamos usar Date o un número (milisegundos desde epoch)
    player: Player;
    skill: Skill;
    calificacion: CalificacionIndividual;
};

export type TeamAccion = {
    timestamp: number;
    situacion: SituacionJuego;
    calificacion: CalificacionGrupal;
};

export type PartidoContexto = {
    fecha: string;
    local: string;
    visitante: string;
    puntosLocal: number | null;
    puntosVisitante: number | null;
    union: string;
    division: string;
    urlVideo: string;
};

export const BALL_SKILLS = [
    'Pase',
    'Off load',
    'Rec. aérea',
    'Rec. line',
    'Tirada line',
    'Intercep.'
    
] as const;

export const CONTACT_SKILLS = [
    'Duelo',
    'Tackle',
    'Ast. duelo',
    'Ast. Tackle',
    'Ruck',
    'Pesca',
    'Contraruck',
] as const;

export const FOOT_SKILLS = [
    'Kick',
    'Salida',
    'Palos',
    'Drop',
    'Tap',
] as const;

export const SKILLS = [
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
    'Tirada line'
] as const;

export const SKILLS_CON_NEUTRO = ['Tackle', 'Duelo'];

// 1. Creamos los tipos específicos de cada grupo (opcional, pero útil)
export type BallSkill = (typeof BALL_SKILLS)[number];
export type ContactSkill = (typeof CONTACT_SKILLS)[number];
export type FootSkill = (typeof FOOT_SKILLS)[number];

// 2. Unificamos todo en el tipo Skill general
export type Skill = BallSkill | ContactSkill | FootSkill;

// export type Skill = (typeof SKILLS)[number];
export type CalificacionIndividual = 'Negativo' | 'Neutro' | 'Positivo' | 'Dominante';
export type CalificacionGrupal = 'Negativo' | 'Positivo';
export type SituacionJuego = 'Scrum propio' | 'Line propio' | 'Salida recibida' | 'Scrum rival' | 'Line rival' | 'Salida cargada' | 'Efect. AT. 22m' | 'Efect. DEF. 22m';


// props
export interface PropsCargapartido {
    partido: PartidoContexto;
    cambiarVista: () => void;
}


export interface PropsCargaEquipo {
    jugadores: Player[];
    equipo: Puesto[];
    cambiarVista: () => void;
}

export interface PropsAnalisis {
    partido: PartidoContexto;
    equipo: Puesto[];
    acciones: Accion[];
    teamAcciones: TeamAccion[];
    cambiarVista: () => void;
}

export interface PropsAcciones {
    equipo: Puesto[];
    partido: PartidoContexto;
    acciones: Accion[];
    teamAcciones: TeamAccion[];
    cambiarVista: () => void;
}