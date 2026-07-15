import { jsPDF } from 'jspdf';
import { scaleLinear } from 'd3-scale';
import { lineRadial } from 'd3-shape';
import { curveLinearClosed } from 'd3-shape';
import { type ModalidadClave, type PartidoContexto, type Puesto } from '$lib/types';
import { type MatrizProcesada } from '$lib/processing/reporte-data';
import { renderSVGaImagen } from '$lib/pdf/donuts';

const COLOR = '#2563eb';

export interface GrupoRadar {
    label: string;
    skills: string[];
}

export const GROUP_SKILLS: Record<string, GrupoRadar> = {
    primera: {
        label: 'Primeras líneas',
        skills: ['Duelo', 'Tackle', 'Ruck', 'Pase', 'Ast. duelo'],
    },
    segunda: {
        label: 'Segundas líneas',
        skills: ['Tackle', 'Ruck', 'Rec. line', 'Rec. aérea', 'Duelo'],
    },
    tercera: {
        label: 'Terceras líneas',
        skills: ['Duelo', 'Tackle', 'Ruck', 'Pesca', 'Ast. tackle'],
    },
    medios: {
        label: 'Medios',
        skills: ['Pase', 'Kick', 'Tackle', 'Kick off', 'Duelo'],
    },
    backs: {
        label: 'Backs',
        skills: ['Pase', 'Duelo', 'Tackle', 'Kick', 'Rec. aérea'],
    },
};

function obtenerGrupo(puesto: Puesto): string | null {
    const pos = (puesto.posicionOriginal || '').toLowerCase();
    if (pos) {
        if (/pilar|hooker/.test(pos)) return 'primera';
        if (/segunda/.test(pos)) return 'segunda';
        if (/tercera|ala|tercer|octavo/.test(pos)) return 'tercera';
        if (/medio|apertura/.test(pos)) return 'medios';
        if (/centro|wing|fullback|zaguero/.test(pos)) return 'backs';
    }
    const n = puesto.numero;
    if (n >= 1 && n <= 3) return 'primera';
    if (n >= 4 && n <= 5) return 'segunda';
    if (n >= 6 && n <= 8) return 'tercera';
    if (n >= 9 && n <= 10) return 'medios';
    if (n >= 11 && n <= 15) return 'backs';
    return null;
}

function efectividadSkill(
    s: { Negativo: number; Neutro: number; Positivo: number; Dominante: number },
    skill: string
): number {
    const total = (s.Negativo || 0) + (s.Neutro || 0) + (s.Positivo || 0) + (s.Dominante || 0);
    if (total === 0) return 0;
    let fav: number;
    if (skill === 'Duelo') {
        fav = (s.Positivo || 0) + (s.Dominante || 0);
    } else {
        fav = (s.Positivo || 0) + (s.Dominante || 0) + (s.Neutro || 0);
    }
    return Math.round((fav / total) * 100);
}

function generarRadarSVG(
    valores: { axis: string; value: number }[],
    numero: number,
    apellido: string,
): string {
    const total = valores.length;
    if (total === 0) return '';

    const angleSlice = (2 * Math.PI) / total;
    const radius = 146;
    const labelR = radius * 1.3;
    const cx = 240;
    const cy = 212;
    const viewW = 500;
    const viewH = 440;

    const rScale = scaleLinear().domain([0, 100]).range([0, radius]);

    const radialLine = lineRadial<{ axis: string; value: number }>()
        .radius((d) => rScale(d.value))
        .angle((_d, i) => angleSlice * i)
        .curve(curveLinearClosed);

    const blobPath = radialLine(valores);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}">`;
    svg += `<g transform="translate(${cx}, ${cy})">`;

    [0.25, 0.5, 0.75, 1.0].forEach((pct) => {
        const r = (radius * pct).toFixed(1);
        svg += `<circle cx="0" cy="0" r="${r}" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>`;
    });

    for (let i = 0; i < total; i++) {
        const angle = angleSlice * i - Math.PI / 2;
        const x = (radius * Math.cos(angle)).toFixed(1);
        const y = (radius * Math.sin(angle)).toFixed(1);
        svg += `<line x1="0" y1="0" x2="${x}" y2="${y}" stroke="#cbd5e1" stroke-width="1.5"/>`;
    }

    const tieneDatos = valores.some((v) => v.value > 0);
    if (blobPath && tieneDatos) {
        svg += `<path d="${blobPath}" fill="${COLOR}" fill-opacity="0.25" stroke="${COLOR}" stroke-width="3"/>`;
    }

    for (let i = 0; i < total; i++) {
        const angle = angleSlice * i - Math.PI / 2;
        const x = (labelR * Math.cos(angle)).toFixed(1);
        const y = (labelR * Math.sin(angle)).toFixed(1);
        svg += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="helvetica" font-size="16" fill="#000000">${valores[i].axis}</text>`;
    }

    svg += `</g>`;

    if (!tieneDatos) {
        svg += `<text x="${cx}" y="${cy + radius + 42}" text-anchor="middle" font-family="helvetica" font-size="24" fill="#94a3b8">${numero}. ${apellido} — Sin datos</text>`;
    } else {
        svg += `<text x="${cx}" y="${cy + radius + 42}" text-anchor="middle" font-family="helvetica" font-size="24" fill="#1e293b">${numero}. ${apellido}</text>`;
    }

    svg += `</svg>`;
    return svg;
}

export async function agregarRadarAlPDF(
    doc: jsPDF,
    equipo: Puesto[],
    matrizProcesada: MatrizProcesada,
    partido: PartidoContexto,
    escudoLocal: string | null,
    logoDataUrl: string,
    modalidad: ModalidadClave = 'quince'
): Promise<void> {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margen = 14;
    const footerY = pageHeight - 25;

    doc.setTextColor(0);
    doc.setFontSize(16);
    doc.text('Rendimiento por jugador', margen, 12);
    doc.setFontSize(12);
    doc.text(
        `${partido.local} (${partido.puntosLocal}) vs ${partido.visitante} (${partido.puntosVisitante})`,
        margen,
        18
    );
    doc.text(
        `Unión: ${partido.usuarioUnion} | División: ${partido.division} | Fecha: ${partido.fecha}`,
        margen,
        24
    );

    const escudoSize = 18;
    const escudoX = pageWidth - margen - escudoSize;
    if (escudoLocal) {
        doc.addImage(escudoLocal, 'PNG', escudoX, 6, escudoSize, escudoSize);
    }

    const grupos: Record<string, Puesto[]> = {};
    for (const puesto of equipo) {
        if (!puesto.player) continue;
        const g = obtenerGrupo(puesto);
        if (g) {
            if (!grupos[g]) grupos[g] = [];
            grupos[g].push(puesto);
        }
    }

    const allGroups = ['primera', 'segunda', 'tercera', 'medios', 'backs'] as const;
    const modalidadGroups: Record<string, string[]> = {
        seven: ['primera', 'medios', 'backs'],
        ten: ['primera', 'segunda', 'medios', 'backs'],
    };
    const groupOrder = modalidadGroups[modalidad] ?? allGroups;
    const catColW = 22;
    const starW = 50;
    const starH = starW * (440 / 500);
    const gap = 15;
    const rowGap = 3;
    const catGap = 5;

    let currentY = 32;

    const nonEmptyGroups = groupOrder.filter(key => (grupos[key] || []).length > 0);

    for (let gi = 0; gi < nonEmptyGroups.length; gi++) {
        const key = nonEmptyGroups[gi];
        const grupo = GROUP_SKILLS[key];
        const puestos = grupos[key] || [];

        const numRows = Math.ceil(puestos.length / 4);
        const rowsHeight = numRows * starH + (numRows - 1) * rowGap;

        if (currentY + rowsHeight + catGap > footerY) {
            doc.addPage();
            currentY = 14;
            doc.setTextColor(0);
            doc.setFontSize(16);
            doc.text('Rendimiento por jugador', margen, 12);
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        const lines = grupo.label.split(' ');
        if (lines.length === 2) {
            doc.text(lines[0], margen, currentY + 4);
            doc.text(lines[1], margen, currentY + 4 + 4);
        } else {
            doc.text(grupo.label, margen, currentY + 5);
        }

        for (let i = 0; i < puestos.length; i++) {
            const puesto = puestos[i];
            const datosJugador = matrizProcesada[puesto.player!.id];
            if (!datosJugador) continue;

            const valores = grupo.skills.map((skill) => ({
                axis: skill,
                value: efectividadSkill(datosJugador.skills[skill], skill),
            }));

            const svg = generarRadarSVG(valores, puesto.numero, datosJugador.apellido);
            const dataUrl = await renderSVGaImagen(svg, 520, 458);

            const row = Math.floor(i / 4);
            const col = i % 4;
            const x = margen + catColW + col * (starW + gap);
            const y = currentY + row * (starH + rowGap);
            doc.addImage(dataUrl, 'PNG', x, y, starW, starH);
        }

        currentY += rowsHeight + rowGap;

        if (gi < nonEmptyGroups.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(margen, currentY, pageWidth - margen, currentY);
            currentY += catGap;
        }
    }

    const strokeY = footerY;
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.3);
    doc.line(margen, strokeY, pageWidth - margen, strokeY);

    const logoAlto = 40;
    const logoAncho = logoAlto * (210 / 297);
    const logoX = (pageWidth - logoAncho) / 2;
    const logoY = strokeY - (logoAlto - 25) / 2;
    doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoAncho, logoAlto);
    doc.link(logoX, logoY, logoAncho, logoAlto, { url: 'https://stats-rugby.netlify.app/' });
}
