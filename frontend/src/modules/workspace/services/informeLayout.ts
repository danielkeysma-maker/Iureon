import type { jsPDF } from 'jspdf';
import { etiquetaDeAtaque } from './ataque';
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

/**
 * El informe que el revisor NO devolvio ordenado por secciones.
 *
 * Es la tercera forma que existe de verdad, y hasta hoy era la unica que no se
 * podia descargar: la pantalla la mostraba y los botones quedaban apagados con
 * un «copielo». Un informe que la firma pago y no puede archivar junto al
 * expediente no esta entregado. Sale por la misma tuberia, con la misma letra
 * y el mismo nombre de archivo; el cuerpo es el texto tal como llego, sin
 * inventarle secciones que el revisor no produjo.
 */
export interface DatosDelInformeLibre extends DatosComunes {
  modo: 'INFORME_LIBRE';
  /** Cual de los dos se leyo. Solo decide la cabecera y el pie: el cuerpo es el texto tal cual. */
  origen: 'ESCRITO_PROPIO' | 'DOCUMENTO_RECIBIDO';
  texto: string;
}

export type DatosDeExportacion = DatosDelInforme | DatosDelInformeRecibido | DatosDelInformeLibre;

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
  /*
   * QUE SE LEYO no siempre coincide con QUE FORMA TIENE EL INFORME: un
   * documento recibido cuyo revisor no devolvio secciones sale como informe
   * libre y sigue siendo la lectura de un papel ajeno. La cabecera se decide
   * por el origen, no por la forma, o el archivo diria «Revision del escrito»
   * sobre el auto de un juez.
   */
  const esRecibido = d.modo === 'DOCUMENTO_RECIBIDO' || (d.modo === 'INFORME_LIBRE' && d.origen === 'DOCUMENTO_RECIBIDO');
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

  /* ─── Cuerpo del informe sin secciones ─────────────────────────────────── */
  if (d.modo === 'INFORME_LIBRE') {
    bloque(
      'El revisor respondio en un formato que no se pudo ordenar por secciones. Abajo va su texto completo, tal como lo devolvio: no se le ha impuesto ninguna estructura ni se ha suprimido nada.',
      cuerpoPt - 2,
      'italic',
      0,
      NOTA
    );
    y += 2;
    /*
     * PARRAFO A PARRAFO, no de una sola vez. `bloque` justifica cuando el
     * texto cabe entero en la pagina; pasarle un informe de varias paginas
     * como un solo bloque lo dejaria alineado a la izquierda de principio a
     * fin. Y los renglones en blanco del revisor se respetan: en un texto sin
     * titulos son la unica separacion que hay.
     */
    for (const parrafo of d.texto.split('\n')) {
      if (parrafo.trim() === '') {
        y += lineaMm(cuerpoPt) * 0.5;
        continue;
      }
      bloque(parrafo, cuerpoPt);
    }
    y += 4;
    bloque(
      esRecibido
        ? 'Este informe solo afirma lo que esta escrito en el documento recibido. Ninguna ficha verificada del catalogo respalda sus lineas: para saber que actuacion procede, con su termino y su articulo, lleve los hechos a la guia de actuaciones.'
        : 'Lo que este informe afirme como exigencia de la norma no viene ordenado por secciones y no se pudo contrastar con la ficha del catalogo seccion por seccion: lealo como criterio profesional del revisor y verifique antes de presentar.',
      cuerpoPt - 2.5,
      'normal',
      0,
      NOTA
    );
    return;
  }

  /* ─── Cuerpo del documento recibido ────────────────────────────────────── */
  if (d.modo === 'DOCUMENTO_RECIBIDO') {
    const r = d.informe;
    /* Igual que en la pantalla: sin posición declarada no se habla en segunda persona. */
    const seSabeLaPosicion = Boolean(r.posicion) && r.posicion !== 'DESCONOCIDO';
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

    /*
     * EL RÓTULO SOLO DICE «LE» SI SE SABE A QUIÉN. Y aquí importa más que en
     * la pantalla: un PDF se imprime, se archiva y se lee meses después, sin
     * nadie al lado que aclare que la app no sabía qué parte era el lector.
     */
    const rotuloCargas = seSabeLaPosicion ? 'Qué le exige y para cuándo' : 'Qué exige el documento y para cuándo';

    if (r.cargas.length > 0) {
      titulo(rotuloCargas);
      for (const c of r.cargas) {
        if (c.carga) bloque(c.carga, cuerpoPt);
        /* De quién es, cuando el servidor pudo decirlo sin ambigüedad. */
        if (c.deQuienEs === 'DE_OTRO') {
          bloque(`Esta carga NO es suya: el documento se la impone a ${c.aQuien}.`, cuerpoPt, 'bold', 4, NOTA, false);
        } else if (c.aQuien) {
          bloque(`El documento se la impone a ${c.aQuien}.`, cuerpoPt - 1, 'normal', 4, NOTA, false);
        }
        /*
         * EL PLAZO VACÍO SE ESCRIBE, NO SE OMITE. Saltarse la línea dejaría al
         * lector suponiendo que no había plazo o que se olvidó decirlo; aquí se
         * afirma lo único que se sabe — que el documento no lo anuncia — y se
         * remite a donde ese dato sí está verificado.
         *
         * SALVO QUE LA CARGA SEA AJENA: ahí no falta ningún plazo suyo, y el
         * aviso de ir a contar días al catálogo sería un encargo que nadie le
         * hizo. Se escribe el plazo si el documento lo trae, y nada si no.
         */
        if (c.plazo) {
          bloque(
            `Plazo que anuncia el documento: ${c.plazo}`,
            cuerpoPt,
            'bold',
            4,
            c.deQuienEs === 'DE_OTRO' ? NOTA : TITULO,
            false
          );
        } else if (c.deQuienEs !== 'DE_OTRO') {
          bloque(
            'El documento no anuncia plazo para esta carga. Consúltelo en la guía de actuaciones del catálogo antes de contar días.',
            cuerpoPt,
            'bold',
            4,
            NOTA,
            false
          );
        }
        if (c.cita) bloque(`Dice el documento: «${c.cita}»`, cuerpoPt - 1, 'italic', 4, NOTA);
        y += 1.5;
      }
    } else {
      titulo(rotuloCargas);
      bloque(
        seSabeLaPosicion
          ? 'Del texto de este documento no se desprende ninguna carga a su cargo.'
          : 'Del texto de este documento no se desprende ninguna carga.',
        cuerpoPt
      );
    }

    seccion('Qué queda pendiente, según el documento', r.loQueSigue);
    seccion('Lo que el documento no dice', r.noLoDiceElDocumento);

    /*
     * POR DÓNDE SE ATACA. Va al papel como va a la pantalla, y con la misma
     * separación a la vista: primero las palabras del documento, en cursiva y
     * entre comillas; después, rotulada, la lectura del revisor. Un informe
     * impreso que mezclara las dos se leería en el expediente como si el auto
     * hubiera dicho lo que dijo quien lo revisó.
     */
    const flancos = r.porDondeSeAtaca ?? [];
    if (flancos.length > 0) {
      titulo('Por dónde se ataca');
      bloque(
        'Cada punto se apoya en las palabras del propio documento, que van citadas. Lo que sigue a «Lectura del revisor» es criterio, no texto del documento: aquí se señala el flanco y concluye usted.',
        cuerpoPt - 2,
        'italic',
        0,
        NOTA
      );
      y += 1;
      for (const p of flancos) {
        bloque(etiquetaDeAtaque(p.clase), cuerpoPt - 1, 'bold', 0, TITULO, false);
        bloque('Dice el documento:', cuerpoPt - 1.5, 'bold', 0, NOTA, false);
        bloque(`«${p.cita}»`, cuerpoPt, 'italic', 4, TINTA);
        if (p.norma && p.citaDeLaNorma) {
          bloque(`Norma en que el propio documento se apoya: ${p.norma}`, cuerpoPt - 1, 'bold', 0, NOTA, false);
          bloque(`El documento la transcribe así: «${p.citaDeLaNorma}»`, cuerpoPt, 'italic', 4, TINTA);
        }
        if (p.lectura) {
          bloque('Lectura del revisor:', cuerpoPt - 1.5, 'bold', 0, TITULO, false);
          bloque(p.lectura, cuerpoPt, 'normal', 4);
        }
        y += 2;
      }
    }

    y += 4;
    bloque(
      'Este informe solo afirma lo que está escrito en el documento, citándolo. No hay ficha verificada del catálogo detrás de ninguna de sus líneas: ningún artículo, plazo, autoridad ni recurso se ha completado de memoria; los flancos que se señalan salen de las citas y no declaran ilegalidad ni nulidad alguna. Para saber qué actuación procede para atacarlos, con su término, su artículo y su autoridad verificados, lleve los hechos a la guía de actuaciones; y ponga el vencimiento en la agenda de términos.',
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
