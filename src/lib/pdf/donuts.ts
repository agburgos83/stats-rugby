import { jsPDF } from 'jspdf';
import { arc, pie } from 'd3';
import { type PartidoContexto } from '$lib/types';
import { type UnionClave, EQUIPOS_POR_UNION } from '$lib/types';

async function obtenerEscudo(union: UnionClave, equipo: string): Promise<string | null> {
    const team = EQUIPOS_POR_UNION[union].find(t => t.label === equipo);
    if (!team) return null;
    try {
        const resp = await fetch(`/escudos-clubes/${team.slug}`);
        if (!resp.ok) return null;
        const blob = await resp.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

/**
 * Genera un string SVG con un donut (positivo/negativo) usando D3.
 *
 * @param positivos - Cantidad de acciones positivas
 * @param negativos - Cantidad de acciones negativas
 * @returns String SVG listo para pasar a doc.addSvgAsImage()
 */
function generarDonutSVG(positivos: number, negativos: number): string {

    const scale = 3;
    const viewW = 200 * scale;
    const viewH = 220 * scale;

    const cx = viewW / 2;
    const cy = 80 * scale;
    const outerR = 65 * scale;
    const innerR = 36 * scale;

    const arcGenerator = arc<{ startAngle: number; endAngle: number; padAngle: number }>()
        .innerRadius(innerR)
        .outerRadius(outerR);

    const pieGenerator = pie<number>()
        .startAngle(0)
        .endAngle(2 * Math.PI)
        .sort(null);

    const total = positivos + negativos;
    const pct = total > 0 ? Math.round((positivos / total) * 100) : 0;

    const valores = total > 0 ? [positivos, negativos] : [1];
    const colores = total > 0 ? ['#2664eb', '#2664ebb8'] : ['#e2e8f0'];

    const slices = pieGenerator(valores);

    let pathsHtml = '';
    slices.forEach((slice, i) => {
        const d = arcGenerator(slice);
        if (d) {
            pathsHtml += `<path d="${d}" fill="${colores[i]}" />\n`;
        }
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ${viewW} ${viewH}">
        <g transform="translate(${cx}, ${cy})">
        ${pathsHtml}</g>
        <text x="${cx}" y="${cy + outerR + 18 * scale}" text-anchor="middle" font-family="helvetica" font-size="${12 * scale}" fill="#1e293b">${pct}% efectividad</text>
        <text x="${cx}" y="${cy + outerR + 32 * scale}" text-anchor="middle" font-family="helvetica" font-size="${10 * scale}" fill="#64748b">${total} situaciones</text>
    </svg>`;
}

export async function agregarDonutsAlPDF(doc: jsPDF,
    dixTotales: Record<string, [number, number]>,
    partido: PartidoContexto,
    logoDataUrl: string): Promise<void> {
    const situaciones = [
        'Scrum propio',
        'Line propio',
        'Salida recibida',
        'Scrum rival',
        'Line rival',
        'Salida cargada',
        'Efect. AT. 22m',
        'Efect. DEF. 22m'
    ];

    doc.addPage([210, 297], 'portrait');

    const [escudoLocal] = await Promise.all([
        obtenerEscudo(partido.usuarioUnion, partido.local),
    ])

    // --- Header: título a la izquierda, escudos a la derecha ---
    doc.setFontSize(16);
    doc.text('Efectividad por situaciones de juego', 14, 12);
    doc.setFontSize(12);
    doc.text(
        `${partido.local} (${partido.puntosLocal}) vs ${partido.visitante} (${partido.puntosVisitante})`,
        14,
        18
    );
    doc.text(
        `Unión: ${partido.usuarioUnion} | División: ${partido.division} | Fecha: ${partido.fecha}`,
        14,
        24
    );

    const margen = 14;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const strokeY = pageHeight - 25;

    const escudoSize = 16;
    const escudoXLocal = pageWidth - 14 - escudoSize;
    const escudoY = 6;
    if (escudoLocal) {
        doc.addImage(escudoLocal, 'PNG', escudoXLocal, escudoY, escudoSize, escudoSize);
    }



    const colX = [18, 78, 138];
    const rowY = [38, 112, 186];

    for (let i = 0; i < situaciones.length; i++) {
        const situacion = situaciones[i];
        const col = i % 3;
        const row = Math.floor(i / 3);

        const x = colX[col];
        const y = rowY[row];

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(situacion, x + 30, y, { align: 'center' });

        const [negativos, positivos] = dixTotales[situacion];
        const svg = generarDonutSVG(positivos, negativos);
        const dataUrl = await renderSVGaImagen(svg);
        doc.addImage(dataUrl, 'PNG', x, y + 3, 60, 63);


    }



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

export function renderSVGaImagen(svgString: string, width = 300, height = 440): Promise<string> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        const img = new Image();
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
    });
}