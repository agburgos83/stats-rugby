// domain types

export type Club = {
	id: number;
	nombre: string;
}

export type Union = {
	id: number;
	nombre: string;
}

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

export type UnionClave = keyof typeof EQUIPOS_POR_UNION;

export type PartidoContexto = {
	fecha: string;
	local: string;
	visitante: string;
	puntosLocal: number | null;
	puntosVisitante: number | null;
	usuarioUnion: UnionClave;
	usuarioClub: string;
	division: string;
	urlVideo: string;
};

export const INFRACCION_SKILLS = [
	'Penal',
	'Knock on',
	'Fwd. pass',
] as const;

export const BALL_SKILLS = [
	'Pase',
	'Off load',
	'Rec. aérea',
	'Rec. line',
	'Lanz. line',
	'Intercep.',
	'Recu. div.',

] as const;

export const CONTACT_SKILLS = [
	'Duelo',
	'Tackle',
	'Ast. duelo',
	'Ast. tackle',
	'Ruck',
	'Ctr. ruck',
	'Pesca',
] as const;

export const FOOT_SKILLS = [
	'Kick',
	'Kick off',
	'Palos',
	'Drop',
] as const;

export const SKILLS = [
	'Duelo',
	'Tackle',
	'Pase',
	'Ruck',
	'Pesca',
	'Contraruck',
	'Recepción',
	'Intercepción',
	'Patada',
	'Drop',
	'Palos',
	'Salida',
	'Tirada line'
] as const;

export const SKILLS_CON_NEUTRO = ['Tackle', 'Duelo'];

export const EQUIPOS_POR_UNION = {
	URBA: [
		{ label: 'Albatros R.C.', slug: 'URBA/ALBATROS-RC.PNG' },
		{ label: 'Almafuerte', slug: 'URBA/ALMAFUERTE.PNG' },
		{ label: 'Asociación Alumni', slug: 'URBA/ASOCIACION-ALUMNI.PNG' },
		{ label: 'Areco', slug: 'URBA/ARECO.JPEG' },
		{ label: 'Arsenal Zarate', slug: 'URBA/ARSENAL-ZARATE.PNG' },
		{ label: 'Atlético del Rosario', slug: 'URBA/ATLETICO-DEL-ROSARIO.PNG' },
		{ label: 'Atlético San Andrés R.C.', slug: 'URBA/ATLETICO-SAN-ANDRES-RC.PNG' },
		{ label: 'Atlético y Progreso', slug: 'URBA/ATLETICO-Y-PROGRESO.PNG' },
		{ label: 'Banco Hipotecario', slug: 'URBA/BANCO-HIPOTECARIO.PNG' },
		{ label: 'Banco Nación', slug: 'URBA/BANCO-NACION.PNG' },
		{ label: 'T.F. Baradero', slug: 'URBA/TF-BARADERO.PNG' },
		{ label: 'Belgrano', slug: 'URBA/BELGRANO.PNG' },
		{ label: 'Berazategui', slug: 'URBA/BERAZATEGUI.JPEG' },
		{ label: 'Berisso R.C.', slug: 'URBA/BERISSO-RC.PNG' },
		{ label: 'Beromama', slug: 'URBA/BEROMAMA.PNG' },
		{ label: 'Buenos Aires', slug: 'URBA/BUENOS-AIRES.PNG' },
		{ label: 'Campana', slug: 'URBA/CAMPANA.PNG' },
		{ label: 'C.A.R.', slug: 'URBA/CAR.PNG' },
		{ label: 'Casa de Padua', slug: 'URBA/CASA-DE-PADUA.PNG' },
		{ label: 'C.A.S.I.', slug: 'URBA/CASI.PNG' },
		{ label: 'Centro Naval', slug: 'URBA/CENTRO-NAVAL.PNG' },
		{ label: 'Champagnat', slug: 'URBA/CHAMPAGNAT.PNG' },
		{ label: 'Chascomús', slug: 'URBA/CHASCOMUS.PNG' },
		{ label: 'Ciudad', slug: 'URBA/CIUDAD.PNG' },
		{ label: 'C.U.B.A.', slug: 'URBA/CUBA.PNG' },
		{ label: 'C.U.L.P.', slug: 'URBA/CULP.PNG' },
		{ label: 'C.U.Q.', slug: 'URBA/CUQ.PNG' },
		{ label: 'Curupayti', slug: 'URBA/CURUPAYTI.PNG' },
		{ label: 'D.A.O.M.', slug: 'URBA/DAOM.PNG' },
		{ label: 'Del Sur', slug: 'URBA/DEL-SUR.PNG' },
		{ label: 'Delta', slug: 'URBA/DELTA.PNG' },
		{ label: 'Deportiva Francesa', slug: 'URBA/DEPORTIVA-FRANCESA.PNG' },
		{ label: 'Don Bosco', slug: 'URBA/DON-BOSCO.PNG' },
		{ label: 'El Retiro', slug: 'URBA/EL-RETIRO.PNG' },
		{ label: 'Ezeiza', slug: 'URBA/EZEIZA.PNG' },
		{ label: 'Floresta R.C.', slug: 'URBA/FLORESTA-RC.PNG' },
		{ label: 'G.E.B.A.', slug: 'URBA/GEBA.PNG' },
		{ label: 'G.E.I.', slug: 'URBA/GEI.PNG' },
		{ label: 'Glew', slug: 'URBA/GLEW.PNG' },
		{ label: 'Sociedad Hebraica', slug: 'URBA/SOCIEDAD-HEBRAICA.PNG' },
		{ label: 'Hindú', slug: 'URBA/HINDU.PNG' },
		{ label: 'Hurling', slug: 'URBA/HURLING.PNG' },
		{ label: 'Italiano', slug: 'URBA/ITALIANO.PNG' },
		{ label: 'Lanus R.C.', slug: 'URBA/LANUS-RC.PNG' },
		{ label: 'La Plata R.C.', slug: 'URBA/LA-PLATA-RC.PNG' },
		{ label: 'La Salle R.C.', slug: 'URBA/LA-SALLE-RC.JPEG' },
		{ label: 'Las Cañas R.C.', slug: 'URBA/LAS-CANAS-RC.PNG' },
		{ label: 'Liceo Militar', slug: 'URBA/LICEO-MILITAR.PNG' },
		{ label: 'Liceo Naval', slug: 'URBA/LICEO-NAVAL.PNG' },
		{ label: 'Lobos', slug: 'URBA/LOBOS.PNG' },
		{ label: 'Lomas', slug: 'URBA/LOMAS.PNG' },
		{ label: 'Los Cedros', slug: 'URBA/LOS-CEDROS.JPG' },
		{ label: 'Los Matreros', slug: 'URBA/LOS-MATREROS.PNG' },
		{ label: 'Los Molinos', slug: 'URBA/LOS-MOLINOS.PNG' },
		{ label: 'Los Pinos', slug: 'URBA/LOS-PINOS.PNG' },
		{ label: 'Los Tilos', slug: 'URBA/LOS-TILOS.JPG' },
		{ label: 'Lujan R.C.', slug: 'URBA/LUJAN-RC.PNG' },
		{ label: 'Manuel Belgrano', slug: 'URBA/MANUEL-BELGRANO.PNG' },
		{ label: 'Marcos Paz', slug: 'URBA/MARCOS-PAZ.PNG' },
		{ label: 'Mariano Moreno', slug: 'URBA/MARIANO-MORENO.PNG' },
		{ label: 'Mercedes', slug: 'URBA/MERCEDES.PNG' },
		{ label: 'Monte Grande', slug: 'URBA/MONTE-GRANDE.PNG' },
		{ label: 'Newman', slug: 'URBA/NEWMAN.PNG' },
		{ label: 'Obras', slug: 'URBA/OBRAS.PNG' },
		{ label: 'Old Georgian', slug: 'URBA/OLD-GEORGIAN.PNG' },
		{ label: 'Olivos R.C.', slug: 'URBA/OLIVOS-RC.PNG' },
		{ label: 'P.A.C.', slug: 'URBA/PAC.PNG' },
		{ label: 'Porteno', slug: 'URBA/PORTENO.PNG' },
		{ label: 'Pucara', slug: 'URBA/PUCARA.PNG' },
		{ label: 'Pueyrredón', slug: 'URBA/PUEYRREDON.PNG' },
		{ label: 'Regatas', slug: 'URBA/REGATAS.PNG' },
		{ label: 'San Albano', slug: 'URBA/SAN-ALBANO.PNG' },
		{ label: 'San Andrés', slug: 'URBA/SAN-ANDRES.PNG' },
		{ label: 'San Carlos', slug: 'URBA/SAN-CARLOS.PNG' },
		{ label: 'San Cirano', slug: 'URBA/SAN-CIRANO.PNG' },
		{ label: 'San Fernando', slug: 'URBA/SAN-FERNANDO.PNG' },
		{ label: 'San Jose', slug: 'URBA/SAN-JOSE.PNG' },
		{ label: 'San Luis', slug: 'URBA/SAN-LUIS.PNG' },
		{ label: 'San Marcos', slug: 'URBA/SAN-MARCOS.PNG' },
		{ label: 'San Martin', slug: 'URBA/SAN-MARTIN.PNG' },
		{ label: 'San Miguel R.H.C.', slug: 'URBA/SAN-MIGUEL-RHC.PNG' },
		{ label: 'San Patricio', slug: 'URBA/SAN-PATRICIO.PNG' },
		{ label: 'San Pedro', slug: 'URBA/SAN-PEDRO.PNG' },
		{ label: 'S.I.C.', slug: 'URBA/SIC.PNG' },
		{ label: 'S.I.T.A.S.', slug: 'URBA/SITAS.PNG' },
		{ label: 'S.T. Brendans', slug: 'URBA/ST-BRENDANS.PNG' },
		{ label: 'Tigre R.C.', slug: 'URBA/TIGRE-RC.PNG' },
		{ label: 'Varela Junior', slug: 'URBA/VARELA-JUNIOR.PNG' },
		{ label: 'Vicentinos', slug: 'URBA/VICENTINOS.PNG' },
		{ label: 'Vilo', slug: 'URBA/VILO.PNG' },
		{ label: 'Virreyes', slug: 'URBA/VIRREYES.PNG' }
	],
	URS: [
		{ label: 'Argentino', slug: 'URS/ARGENTINO.JPEG' },
		{ label: 'Atlético Feroviario', slug: 'URS/ATLETICO-FEROVIARIO.JPEG' },
		{ label: 'Atlético Juarense', slug: 'URS/ATLETICO-JUARENSE.PNG' },
		{ label: 'Awkanes R.C.', slug: 'URS/AWKANES-RC.JPEG' },
		{ label: 'Catriló', slug: 'URS/CATRILO.JPG' },
		{ label: 'Cazadores Tres Arroyos', slug: 'URS/CAZADORES-TRES-ARROYOS.JPG' },
		{ label: 'Coronel Suarez R.H.C.', slug: 'URS/CORONEL-SUAREZ-RHC.JPEG' },
		{ label: 'C.U.B.B.', slug: 'URS/CUBB.PNG' },
		{ label: 'El Nacional', slug: 'URS/EL-NACIONAL.PNG' },
		{ label: 'Espora', slug: 'URS/ESPORA.JPG' },
		{ label: 'Palihue R.H.C.', slug: 'URS/PALIHUE-RHC.JPEG' },
		{ label: 'Pringles R.C.', slug: 'URS/PRINGLES-RC.JPEG' },
		{ label: 'Puerto Belgrano', slug: 'URS/PUERTO-BELGRANO.JPEG' },
		{ label: 'Punta Alta R.C.', slug: 'URS/PUNTA-ALTA-RC.PNG' },
		{ label: 'Santa Rosa', slug: 'URS/SANTA-ROSA.JPEG' },
		{ label: 'Sociedad Sportiva', slug: 'URS/SOCIEDAD-SPORTIVA.PNG' },
		{ label: 'Sol de Mayo', slug: 'URS/SOL-DE-MAYO.PNG' },
		{ label: 'Tres Arroyos R.H.C.', slug: 'URS/TRES-ARROYOS-RHC.JPEG' },
		{ label: 'U.N.S.', slug: 'URS/UNS.JPEG' }
	],
	UROBA: [
		{ label: 'Azul R.C.', slug: 'UROBA/AZUL-RC.JPG' },
		{ label: 'Bragado', slug: 'UROBA/BRAGADO.PNG' },
		{ label: 'C.A.E. Olavarría', slug: 'UROBA/CAE-OLAVARRIA.JPEG' },
		{ label: 'C.A.E.U. Pehuajó', slug: 'UROBA/CAEU-PEHUAJO.PNG' },
		{ label: 'C.A.N.J.', slug: 'UROBA/CANJ.PNG' },
		{ label: 'C.A. Tapalqué', slug: 'UROBA/CA-TAPALQUE.PNG' },
		{ label: 'Club Remo Azul', slug: 'UROBA/CLUB-REMO-AZUL.JPEG' },
		{ label: 'C.N. Arrecifes', slug: 'UROBA/CN-ARRECIFES.PNG' },
		{ label: 'C.S. Huracán', slug: 'UROBA/CS-HURACAN.JPEG' },
		{ label: 'C.S.P. General Pinto', slug: 'UROBA/CSP-GENERAL-PINTO.PNG' },
		{ label: 'El Fortín', slug: 'UROBA/EL-FORTIN.PNG' },
		{ label: 'El Linqueño', slug: 'UROBA/EL-LINQUEÑO.PNG' },
		{ label: 'Estudiantes', slug: 'UROBA/ESTUDIANTES.JPG' },
		{ label: 'F.B.C.A.', slug: 'UROBA/FBCA.PNG' },
		{ label: 'G.E.P.', slug: 'UROBA/GEP.PNG' },
		{ label: 'Indios R.C.', slug: 'UROBA/INDIOS-RC.JPG' },
		{ label: 'Kamikazes', slug: 'UROBA/KAMIKAZES.JPEG' },
		{ label: 'Los Burros', slug: 'UROBA/LOS-BURROS.PNG' },
		{ label: 'Los Miuras', slug: 'UROBA/LOS-MIURAS.PNG' },
		{ label: 'Mapuche', slug: 'UROBA/MAPUCHE.PNG' },
		{ label: 'Marabuntas', slug: 'UROBA/MARABUNTAS.PNG' },
		{ label: 'Onas', slug: 'UROBA/ONAS.JPG' },
		{ label: 'Pampero', slug: 'UROBA/PAMPERO' },
		{ label: 'Pico R.C.', slug: 'UROBA/PICO-RC.JPEG' },
		{ label: 'Saladillo R.C.', slug: 'UROBA/SALADILLO-RC.JPEG' },
		{ label: 'Salto R.C.', slug: 'UROBA/SALTO-RC.JPG' },
		{ label: 'S.O.R.U.C.', slug: 'UROBA/SORUC.JPEG' },
		{ label: 'Tacuara', slug: 'UROBA/TACUARA.JPG' },
		{ label: 'Universitarios', slug: 'UROBA/UNIVERSITARIOS.JPEG' },
		{ label: 'Villegas', slug: 'UROBA/VILLEGAS.JPEG' },
		{ label: 'Yaguá Pitá R.C.', slug: 'UROBA/YAGUÁ-PITÁ-RC.JPEG' }
	],
	URMDP: [
		{ label: 'Biguá R.C.', slug: 'URMDP/BIGUA-RC' },
		{ label: 'Camarones', slug: 'URMDP/CAMARONES' },
		{ label: 'Club Social y Campo de Pato', slug: 'URMDP/CLUB-SOCIAL-Y-CAMPO-DE-PATO' },
		{ label: 'Comercial R.C.', slug: 'URMDP/COMERCIAL-RC' },
		{ label: 'C.U.D.S.', slug: 'URMDP/CUDS' },
		{ label: 'Gnomos R.C.', slug: 'URMDP/GNOMOS-RC' },
		{ label: 'Los 50', slug: 'URMDP/LOS-50' },
		{ label: 'Los Cardos R.C.', slug: 'URMDP/LOS-CARDOS-RC' },
		{ label: 'Mar del Plata', slug: 'URMDP/MAR-DEL-PLATA' },
		{ label: 'Miramar R.C.', slug: 'URMDP/MIRAMAR-RC' },
		{ label: 'Náutico Necochea', slug: 'URMDP/NAUTICO-NECOCHEA' },
		{ label: 'Necochea', slug: 'URMDP/NECOCHEA' },
		{ label: 'Pampas R.C.', slug: 'URMDP/PAMPAS-RC' },
		{ label: 'Pueyrredón R.C.', slug: 'URMDP/PUEYRREDON-RC' },
		{ label: 'San Ignacio', slug: 'URMDP/SAN-IGNACIO' },
		{ label: 'Sporting', slug: 'URMDP/SPORTING' },
		{ label: 'T.F. Ayacucho', slug: 'URMDP/TF-AYACUCHO' },
		{ label: 'Uncas', slug: 'URMDP/UNCAS' },
		{ label: 'Universitario', slug: 'URMDP/UNIVERSITARIO' },
		{ label: 'Villa Gesel R.C.', slug: 'URMDP/VILLA-GESEL-RC' }
	]
} as const;

export type EquipoInfo = (typeof EQUIPOS_POR_UNION)[UnionClave][number];

// 1. Creamos los tipos específicos de cada grupo (opcional, pero útil)
export type InfraccionSkill = (typeof INFRACCION_SKILLS)[number];
export type BallSkill = (typeof BALL_SKILLS)[number];
export type ContactSkill = (typeof CONTACT_SKILLS)[number];
export type FootSkill = (typeof FOOT_SKILLS)[number];

// 2. Unificamos todo en el tipo Skill general
export type Skill = BallSkill | ContactSkill | FootSkill | InfraccionSkill;

// export type Skill = (typeof SKILLS)[number];
export type CalificacionIndividual = 'Negativo' | 'Neutro' | 'Positivo' | 'Dominante';
export type CalificacionGrupal = 'Negativo' | 'Positivo';
export type SituacionJuego = 'Scrum propio' | 'Line propio' | 'Salida recibida' | 'Scrum rival' | 'Line rival' | 'Salida cargada' | 'Efect. AT. 22m' | 'Efect. DEF. 22m';


// props
export interface PropsCargaPartido {
    partido: PartidoContexto;
    cambiarVista: () => void;
}

export interface PropsCargaEquipo {
	jugadores: Player[];
	equipo: Puesto[];
	usuarioUnion: UnionClave;
	usuarioClub: string;
	cambiarVista: () => void;
}

// export interface PropsCargaEquipo {
// 	jugadores: Player[];
// 	equipo: Puesto[];
// 	cambiarVista: () => void;
// }

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