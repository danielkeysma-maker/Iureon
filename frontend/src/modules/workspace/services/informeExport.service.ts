import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { registrarFuenteDelEscrito } from '../../documents/services/pdfFonts';
import { etiquetaDeAtaque } from './ataque';
import { getMarcaActual } from '../../tenant/services/branding.api';
import { dibujarInformeEnPdf, type DatosDeExportacion } from './informeLayout';

/**
 * Exportar el informe de una revisión a PDF y a Word, con la estructura del
 * diálogo: juicio global, secciones que faltan, fortalezas, debilidades,
 * errores de aplicación con su corrección y recomendaciones.
 *
 * La letra y el tamaño son los de Membrete, como en los escritos: el informe
 * es material de trabajo de la firma y sale con su formato. Sin membrete
 * completo ni bloque de firma —no se radica; se lee para corregir—.
 *
 * ─── LOS DOS MODOS SALEN POR AQUÍ MISMO ─────────────────────────────────────
 *
 * El informe de un documento RECIBIDO —un auto, una sentencia, un oficio— usa
 * estas dos mismas funciones, la misma letra, el mismo nombre de archivo y la
 * misma geometría. Solo cambia lo que se escribe dentro, porque lo que se sabe
 * de un papel que llegó es otra cosa que lo que se sabe de un escrito propio.
 * Duplicar la exportación habría dejado una de las dos copias atrás.
 */

const nombreDeArchivo = (d: DatosDeExportacion, ext: string): string =>
  `${d.modo === 'DOCUMENTO_RECIBIDO' ? 'Documento_recibido' : 'Revision'}_${d.documentType.replace(/[^\p{L}\p{N}]+/gu, '_')}_${d.fileName.replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}]+/gu, '_')}.${ext}`;

export const exportarInformeAPdf = async (d: DatosDeExportacion): Promise<void> => {
  const marca = getMarcaActual();
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
  const F = await registrarFuenteDelEscrito(doc, marca?.fontFamily ?? 'Times New Roman');
  dibujarInformeEnPdf(doc, F, { ...d, firmName: d.firmName ?? marca?.firmName }, marca?.fontSizePt ?? 11);
  doc.setProperties({
    title: d.modo === 'DOCUMENTO_RECIBIDO' ? `Documento recibido · ${d.fileName}` : `Revisión · ${d.documentType}`,
    subject: d.fileName,
    creator: 'Iureon'
  });
  doc.save(nombreDeArchivo(d, 'pdf'));
};

export const exportarInformeAWord = async (d: DatosDeExportacion): Promise<void> => {
  const marca = getMarcaActual();
  const font = marca?.fontFamily === 'Inter' ? 'Calibri' : (marca?.fontFamily ?? 'Times New Roman');
  const base = (marca?.fontSizePt ?? 11) * 2; // docx mide en medios puntos
  const gris = '555555';
  const titulos = '2D2D2D';

  const p = (text: string, o: { bold?: boolean; italics?: boolean; size?: number; color?: string; after?: number; indent?: number; justificar?: boolean } = {}) =>
    new Paragraph({
      spacing: { after: o.after ?? 120, line: 300 },
      alignment: o.justificar === false ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
      indent: o.indent ? { left: o.indent } : undefined,
      children: [new TextRun({ text, font, bold: o.bold, italics: o.italics, size: o.size ?? base, color: o.color ?? '111111' })]
    });
  const titulo = (t: string) =>
    new Paragraph({
      spacing: { before: 240, after: 80 },
      border: { bottom: { color: 'C8C8C8', size: 6, style: 'single', space: 2 } },
      children: [new TextRun({ text: t.toUpperCase(), font, bold: true, size: base - 2, color: titulos })]
    });
  const vineta = (t: string) =>
    new Paragraph({ bullet: { level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { after: 80, line: 300 }, children: [new TextRun({ text: t, font, size: base })] });

  const esRecibido = d.modo === 'DOCUMENTO_RECIBIDO';
  const hijos: Paragraph[] = [];
  const firma = d.firmName ?? marca?.firmName;
  if (firma) hijos.push(p(firma, { size: base - 4, color: gris, after: 40, justificar: false }));
  hijos.push(
    p(esRecibido ? `Documento recibido · ${d.fileName}` : `Revisión del escrito · ${d.documentType}`, {
      bold: true,
      size: base + 8,
      after: 60,
      justificar: false
    })
  );
  if (d.cliente) hijos.push(p(`Cliente o proceso: ${d.cliente}`, { bold: true, size: base - 2, color: titulos, after: 40, justificar: false }));
  hijos.push(
    p(
      [d.fileName, d.fecha, d.revisadoPor && `revisión pedida por ${d.revisadoPor}`].filter(Boolean).join(' · ') +
        (d.truncado ? ' · el escrito fue recortado a 300.000 caracteres' : ''),
      { size: base - 4, color: gris, after: 40, justificar: false }
    )
  );
  hijos.push(
    p(
      esRecibido
        ? 'Lectura de un documento recibido. Todo lo que sigue sale del texto del propio documento; no hay ficha del catálogo detrás de ninguna afirmación.'
        : d.conFicha
        ? `Revisado contra la ficha verificada de «${d.documentType}».`
        : 'Sin ficha verificada de la actuación: lo objetivo va con menos respaldo.',
      { italics: true, size: base - 4, color: gris, after: 200, justificar: false }
    )
  );

  const seccion = (t: string, items: string[]) => {
    if (!items.length) return;
    hijos.push(titulo(t));
    items.forEach((x) => hijos.push(vineta(x)));
  };

  const empaquetar = async () => {
    const documento = new Document({
      creator: 'Iureon',
      title: esRecibido ? `Documento recibido · ${d.fileName}` : `Revisión · ${d.documentType}`,
      sections: [{ properties: { page: { margin: { top: 1418, right: 1418, bottom: 1418, left: 1701 } } }, children: hijos }]
    });
    saveAs(await Packer.toBlob(documento), nombreDeArchivo(d, 'docx'));
  };

  /* ─── El documento recibido: lo que dice el papel, citado ──────────────── */
  if (d.modo === 'DOCUMENTO_RECIBIDO') {
    const r = d.informe;
    if (r.queEs) hijos.push(p(r.queEs, { size: base + 1, after: 160 }));
    seccion(
      'Según el propio documento',
      [
        r.quienLoProfirio && `Lo profirió: ${r.quienLoProfirio}`,
        r.radicado && `Radicado: ${r.radicado}`,
        r.fecha && `Fecha del documento: ${r.fecha}`
      ].filter(Boolean) as string[]
    );
    seccion('Qué decide u ordena', r.decide);

    hijos.push(titulo('Qué le exige y para cuándo'));
    if (r.cargas.length) {
      for (const c of r.cargas) {
        if (c.carga) hijos.push(p(c.carga, { after: 40 }));
        /* El plazo ausente se declara: callarlo se leería como que no hay plazo. */
        hijos.push(
          p(
            c.plazo
              ? `Plazo que anuncia el documento: ${c.plazo}`
              : 'El documento no anuncia plazo para esta carga. Consúltelo en la guía de actuaciones del catálogo antes de contar días.',
            { bold: true, color: c.plazo ? titulos : gris, indent: 360, after: 40, justificar: false }
          )
        );
        if (c.cita) hijos.push(p(`Dice el documento: «${c.cita}»`, { italics: true, size: base - 2, color: gris, indent: 360, after: 160 }));
      }
    } else {
      hijos.push(p('Del texto de este documento no se desprende ninguna carga a su cargo.', { after: 120 }));
    }

    seccion('Qué queda pendiente, según el documento', r.loQueSigue);
    seccion('Lo que el documento no dice', r.noLoDiceElDocumento);

    /* Por dónde se ataca, con la cita y la opinión separadas también en el papel. */
    const flancos = r.porDondeSeAtaca ?? [];
    if (flancos.length) {
      hijos.push(titulo('Por dónde se ataca'));
      hijos.push(
        p(
          'Cada punto se apoya en las palabras del propio documento, que van citadas. Lo que sigue a «Lectura del revisor» es criterio, no texto del documento: aquí se señala el flanco y concluye usted.',
          { italics: true, size: base - 4, color: gris, after: 160 }
        )
      );
      for (const punto of flancos) {
        hijos.push(p(etiquetaDeAtaque(punto.clase), { bold: true, size: base - 2, color: titulos, after: 40, justificar: false }));
        hijos.push(p('Dice el documento:', { bold: true, size: base - 3, color: gris, after: 20, justificar: false }));
        hijos.push(p(`«${punto.cita}»`, { italics: true, indent: 360, after: 40 }));
        if (punto.norma && punto.citaDeLaNorma) {
          hijos.push(p(`Norma en que el propio documento se apoya: ${punto.norma}`, { bold: true, size: base - 3, color: gris, after: 20, justificar: false }));
          hijos.push(p(`El documento la transcribe así: «${punto.citaDeLaNorma}»`, { italics: true, indent: 360, after: 40 }));
        }
        if (punto.lectura) {
          hijos.push(p('Lectura del revisor:', { bold: true, size: base - 3, color: titulos, after: 20, justificar: false }));
          hijos.push(p(punto.lectura, { indent: 360, after: 160 }));
        }
      }
    }

    hijos.push(
      new Paragraph({
        spacing: { before: 320 },
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: 'Este informe solo afirma lo que está escrito en el documento, citándolo. No hay ficha verificada del catálogo detrás de ninguna de sus líneas: ningún artículo, plazo, autoridad ni recurso se ha completado de memoria; los flancos que se señalan salen de las citas y no declaran ilegalidad ni nulidad alguna. Para saber qué actuación procede para atacarlos, con su término, su artículo y su autoridad verificados, lleve los hechos a la guía de actuaciones; y ponga el vencimiento en la agenda de términos.',
            font,
            size: base - 5,
            color: '6E6E6E'
          })
        ]
      })
    );
    await empaquetar();
    return;
  }

  const i = d.informe;
  if (i.resumen) hijos.push(p(i.resumen, { size: base + 1, after: 160 }));
  seccion('Secciones que la norma exige y faltan', i.seccionesFaltantes);
  seccion('Fortalezas', i.fortalezas);
  seccion('Debilidades', i.debilidades);
  if (i.erroresDeAplicacion.length) {
    hijos.push(titulo('Errores de aplicación'));
    for (const e of i.erroresDeAplicacion) {
      if (e.donde) hijos.push(p(e.donde, { bold: true, size: base - 2, color: titulos, after: 40, justificar: false }));
      if (e.problema) hijos.push(p(e.problema, { after: 40 }));
      if (e.correccion) hijos.push(p(`Corrección: ${e.correccion}`, { italics: true, indent: 360, after: 160 }));
    }
  }
  const citas = i.correccionesTextuales ?? [];
  if (citas.length) {
    hijos.push(titulo('Citas del escrito y reemplazo propuesto'));
    for (const c of citas) {
      hijos.push(p('Dice:', { bold: true, size: base - 3, color: gris, after: 20, justificar: false }));
      hijos.push(p(`«${c.cita}»`, { italics: true, indent: 360, after: 40 }));
      if (c.problema) hijos.push(p(c.problema, { size: base - 2, color: gris, indent: 360, after: 40 }));
      if (c.reemplazo) {
        hijos.push(p('Reemplazo propuesto:', { bold: true, size: base - 3, color: titulos, after: 20, justificar: false }));
        hijos.push(p(`«${c.reemplazo}»`, { indent: 360, after: 160 }));
      }
    }
  }
  seccion('Recomendaciones', i.recomendaciones);
  hijos.push(
    new Paragraph({
      spacing: { before: 320 },
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: 'Lo marcado como exigencia de la norma sale de la ficha verificada del catálogo; lo demás es criterio profesional del revisor y el abogado decide. El informe no cita providencias: donde se necesite precedente, debe verificarse antes de presentar.',
          font,
          size: base - 5,
          color: '6E6E6E'
        })
      ]
    })
  );

  await empaquetar();
};
