import type { jsPDF } from 'jspdf';
import type { InformeDeDocumentoRecibido, InformeDeRevision } from './review.api';

/**
 * El informe de revisión, dibujado en PDF con la misma estructura del diálogo.
 *
 * Separado del servicio de exportación a propósito: este módulo no importa
 * archivos de fuentes ni nada de Vite, así que se puede correr en Node con la
 * Helvetica incorporada de jsPDF y comprobar que pagina, que no corta líneas
 * y que cada sección aparece donde debe. El servicio pone la letra de la firma
 * y descarga; aquí solo se dibuja.
 *
 * ─── LO QUE EL ABOGADO PIDIÓ AL VER EL PRIMERO ──────────────────────────────
 *
 * Párrafos justificados, como un escrito. Títulos de sección en un gris
 * bastante más oscuro que el cuerpo gris de las notas, para que se distingan
 * de un vistazo. Y sin el conteo de caracteres: ese dato le sirve a la
 * pantalla para explicar el recorte, no a un documento que se archiva.
 */

interface DatosComunes {
  documentType: string;
  fileName: string;
  fecha: string;
  caracteres: number;
  truncado: boolean;
  conFicha: boolean;
  firmName?: string;
  /** Cliente o proceso al que pertenece el escrito, si la firma lo indicó. */
  cliente?: string;
  /** Quién pidió la revisión (correo), para saber qué abogado lleva el asunto. */
  revisadoPor?: string;
}

export interface DatosDelInforme extends DatosComunes {
  /** Ausente en todo lo escrito antes de que existieran dos modos: entonces es el propio. */
  modo?: 'ESCRITO_PROPIO';
  informe: InformeDeRevision;
}

/**
 * El informe de un documento que el abogado RECIBIÓ.
 *
 * Comparte la geometría, la letra de la firma, el nombre de archivo y el mismo
 * par de funciones de exportación que el informe del escrito propio: es la
 * misma tubería con otro cuerpo. Lo que cambia es lo que se dibuja, porque lo
 * que se sabe es distinto — aquí no hay ficha del catálogo detrás de nada, y
 * el papel lo dice en su propia cabecera.
 */
export interface DatosDelInformeRecibido extends DatosComunes {
  modo: 'DOCUMENTO_RECIBIDO';
  informe: InformeDeDocumentoRecibido;
}

export type DatosDeExportacion = DatosDelInforme | DatosDelInformeRecibido;

/** Carta con márgenes judiciales: 3 cm izquierda, 2,5 cm derecha, 2,5 arriba y abajo. */
const PAGINA = { ancho: 215.9, alto: 279.4, izq: 30, der: 25, arriba: 25, abajo: 25 };

const TINTA: [number, number, number] = [17, 17, 17];
const TITULO: [number, number, number] = [45, 45, 45];
const NOTA: [number, number, number] = [100, 100, 100];

export const dibujarInformeEnPdf = (doc: jsPDF, F: string, d: DatosDeExportacion, cuerpoPt = 11): void => {
  const anchoTexto = PAGINA.ancho - PAGINA.izq - PAGINA.der;
  const lineaMm = (pt: number) => (pt * 1.4 * 25.4) / 72;
  let y = PAGINA.arriba;

  const asegurar = (alto: number) => {
    if (y + alto > PAGINA.alto - PAGINA.abajo) {
      doc.addPage();
      y = PAGINA.arriba;
    }
  };

  /**
   * Un bloque de texto. Justificado cuando cabe entero en la página (jsPDF
   * justifica por bloque); si no cabe, se baja de página si es corto, y si
   * es largo se reparte línea a línea alineado a la izquierda, porque un
   * bloque partido no se puede justificar sin estirar su última línea.
   */
  const bloque = (
    texto: string,
    pt: number,
    estilo: 'normal' | 'bold' | 'italic' = 'normal',
    sangria = 0,
    color: [number, number, number] = TINTA,
    justificar = true
  ) => {
    doc.setFont(F, estilo);
    doc.setFontSize(pt);
    doc.setTextColor(...color);
    const ancho = anchoTexto - sangria;
    const lineas = doc.splitTextToSize(texto, ancho) as string[];
    const alto = lineas.length * lineaMm(pt);
    const cabe = y + alto <= PAGINA.alto - PAGINA.abajo;
    const esCorto = alto < (PAGINA.alto - PAGINA.arriba - PAGINA.abajo) * 0.4;

    if (!cabe && esCorto) asegurar(alto);

    if (justificar && lineas.length > 1 && y + alto <= PAGINA.alto - PAGINA.abajo) {
      doc.text(texto, PAGINA.izq + sangria, y, { maxWidth: ancho, align: 'justify' });
      y += alto;
      return;
    }
    for (const l of lineas) {
      asegurar(lineaMm(pt));
      doc.text(l, PAGINA.izq + sangria, y);
      y += lineaMm(pt);
    }
  };

  const titulo = (texto: string) => {
    y += 3;
    asegurar(lineaMm(cuerpoPt) * 2.2);
    doc.setFont(F, 'bold');
    doc.setFontSize(cuerpoPt - 1);
    doc.setTextColor(...TITULO);
    doc.text(texto.toUpperCase(), PAGINA.izq, y);
    y += lineaMm(cuerpoPt - 1) * 0.6;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(PAGINA.izq, y, PAGINA.ancho - PAGINA.der, y);
    y += lineaMm(cuerpoPt) * 0.9;
  };

  const lista = (items: string[]) => {
    for (const it of items) {
      doc.setFont(F, 'normal');
      doc.setFontSize(cuerpoPt);
      doc.setTextColor(...TINTA);
      const lineas = doc.splitTextToSize(it, anchoTexto - 6) as string[];
      asegurar(lineaMm(cuerpoPt) * Math.min(lineas.length, 2));
      doc.text('•', PAGINA.izq + 1.5, y);
      bloque(it, cuerpoPt, 'normal', 6);
      y += 1;
    }
  };

  /* ─── Cabecera ─────────────────────────────────────────────────────────── */
  const esRecibido = d.modo === 'DOCUMENTO_RECIBIDO';
  if (d.firmName) bloque(d.firmName, cuerpoPt - 2, 'normal', 0, NOTA, false);
  /*
   * EL TÍTULO DICE CUÁL DE LOS DOS SE LEYÓ. Un informe archivado que no
   * distingue entre «revisé mi escrito» y «leí el papel que me llegó» se
   * malinterpreta el día que alguien lo abre sin recordar de dónde salió.
   */
  bloque(
    esRecibido ? `Documento recibido · ${d.fileName}` : `Revisión del escrito · ${d.documentType}`,
    cuerpoPt + 5,
    'bold',
    0,
    TINTA,
    false
  );
  if (d.cliente) bloque(`Cliente o proceso: ${d.cliente}`, cuerpoPt - 1, 'bold', 0, TITULO, false);
  bloque(
    [d.fileName, d.fecha, d.revisadoPor && `revisión pedida por ${d.revisadoPor}`].filter(Boolean).join(' · ') +
      (d.truncado ? ' · el escrito fue recortado a 300.000 caracteres' : ''),
    cuerpoPt - 2,
    'normal',
    0,
    NOTA,
    false
  );
  bloque(
    esRecibido
      ? 'Lectura de un documento recibido. Todo lo que sigue sale del texto del propio documento; no hay ficha del catálogo detrás de ninguna afirmación.'
      : d.conFicha
      ? `Revisado contra la ficha verificada de «${d.documentType}».`
      : 'Sin ficha verificada de la actuación: lo objetivo va con menos respaldo.',
    cuerpoPt - 2,
    'italic',
    0,
    NOTA,
    false
  );
  y += 2;

  const seccion = (t: string, items: string[]) => {
    if (items.length === 0) return;
    titulo(t);
    lista(items);
  };

  /* ─── Cuerpo del documento recibido ────────────────────────────────────── */
  if (d.modo === 'DOCUMENTO_RECIBIDO') {
    const r = d.informe;
    if (r.queEs) bloque(r.queEs, cuerpoPt + 0.5);
    const identificacion = [
      r.quienLoProfirio && `Lo profirió: ${r.quienLoProfirio}`,
      r.radicado && `Radicado: ${r.radicado}`,
      r.fecha && `Fecha del documento: ${r.fecha}`
    ].filter(Boolean) as string[];
    if (identificacion.length) {
      titulo('Según el propio documento');
      lista(identificacion);
    }
    seccion('Qué decide u ordena', r.decide);

    if (r.cargas.length > 0) {
      titulo('Qué le exige y para cuándo');
      for (const c of r.cargas) {
        if (c.carga) bloque(c.carga, cuerpoPt);
        /*
         * EL PLAZO VACÍO SE ESCRIBE, NO SE OMITE. Saltarse la línea dejaría al
         * lector suponiendo que no había plazo o que se olvidó decirlo; aquí se
         * afirma lo único que se sabe — que el documento no lo anuncia — y se
         * remite a donde ese dato sí está verificado.
         */
        bloque(
          c.plazo
            ? `Plazo que anuncia el documento: ${c.plazo}`
            : 'El documento no anuncia plazo para esta carga. Consúltelo en la guía de actuaciones del catálogo antes de contar días.',
          cuerpoPt,
          'bold',
          4,
          c.plazo ? TITULO : NOTA,
          false
        );
        if (c.cita) bloque(`Dice el documento: «${c.cita}»`, cuerpoPt - 1, 'italic', 4, NOTA);
        y += 1.5;
      }
    } else {
      titulo('Qué le exige y para cuándo');
      bloque('Del texto de este documento no se desprende ninguna carga a su cargo.', cuerpoPt);
    }

    seccion('Qué queda pendiente, según el documento', r.loQueSigue);
    seccion('Lo que el documento no dice', r.noLoDiceElDocumento);

    y += 4;
    bloque(
      'Este informe solo afirma lo que está escrito en el documento, citándolo. No hay ficha verificada del catálogo detrás de ninguna de sus líneas: ningún artículo, plazo, autoridad ni recurso se ha completado de memoria. Para saber qué actuación procede, con su término, su artículo y su autoridad verificados, lleve los hechos a la guía de actuaciones; y ponga el vencimiento en la agenda de términos.',
      cuerpoPt - 2.5,
      'normal',
      0,
      NOTA
    );
    return;
  }

  /* ─── Cuerpo del escrito propio, en el orden del diálogo ───────────────── */
  const i = d.informe;
  if (i.resumen) bloque(i.resumen, cuerpoPt + 0.5);

  seccion('Secciones que la norma exige y faltan', i.seccionesFaltantes);
  seccion('Fortalezas', i.fortalezas);
  seccion('Debilidades', i.debilidades);

  if (i.erroresDeAplicacion.length > 0) {
    titulo('Errores de aplicación');
    for (const e of i.erroresDeAplicacion) {
      if (e.donde) bloque(e.donde, cuerpoPt - 1, 'bold', 0, TITULO, false);
      if (e.problema) bloque(e.problema, cuerpoPt);
      if (e.correccion) bloque(`Corrección: ${e.correccion}`, cuerpoPt, 'italic', 4);
      y += 1.5;
    }
  }
  const citas = i.correccionesTextuales ?? [];
  if (citas.length > 0) {
    titulo('Citas del escrito y reemplazo propuesto');
    for (const c of citas) {
      bloque('Dice:', cuerpoPt - 1.5, 'bold', 0, NOTA, false);
      bloque(`«${c.cita}»`, cuerpoPt, 'italic', 4, TINTA);
      if (c.problema) bloque(c.problema, cuerpoPt - 1, 'normal', 4, NOTA);
      if (c.reemplazo) {
        bloque('Reemplazo propuesto:', cuerpoPt - 1.5, 'bold', 0, TITULO, false);
        bloque(`«${c.reemplazo}»`, cuerpoPt, 'normal', 4, TINTA);
      }
      y += 2;
    }
  }
  seccion('Recomendaciones', i.recomendaciones);

  /* ─── Pie ──────────────────────────────────────────────────────────────── */
  y += 4;
  bloque(
    'Lo marcado como exigencia de la norma sale de la ficha verificada del catálogo; lo demás es criterio profesional del revisor y el abogado decide. El informe no cita providencias: donde se necesite precedente, debe verificarse antes de presentar.',
    cuerpoPt - 2.5,
    'normal',
    0,
    NOTA
  );
};
