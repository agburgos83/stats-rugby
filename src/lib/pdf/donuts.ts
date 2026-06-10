import { jsPDF } from 'jspdf';
import { arc, pie } from 'd3';
import { type PartidoContexto } from '$lib/types';

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
    const viewH = 210 * scale;

    const cx = viewW / 2;
    const cy = 85 * scale;
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
            pathsHtml += `      <path d="${d}" fill="${colores[i]}" stroke="white" stroke-width="${1.5 * scale}" />\n`;
        }
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}">
			<g transform="translate(${cx}, ${cy})">
			${pathsHtml}  </g>
			<text x="${cx}" y="${cy + outerR + 14 * scale}" text-anchor="middle" font-family="sans-serif" font-size="${12 * scale}" font-weight="normal" fill="#1e293b">${pct}% efectividad</text>
			</svg>`;
}

export async function agregarDonutsAlPDF(doc: jsPDF,
    dixTotales: Record<string, [number, number]>,
    partido: PartidoContexto): Promise<void> {
    const situaciones = [
        'Scrum propio',
        'Line propio',
        'Salida recibida',
        'Scrum rival',
        'Line rival',
        'Salida cargada',
        'Puntos en ZD'
    ];

    doc.addPage([210, 297], 'portrait');

    doc.setFontSize(16);
    doc.text(
        `Efectividad por situaciones de juego: ${partido.local} (${partido.puntosLocal}) vs ${partido.visitante} (${partido.puntosVisitante})`,
        14,
        12
    );
    doc.setFontSize(12);
    doc.text(
        `Unión: ${partido.union} | División: ${partido.division} | Fecha: ${partido.fecha}`,
        14,
        18
    );

    const colX = [18, 78, 138];
    const rowY = [28, 112, 196];
    const centroX = (210 - 60) / 2;

    for (let i = 0; i < situaciones.length; i++) {
        const situacion = situaciones[i];
        const col = i % 3;
        const row = Math.floor(i / 3);

        const x = i === 6 ? centroX : colX[col];
        const y = rowY[row];

        doc.setFontSize(13);
        doc.setFont('sans-serif', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(situacion, x + 30, y, { align: 'center' });

        const [negativos, positivos] = dixTotales[situacion];
        const svg = generarDonutSVG(positivos, negativos);
        const dataUrl = await renderSVGaImagen(svg);
        doc.addImage(dataUrl, 'PNG', x, y + 3, 60, 63);
    }
}

function renderSVGaImagen(svgString: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 630;
        const ctx = canvas.getContext('2d')!;

        const img = new Image();
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        img.onload = () => {
            ctx.drawImage(img, 0, 0, 600, 630);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
    });
}