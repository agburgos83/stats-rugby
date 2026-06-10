import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { HookData, RowInput } from 'jspdf-autotable';
import { type MatrizProcesada, type DixTotales } from '$lib/processing/reporte-data'
import { agregarDonutsAlPDF } from '$lib/pdf/donuts'
import { type PartidoContexto, type Puesto } from '$lib/types';
import { SKILLS } from '$lib/types';

export async function descargarPDF(
    equipo: Puesto[],
    partido: PartidoContexto,
    matrizProcesada: MatrizProcesada,
    dixTotales: DixTotales
): Promise<void> {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
    doc.setFontSize(16);
    doc.text(
        `Tabla de acciones-jugador: ${partido.local} (${partido.puntosLocal}) vs ${partido.visitante} (${partido.puntosVisitante})`,
        14,
        12
    );
    doc.setFontSize(12);
    doc.text(
        `Unión: ${partido.union} | División: ${partido.division} | Fecha: ${partido.fecha}`,
        14,
        18
    );

    const filaHead1: RowInput = [
        {
            content: 'Jugador',
            rowSpan: 2,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        }
    ];

    const filaHead2: RowInput = [];

    // 1. Armar Encabezados dinámicos según las especificaciones exactas
    SKILLS.forEach((skill) => {
        const sNombre = skill.toLowerCase();

        if (sNombre === 'tackle') {
            // 4 columnas
            filaHead1.push({ content: skill, colSpan: 4, styles: { halign: 'center' as const } });
            filaHead2.push({ content: '-' }, { content: '=' }, { content: '+' }, { content: '++' });
        } else if (sNombre === 'duelo') {
            // 3 columnas
            filaHead1.push({ content: skill, colSpan: 3, styles: { halign: 'center' as const } });
            filaHead2.push({ content: '-' }, { content: '=' }, { content: '+' });
        } else {
            // 2 columnas para el resto
            filaHead1.push({ content: skill, colSpan: 2, styles: { halign: 'center' as const } });
            filaHead2.push({ content: '-' }, { content: '+' });
        }
    });

    // Añadimos las columnas de Totales al final de la primera fila
    filaHead1.push(
        {
            content: 'Total\nacciones',
            rowSpan: 2,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        },
        {
            content: 'Total\nacciones\npositivas',
            rowSpan: 2,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        }
    );

    const encabezados: RowInput[] = [filaHead1, filaHead2];

    // 2. Mapear los datos respetando el orden de carga original del array 'equipo'
    const filasBody = equipo
        .filter((puesto) => puesto.player)
        .map((puesto) => {
            const jugador = puesto.player!;
            const datosJugador = matrizProcesada[jugador.id];

            // Si por alguna razón no se procesó este jugador, devolvemos fila vacía o por defecto
            if (!datosJugador) return [];

            const fila = [`${datosJugador.apellido}, ${datosJugador.nombre}`];

            SKILLS.forEach((skill) => {
                const s = datosJugador.skills[skill];
                const sNombre = skill.toLowerCase();

                // Primer columna para todas: Negativo (-)
                fila.push(s.Negativo || 0);

                if (sNombre === 'tackle') {
                    fila.push(s.Neutro || 0); // (=)
                    fila.push(s.Positivo || 0); // (+)
                    fila.push(s.Dominante || 0); // (++)
                } else if (sNombre === 'duelo') {
                    fila.push(s.Neutro || 0); // (=)
                    fila.push(s.Positivo || 0); // (+)
                } else {
                    // El resto de las skills solo tienen (-) y (+)
                    fila.push(s.Positivo || 0); // (+)
                }
            });

            // Totales generales al final de la fila del jugador
            fila.push(datosJugador.totalGeneral);
            fila.push(datosJugador.totalPositivas);

            return fila;
        })
        .filter((fila) => fila.length > 0); // Limpiamos eventuales filas vacías

    // 3. Generar la Tabla con autoTable
    autoTable(doc, {
        head: encabezados,
        body: filasBody,
        startY: 24,
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
        columnStyles: {
            0: { halign: 'left' as const, fontStyle: 'bold', cellWidth: 50 }
        },
        didDrawPage: (data: HookData) => {
            const finalY = data.cursor ? data.cursor.y + 10 : 180;

            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.setFont('sans-serif', 'italic');

            doc.text(
                'Leyenda de calificaciones:  [-] Negativo   [=] Neutro   [+] Positivo   [++] Dominante',
                14,
                finalY
            );
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

    await agregarDonutsAlPDF(doc, dixTotales, partido);

    // 4. Descargar el archivo
    const nombreArchivo = `Reporte_${partido.local}_vs_${partido.visitante}.pdf`.replace(
        /\s+/g,
        '_'
    );
    doc.save(nombreArchivo);
}

