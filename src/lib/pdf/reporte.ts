import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { HookData, RowInput } from 'jspdf-autotable';
import { type MatrizProcesada, type DixTotales } from '$lib/processing/reporte-data'
import { agregarDonutsAlPDF, renderSVGaImagen } from '$lib/pdf/donuts'
import { type PartidoContexto, type UnionClave, EQUIPOS_POR_UNION, type Puesto, BALL_SKILLS, CONTACT_SKILLS, FOOT_SKILLS, INFRACCION_SKILLS } from '$lib/types';

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

export async function descargarPDF(
    equipo: Puesto[],
    partido: PartidoContexto,
    matrizProcesada: MatrizProcesada,
    dixTotales: DixTotales
): Promise<void> {

    const [escudoLocal] = await Promise.all([
        obtenerEscudo(partido.usuarioUnion, partido.usuarioClub),
    ])

    const respLogo = await fetch('/logo-se-ss.svg');
    let svgLogo = await respLogo.text();
    svgLogo = svgLogo.replace(
        'viewBox="0 0 210 297"',
        'viewBox="94 128 30 44"'   // encuadre ajustado al logo
    );

    const logoDataUrl = await renderSVGaImagen(svgLogo, 300, 440);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
    const pageWidth = doc.internal.pageSize.width;

    // --- Header: título a la izquierda, escudos a la derecha ---
    doc.setFontSize(16);
    doc.text('Acciones por jugador', 14, 12);
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

    const escudoSize = 16;
    const escudoXLocal = pageWidth - 14 - escudoSize;
    const escudoY = 6;
    if (escudoLocal) {
        doc.addImage(escudoLocal, 'PNG', escudoXLocal, escudoY, escudoSize, escudoSize);
    }

    const ALL_SKILLS = [...BALL_SKILLS, ...CONTACT_SKILLS, ...FOOT_SKILLS, ...INFRACCION_SKILLS];

    function skillCols(skill: string): number {
        const s = skill.toLowerCase();
        if (s === 'tackle' || s === 'duelo') return 4;
        if (s === 'penal' || s === 'fwd. pass' || s === 'knock on') return 1;
        return 2;
    }

    const colsPelota = BALL_SKILLS.reduce((sum, s) => sum + skillCols(s), 0);
    const colsContacto = CONTACT_SKILLS.reduce((sum, s) => sum + skillCols(s), 0);
    const colsPie = FOOT_SKILLS.reduce((sum, s) => sum + skillCols(s), 0);
    const colsInfraccion = INFRACCION_SKILLS.reduce((sum, s) => sum + skillCols(s), 0);

    const filaHead0: RowInput = [
        {
            content: 'Jugador',
            rowSpan: 3,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        },
        {
            content: 'Juego con pelota',
            colSpan: colsPelota,
            styles: { halign: 'center' as const }
        },
        {
            content: 'Juego de contacto',
            colSpan: colsContacto,
            styles: { halign: 'center' as const }
        },
        {
            content: 'Juego con el pie',
            colSpan: colsPie,
            styles: { halign: 'center' as const }
        },
        {
            content: 'Infracciones',
            colSpan: colsInfraccion,
            styles: { halign: 'center' as const }
        },
        {
            content: 'Total\nacciones',
            rowSpan: 3,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        },
        {
            content: 'Efectividad\njuego con\npelota',
            rowSpan: 3,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        },
        {
            content: 'Efectividad\njuego en el\ncontacto',
            rowSpan: 3,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        },
        {
            content: 'Efectividad\njuego con el\npie',
            rowSpan: 3,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        }
    ];

    const filaHead1: RowInput = [];
    ALL_SKILLS.forEach((skill) => {
        filaHead1.push({
            content: skill.includes(' ') ? skill.replace(' ', '\n') : skill,
            colSpan: skillCols(skill),
            styles: { halign: 'center' as const, valign: 'middle' as const }
        });
    });

    const filaHead2: RowInput = [];
    ALL_SKILLS.forEach((skill) => {
        const s = skill.toLowerCase();
        if (s === 'tackle' || s === 'duelo') {
            filaHead2.push({ content: '-' }, { content: '=' }, { content: '+' }, { content: '++' });
        } else if (s === 'penal' || s === 'fwd. pass' || s === 'knock on') {
            filaHead2.push({ content: '+' });
        } else filaHead2.push({ content: '-' }, { content: '+' });
    });

    const encabezados: RowInput[] = [filaHead0, filaHead1, filaHead2];

    // 2. Mapear los datos respetando el orden de carga original del array 'equipo'
    const filasBody = equipo
        .filter((puesto) => puesto.player)
        .map((puesto) => {
            const jugador = puesto.player!;
            const datosJugador = matrizProcesada[jugador.id];

            // Si por alguna razón no se procesó este jugador, devolvemos fila vacía o por defecto
            if (!datosJugador) return [];

            const fila = [`${datosJugador.apellido}`];

            ALL_SKILLS.forEach((skill) => {
                const s = datosJugador.skills[skill];
                const sNombre = skill.toLowerCase();

                if (sNombre === 'penal' || sNombre === 'knock on' || sNombre === 'fwd. pass') {
                    fila.push(s.Positivo || 0);
                } else if (sNombre === 'tackle' || sNombre === 'duelo') {
                    fila.push(s.Negativo || 0);
                    fila.push(s.Neutro || 0);
                    fila.push(s.Positivo || 0);
                    fila.push(s.Dominante || 0);
                } else {
                    fila.push(s.Negativo || 0);
                    fila.push(s.Positivo || 0);
                }
            });

            const pct = (favorable: number, total: number) =>
                total > 0 ? Math.round((favorable / total) * 100) + '%' : '-';

            fila.push(datosJugador.totalGeneral);
            fila.push(pct(datosJugador.efectividadPelota, datosJugador.totalPelota));
            fila.push(pct(datosJugador.efectividadContacto, datosJugador.totalContacto));
            fila.push(pct(datosJugador.efectividadPie, datosJugador.totalPie));

            return fila;
        })
        .filter((fila) => fila.length > 0); // Limpiamos eventuales filas vacías

    // 3. Generar la Tabla con autoTable
    autoTable(doc, {
        head: encabezados,
        body: filasBody,
        startY: 28,
        theme: 'grid',
        styles: {
            fontSize: 8.5,
            cellPadding: 2,
            halign: 'center' as const
        },
        headStyles: {
            fillColor: [37, 99, 235], // Azul #2563eb
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            lineWidth: 0.3,
            lineColor: [255, 255, 255] // Líneas blancas divisorias fijadas
        },
        didDrawPage: (data: HookData) => {
            // Posición Y inicial común para las 3 columnas
            const startY = data.cursor ? data.cursor.y + 10 : 180;
            let currentY = startY;

            // Configuración base de estilos
            doc.setFontSize(9);
            doc.setTextColor(100);

            // Definición de las coordenadas X para cada columna (ajustables según tu margen)
            const col1X = 14;
            const col2X = 65;
            const col3X = 115;

            // ==========================================
            // COLUMNA 1: TACKLE
            // ==========================================
            doc.text('Tackle', col1X, currentY);
            currentY += 6;

            const listaTackle = [
                '\u2022 Errado -',
                '\u2022 Negativo =',
                '\u2022 Positivo +',
                '\u2022 Dominante ++'
            ];
            listaTackle.forEach(item => {
                doc.text(item, col1X + 4, currentY); // col1X + 4 da espacio al bullet
                currentY += 5;
            });

            // Resetear Y a la altura inicial para la siguiente columna
            currentY = startY;

            // ==========================================
            // COLUMNA 2: DUELO
            // ==========================================
            doc.text('Duelo', col2X, currentY);
            currentY += 6;

            const listaDuelo = [
                '\u2022 Negativo -',
                '\u2022 Neutro =',
                '\u2022 Positivo +',
                '\u2022 Quiebre ++'
            ];
            listaDuelo.forEach(item => {
                doc.text(item, col2X + 4, currentY);
                currentY += 5;
            });

            // Resetear Y a la altura inicial para la última columna
            currentY = startY;

            // ==========================================
            // COLUMNA 3: ACLARACIONES
            // ==========================================
            doc.text('Aclaraciones', col3X, currentY);
            currentY += 6;

            // Ajustamos el ancho máximo de la columna de texto (ej. 80 unidades de jsPDF)
            const anchoMaxCol3 = 80;

            // Procesamos los textos largos para que tengan salto de línea automático
            const textoAclaracion1 = doc.splitTextToSize('Solo los tackles negativos, positivos y dominantes cuentan como efectivos.', anchoMaxCol3);
            const textoAclaracion2 = doc.splitTextToSize('Solo los duelos positivos y quiebres cuentan como efectivos.', anchoMaxCol3);

            // Imprimir primer párrafo aclaratorio
            doc.text(textoAclaracion1, col3X, currentY);
            // Calculamos el espacio ocupado por el primer párrafo para no encimar el segundo
            currentY += (textoAclaracion1.length * 5) + 2;

            // Imprimir segundo párrafo aclaratorio
            doc.text(textoAclaracion2, col3X, currentY);

            // --- Pie de pÃ¡gina ---
            const margen = 14;
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;
            const strokeY = pageHeight - 25;

            doc.setDrawColor(37, 99, 235);
            doc.setLineWidth(0.3);
            doc.line(margen, strokeY, pageWidth - margen, strokeY);

            const logoAlto = 40;
            const logoAncho = logoAlto * (210 / 297);
            const logoX = (pageWidth - logoAncho) / 2;
            const logoY = strokeY - (logoAlto - 25) / 2;
            doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoAncho, logoAlto);
            doc.link(logoX, logoY, logoAncho, logoAlto, { url: 'https://stats-rugby.netlify.app/' });
        },


        didParseCell: (data) => {
            const cellText = data.cell.text?.[0]?.toString();
            if (cellText === '-' || cellText === '=' || cellText === '+' || cellText === '++') {
                data.cell.styles.fillColor = [189, 204, 224]; // azul suave (blue-200)
                data.cell.styles.textColor = [30, 64, 175]; // azul oscuro para contraste
            }
            if (data.section === 'body') {
                const esPar = data.row.index % 2 === 0;
                data.cell.styles.fillColor = esPar ? [236, 253, 245] : [209, 250, 229];

                const text = data.cell.text?.[0]?.toString();
                if (['-', '=', '+', '++'].includes(text)) {
                    data.cell.styles.fillColor = [219, 234, 254];
                    data.cell.styles.textColor = [30, 64, 175];
                }
            }
        }
    });

    await agregarDonutsAlPDF(doc, dixTotales, partido, logoDataUrl);

    // 4. Descargar el archivo
    const nombreArchivo = `Reporte_${partido.local}_vs_${partido.visitante}.pdf`.replace(
        /\s+/g,
        '_'
    );
    doc.save(nombreArchivo);
}

