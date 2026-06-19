import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { HookData, RowInput } from 'jspdf-autotable';
import { type MatrizProcesada, type DixTotales } from '$lib/processing/reporte-data'
import { agregarDonutsAlPDF } from '$lib/pdf/donuts'
import { type PartidoContexto, type Puesto, BALL_SKILLS, CONTACT_SKILLS, FOOT_SKILLS } from '$lib/types';

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

    const ALL_SKILLS = [...BALL_SKILLS, ...CONTACT_SKILLS, ...FOOT_SKILLS];

    function skillCols(skill: string): number {
        const s = skill.toLowerCase();
        if (s === 'tackle' || s === 'duelo') return 4;
        return 2;
    }

    const colsPelota = BALL_SKILLS.reduce((sum, s) => sum + skillCols(s), 0);
    const colsContacto = CONTACT_SKILLS.reduce((sum, s) => sum + skillCols(s), 0);
    const colsPie = FOOT_SKILLS.reduce((sum, s) => sum + skillCols(s), 0);

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
        filaHead1.push({ content: skill, colSpan: skillCols(skill), styles: { halign: 'center' as const, valign: 'middle' as const } });
    });

    const filaHead2: RowInput = [];
    ALL_SKILLS.forEach((skill) => {
        const s = skill.toLowerCase();
        if (s === 'tackle' || s === 'duelo') {
            filaHead2.push({ content: '-' }, { content: '=' }, { content: '+' }, { content: '++' });
        } else {
            filaHead2.push({ content: '-' }, { content: '+' });
        }
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

            const fila = [`${datosJugador.apellido}, ${datosJugador.nombre}`];

            ALL_SKILLS.forEach((skill) => {
                const s = datosJugador.skills[skill];
                const sNombre = skill.toLowerCase();

                // Primer columna para todas: Negativo (-)
                fila.push(s.Negativo || 0);

                if (sNombre === 'tackle' || sNombre === 'duelo') {
                    fila.push(s.Neutro || 0); // (=)
                    fila.push(s.Positivo || 0); // (+)
                    fila.push(s.Dominante || 0); // (++)
                } else {
                    // El resto de las skills solo tienen (-) y (+)
                    fila.push(s.Positivo || 0); // (+)
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
            doc.setFont('sans-serif');

            doc.text(
                'Tackle: [-] Errado  [=] Negativo  [+] Positivo  [++] Dominante' + '\n\nDuelo: [-] Negativo/Knock-on  [=] Neutro  [+] Positivo  [++] Quiebre',
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

