import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { HookData, RowInput, CellHookData } from 'jspdf-autotable';
import { type MatrizProcesada, type DixTotales } from '$lib/processing/reporte-data'
import { agregarDonutsAlPDF, renderSVGaImagen } from '$lib/pdf/donuts'
import { type PartidoContexto, type UnionClave, EQUIPOS_POR_UNION, type Puesto, BALL_SKILLS, CONTACT_SKILLS, FOOT_SKILLS, INFRACCION_SKILLS } from '$lib/types';

function dibujarFooter(doc: jsPDF, logoDataUrl: string): void {
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
}

const onParseCell = (data: CellHookData) => {
    const cellText = data.cell.text?.[0];
    if (cellText === '-' || cellText === '=' || cellText === '+' || cellText === '++') {
        data.cell.styles.fillColor = [189, 204, 224];
        data.cell.styles.textColor = [30, 64, 175];
    }
    if (data.section === 'body') {
        const esPar = data.row.index % 2 === 0;
        data.cell.styles.fillColor = esPar ? [236, 253, 245] : [209, 250, 229];

        if (['-', '=', '+', '++'].includes(cellText ?? '')) {
            data.cell.styles.fillColor = [219, 234, 254];
            data.cell.styles.textColor = [30, 64, 175];
        }
    }
};

function dibujarEncabezado(doc: jsPDF, pageWidth: number, partido: PartidoContexto, escudoLocal: string | null): void {
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
    const escudoYLocal = 6;
    if (escudoLocal) {
        doc.addImage(escudoLocal, 'PNG', escudoXLocal, escudoYLocal, escudoSize, escudoSize);
    }
}



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

    const doc = new jsPDF({ unit: 'mm', format: 'a3' });
    const pageWidth = doc.internal.pageSize.width;

    // --- Header: título a la izquierda, escudo a la derecha ---
    dibujarEncabezado(doc, pageWidth, partido, escudoLocal);

    function skillCols(skill: string): number {
        const s = skill.toLowerCase();
        if (s === 'tackle' || s === 'duelo') return 4;
        if (s === 'penal' || s === 'free kick' || s === 'fwd. pass' || s === 'knock on') return 1;
        return 2;
    }

    const colsPelota = BALL_SKILLS.reduce((sum, s) => sum + skillCols(s), 0);
    const colsContacto = CONTACT_SKILLS.reduce((sum, s) => sum + skillCols(s), 0);
    const colsPie = FOOT_SKILLS.reduce((sum, s) => sum + skillCols(s), 0);
    const colsInfraccion = INFRACCION_SKILLS.reduce((sum, s) => sum + skillCols(s), 0);

    const filaHead0_page1: RowInput = [
        {
            content: 'Jugador',
            rowSpan: 3,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        },
        {
            content: 'Juego en el contacto',
            colSpan: colsContacto,
            styles: { halign: 'center' as const }
        },
        {
            content: 'Infracciones',
            colSpan: colsInfraccion,
            styles: { halign: 'center' as const }
        },
        {
            content: 'Total\nacciones\ncontacto',
            rowSpan: 3,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        },
        {
            content: 'Efectividad\njuego en el\ncontacto',
            rowSpan: 3,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        }
    ];

    const filaHead0_page2: RowInput = [
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
            content: 'Total\nacciones\npelota',
            rowSpan: 3,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        },
        {
            content: 'Efectividad\njuego con\npelota',
            rowSpan: 3,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        }
    ];

    const filaHead0_page3: RowInput = [
        {
            content: 'Jugador',
            rowSpan: 3,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        },
        {
            content: 'Juego con el pie',
            colSpan: colsPie,
            styles: { halign: 'center' as const }
        },
        {
            content: 'Total\nacciones\npie',
            rowSpan: 3,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        },
        {
            content: 'Efectividad\njuego con el\npie',
            rowSpan: 3,
            styles: { halign: 'center' as const, valign: 'middle' as const }
        }
    ];

    // fila de skills
    const filaSkillsContacto: RowInput = [];
    CONTACT_SKILLS.forEach((skill) => {
        filaSkillsContacto.push({
            content: skill.includes(' ') ? skill.replace(' ', '\n') : skill,
            colSpan: skillCols(skill),
            styles: { halign: 'center' as const, valign: 'middle' as const }
        });
    });

    const filaSkillsInfraccion: RowInput = [];
    INFRACCION_SKILLS.forEach((skill) => {
        filaSkillsInfraccion.push({
            content: skill.includes(' ') ? skill.replace(' ', '\n') : skill,
            colSpan: skillCols(skill),
            styles: { halign: 'center' as const, valign: 'middle' as const }
        });
    });

    const filaSkillsBall: RowInput = [];
    BALL_SKILLS.forEach((skill) => {
        filaSkillsBall.push({
            content: skill.includes(' ') ? skill.replace(' ', '\n') : skill,
            colSpan: skillCols(skill),
            styles: { halign: 'center' as const, valign: 'middle' as const }
        });
    });

    const filaSkillsFoot: RowInput = [];
    FOOT_SKILLS.forEach((skill) => {
        filaSkillsFoot.push({
            content: skill.includes(' ') ? skill.replace(' ', '\n') : skill,
            colSpan: skillCols(skill),
            styles: { halign: 'center' as const, valign: 'middle' as const }
        });
    });


    // fila de calificadores 

    const filaHead1_page1: RowInput = [];
    const filaHead1_page2: RowInput = [];
    const filaHead1_page3: RowInput = [];

    CONTACT_SKILLS.forEach((skill) => {
        const s = skill.toLowerCase();
        if (s === 'tackle' || s === 'duelo') {
            filaHead1_page1.push({ content: '-' }, { content: '=' }, { content: '+' }, { content: '++' });
        } else filaHead1_page1.push({ content: '-' }, { content: '+' });
    });

    INFRACCION_SKILLS.forEach(() => {
        filaHead1_page1.push({ content: '+' });
    });

    BALL_SKILLS.forEach(() => {
        filaHead1_page2.push({ content: '-' }, { content: '+' });
    });

    FOOT_SKILLS.forEach(() => {
        filaHead1_page3.push({ content: '-' }, { content: '+' });
    });

    const encabezado_page1: RowInput[] = [filaHead0_page1, [...filaSkillsContacto, ...filaSkillsInfraccion], [...filaHead1_page1]];
    const encabezado_page2: RowInput[] = [filaHead0_page2, [...filaSkillsBall], [...filaHead1_page2]];
    const encabezado_page3: RowInput[] = [filaHead0_page3, [...filaSkillsFoot], [...filaHead1_page3]];

    // 2. Mapear los datos respetando el orden de carga original del array 'equipo'

    // datos contacto page 1
    const filasBody_page1 = equipo
        .filter((puesto) => puesto.player)
        .map((puesto) => {
            const jugador = puesto.player!;
            const datosJugador = matrizProcesada[jugador.id];

            // Si por alguna razón no se procesó este jugador, devolvemos fila vacía o por defecto
            if (!datosJugador) return [];

            const fila = [`${puesto.numero}. ${datosJugador.apellido}`];

            CONTACT_SKILLS.forEach((skill) => {
                const s = datosJugador.skills[skill];
                const sNombre = skill.toLowerCase();

                if (sNombre === 'tackle' || sNombre === 'duelo') {
                    fila.push(s.Negativo || 0);
                    fila.push(s.Neutro || 0);
                    fila.push(s.Positivo || 0);
                    fila.push(s.Dominante || 0);
                } else {
                    fila.push(s.Negativo || 0);
                    fila.push(s.Positivo || 0);
                }
            });

            INFRACCION_SKILLS.forEach((skill) => {
                const s = datosJugador.skills[skill];
                fila.push(s.Positivo || 0);
            });

            const pct_contact = (favorable: number, total: number) =>
                total > 0 ? Math.round((favorable / total) * 100) + '%' : '-';

            fila.push(datosJugador.totalContacto);
            fila.push(pct_contact(datosJugador.efectividadContacto, datosJugador.totalContacto));

            return fila;
        })
        .filter((fila) => fila.length > 0); // Limpiamos eventuales filas vacías

    // datos pelota page 2
    const filasBody_page2 = equipo
        .filter((puesto) => puesto.player)
        .map((puesto) => {
            const jugador = puesto.player!;
            const datosJugador = matrizProcesada[jugador.id];

            // Si por alguna razón no se procesó este jugador, devolvemos fila vacía o por defecto
            if (!datosJugador) return [];

            const fila = [`${puesto.numero}. ${datosJugador.apellido}`];

            BALL_SKILLS.forEach((skill) => {
                const s = datosJugador.skills[skill];
                fila.push(s.Negativo || 0);
                fila.push(s.Positivo || 0);
            });

            const pct_ball = (favorable: number, total: number) =>
                total > 0 ? Math.round((favorable / total) * 100) + '%' : '-';

            fila.push(datosJugador.totalPelota);
            fila.push(pct_ball(datosJugador.efectividadPelota, datosJugador.totalPelota));

            return fila;
        })
        .filter((fila) => fila.length > 0); // Limpiamos eventuales filas vacías

    // datos pie page 3
    const filasBody_page3 = equipo
        .filter((puesto) => puesto.player)
        .map((puesto) => {
            const jugador = puesto.player!;
            const datosJugador = matrizProcesada[jugador.id];

            // Si por alguna razón no se procesó este jugador, devolvemos fila vacía o por defecto
            if (!datosJugador) return [];

            const fila = [`${puesto.numero}. ${datosJugador.apellido}`];

            FOOT_SKILLS.forEach((skill) => {
                const s = datosJugador.skills[skill];
                fila.push(s.Negativo || 0);
                fila.push(s.Positivo || 0);
            });

            const pct_foot = (favorable: number, total: number) =>
                total > 0 ? Math.round((favorable / total) * 100) + '%' : '-';

            fila.push(datosJugador.totalPie);
            fila.push(pct_foot(datosJugador.efectividadPie, datosJugador.totalPie));

            return fila;
        })
        .filter((fila) => fila.length > 0); // Limpiamos eventuales filas vacías

    // 3. Generar la Tabla con autoTable / page 1
    autoTable(doc, {
        head: encabezado_page1,
        body: filasBody_page1,
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

            // COLUMNA 1: DUELO
            doc.text('Duelo', col1X, currentY);
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

            // Resetear Y a la altura inicial para la siguiente columna
            currentY = startY;

            // COLUMNA 2: DUELO

            doc.text('Tackle', col2X, currentY);
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

            // Resetear Y a la altura inicial para la última columna
            currentY = startY;

            // COLUMNA 3: ACLARACIONES
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

            dibujarFooter(doc, logoDataUrl);
        },

        didParseCell: onParseCell,
    });

    // 3. agregar page y Generar la Tabla con autoTable / page 2

    doc.addPage();
    dibujarEncabezado(doc, pageWidth, partido, escudoLocal);

    autoTable(doc, {
        head: encabezado_page2,
        body: filasBody_page2,
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
        didDrawPage: () => {
            doc.setFontSize(9);
            doc.setTextColor(100);

            dibujarFooter(doc, logoDataUrl);
        },

        didParseCell: onParseCell,
    });

    // 3. agregar page y Generar la Tabla con autoTable / page 3

    doc.addPage();
    dibujarEncabezado(doc, pageWidth, partido, escudoLocal);

    autoTable(doc, {
        head: encabezado_page3,
        body: filasBody_page3,
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
        didDrawPage: () => {
            doc.setFontSize(9);
            doc.setTextColor(100);

            dibujarFooter(doc, logoDataUrl);
        },

        didParseCell: onParseCell,
    });

    await agregarDonutsAlPDF(doc, dixTotales, partido, logoDataUrl);

    // 4. Descargar el archivo
    const nombreArchivo = `Reporte_${partido.local}_vs_${partido.visitante}.pdf`.replace(
        /\s+/g,
        '_'
    );
    doc.save(nombreArchivo);
}

