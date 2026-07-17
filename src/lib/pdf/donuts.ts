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
const VERBOS: Record<string, [string, string, string]> = {
    'Scrum propio': ['Tiramos', 'scrums', 'obtuvimos'],
    'Line propio': ['Tiramos', 'lines', 'obtuvimos'],
    'Salida recibida': ['Nos patearon', 'salidas', 'obtuvimos'],
    'Scrum rival': ['Tiraron', 'scrums', 'recuperamos'],
    'Line rival': ['Tiraron', 'lines', 'recuperamos'],
    'Salida cargada': ['Pateamos', 'salidas', 'recuperamos'],
    'Efect. AT. 22m': ['Llegamos', 'veces a 22 rival', 'anotamos'],
    'Efect. DEF. 22m': ['Llegaron', 'veces a nuestros 22', 'evitamos'],
};

function generarDonutSVG(positivos: number, negativos: number, situacion: string): string {

    const total = positivos + negativos;

    if (total === 0) {
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

        const slices = pieGenerator([1]);

        let pathsHtml = '';
        slices.forEach((slice) => {
            const d = arcGenerator(slice);
            if (d) pathsHtml += `<path d="${d}" fill="#e2e8f0" />\n`;
        });

        return `<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ${viewW} ${viewH}">
            <g transform="translate(${cx}, ${cy})">
            ${pathsHtml}</g>
            <text x="${cx}" y="${cy + outerR + 20 * scale}" text-anchor="middle" font-family="helvetica" font-size="${11 * scale}" fill="#94a3b8">Sin datos</text>
        </svg>`;
    }

    const pct = Math.round((positivos / total) * 100);

    const [verbo, objeto, resultado] = VERBOS[situacion] ?? ['', '', ''];

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

    const valores = [positivos, negativos];
    const colores = ['#0068CE', '#0068CEB8'];

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
        <text x="${cx}" y="${cy + outerR + 18 * scale}" text-anchor="middle" font-family="helvetica" font-size="${11 * scale}" fill="#1e293b">${pct}% efectividad</text>
        <text x="${cx}" y="${cy + outerR + 30 * scale}" text-anchor="middle" font-family="helvetica" font-size="${9 * scale}" fill="#64748b">${verbo} ${total} ${objeto}</text>
        <text x="${cx}" y="${cy + outerR + 40 * scale}" text-anchor="middle" font-family="helvetica" font-size="${9 * scale}" fill="#64748b">${resultado} ${positivos}</text>
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

    // --- Header: título a la izquierda, escudos a la derecha ---
    doc.setTextColor(0);
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

    const colX = [18, 78, 138];
    const rowY = [36, 110, 184];

    for (let i = 0; i < situaciones.length; i++) {
        const situacion = situaciones[i];
        const col = i % 3;
        const row = Math.floor(i / 3);

        const x = colX[col];
        const y = rowY[row];

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 104, 206);
        doc.text(situacion, x + 30, y, { align: 'center' });

        const [negativos, positivos] = dixTotales[situacion];
        const svg = generarDonutSVG(positivos, negativos, situacion);
        const dataUrl = await renderSVGaImagen(svg);
        doc.addImage(dataUrl, 'PNG', x, y + 3, 60, 63);

    }

    doc.setDrawColor(0, 104, 206);
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
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('No se pudo obtener el contexto 2D del canvas'));
            return;
        }

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