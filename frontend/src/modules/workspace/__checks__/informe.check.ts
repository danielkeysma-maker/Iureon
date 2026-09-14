/**
 * Guards the review report layout in PDF. Run with: npm run check:informe
 *
 * Runs in Node with jsPDF's built-in Helvetica: no font files, no Vite. What
 * has to hold: every section of the dialog appears, in its order; a long
 * report paginates instead of running off the sheet; an empty section is
 * not drawn.
 */
import { jsPDF } from 'jspdf';
import { dibujarInformeEnPdf, type DatosDelInforme, type DatosDelInformeLibre, type DatosDelInformeRecibido } from '../services/informeLayout';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const textoDe = (doc: jsPDF): string => {
  // jsPDF's internal page text is not exposed; the output stream carries the strings in Tj operators.
  const out = doc.output();
  return out;
};

const base: DatosDelInforme = {
  documentType: 'Acción de tutela',
  fileName: 'tutela.pdf',
  fecha: '2 de septiembre de 2026',
  caracteres: 4912,
  truncado: false,
  conFicha: true,
  firmName: 'Anibal Diaz Contreras',
  cliente: 'Joel Ayus - EPS Sanitas',
  revisadoPor: 'anibal@correo.co',
  informe: {
    resumen: 'El escrito cumple lo esencial del artículo 14 del Decreto 2591 de 1991.',
    fortalezas: ['Hechos cronológicos y verificables.'],
    debilidades: ['La tercera pretensión es subsidiaria mal redactada.'],
    seccionesFaltantes: ['Residencia del solicitante (art. 14).'],
    erroresDeAplicacion: [{ donde: 'Fundamentos', problema: 'Cita una sentencia sin verificar.', correccion: 'Suprimir la cita.' }],
    correccionesTextuales: [{ cita: 'solicito se ordene lo pertinente', problema: 'No es concreta.', reemplazo: 'solicito ORDENAR a la EPS autorizar el procedimiento' }],
    recomendaciones: ['Formular la petición como orden concreta.']
  }
};

const doc = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc, 'helvetica', base, 11);
check('un informe corto cabe en una página', doc.getNumberOfPages() === 1, String(doc.getNumberOfPages()));
const salida = textoDe(doc);
check('el PDF se genera con contenido', salida.length > 2000, String(salida.length));
check('el PDF no imprime el conteo de caracteres: es dato de pantalla', !/4912|4\.912/.test(salida));
check('el PDF lleva el cliente o proceso y quien pidio la revision', /Joel Ayus/.test(salida) && /anibal@correo\.co/.test(salida));
check('el PDF lleva la cita textual y su reemplazo', /solicito se ordene lo pertinente/.test(salida) && /solicito ORDENAR a la EPS/.test(salida));

/* Un informe largo pagina: 40 recomendaciones de tres líneas cada una. */
const largo: DatosDelInforme = {
  ...base,
  informe: {
    ...base.informe,
    recomendaciones: Array.from({ length: 40 }, (_, k) => `Recomendación ${k + 1}: ` + 'revisar con cuidado la redacción de la pretensión y su relación con los hechos narrados, '.repeat(2))
  }
};
const doc2 = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc2, 'helvetica', largo, 11);
check('un informe largo pagina en vez de salirse de la hoja', doc2.getNumberOfPages() >= 3, String(doc2.getNumberOfPages()));

/* Secciones vacías no se dibujan: mismo número de páginas con y sin ellas vacías. */
const vacias: DatosDelInforme = { ...base, informe: { ...base.informe, seccionesFaltantes: [], fortalezas: [], erroresDeAplicacion: [] } };
const doc3 = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc3, 'helvetica', vacias, 11);
check('con secciones vacías el PDF es más corto, no igual', textoDe(doc3).length < salida.length, `${textoDe(doc3).length} < ${salida.length}`);

/* Sin ficha, lo dice. */
const doc4 = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc4, 'helvetica', { ...base, conFicha: false }, 11);
check('sin ficha, el PDF se genera igual', doc4.getNumberOfPages() === 1);

/* ─── EL DOCUMENTO RECIBIDO Y SUS FLANCOS ───────────────────────────────────
 *
 * El papel que se archiva con el expediente tiene que separar la cita de la
 * opinión igual que la pantalla: primero las palabras del documento, después la
 * lectura del revisor, rotulada. Y la norma solo se nombra cuando el documento
 * la transcribe — un artículo suelto en el papel se completa de memoria.
 */
const recibido: DatosDelInformeRecibido = {
  documentType: 'Documento recibido',
  fileName: 'auto.pdf',
  fecha: '9 de septiembre de 2026',
  caracteres: 3100,
  truncado: false,
  conFicha: false,
  modo: 'DOCUMENTO_RECIBIDO',
  informe: {
    queEs: 'Auto que inadmite la demanda.',
    quienLoProfirio: 'Juzgado Tercero Civil Municipal',
    radicado: '2026-00345',
    fecha: '3 de septiembre de 2026',
    decide: ['Inadmite la demanda.'],
    cargas: [{ carga: 'Subsanar la demanda.', plazo: 'cinco (5) dias', cita: 'concedese el termino de cinco (5) dias' }],
    loQueSigue: ['Vencido el termino se resolvera sobre la admision.'],
    noLoDiceElDocumento: ['No indica desde cuando se cuenta el termino.'],
    porDondeSeAtaca: [
      {
        clase: 'TENSION_CON_LA_NORMA',
        cita: 'rechazase de plano la demanda',
        norma: 'articulo 90 del Codigo General del Proceso',
        citaDeLaNorma: 'el juez senalara los defectos para que se subsanen',
        lectura: 'El auto transcribe una norma que manda conceder termino y sin embargo rechaza.'
      },
      { clase: 'NO_RESUELVE', cita: 'no se hace pronunciamiento sobre lo demas', norma: '', citaDeLaNorma: '', lectura: 'La medida cautelar quedo sin resolver.' }
    ]
  }
};
const doc5 = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc5, 'helvetica', recibido, 11);
const salidaRecibido = textoDe(doc5);
check('el PDF del documento recibido trae la seccion por donde se ataca', /POR D.{1,6}NDE SE ATACA/.test(salidaRecibido), salidaRecibido.slice(salidaRecibido.indexOf('POR D'), salidaRecibido.indexOf('POR D') + 30));
check('y trae la cita del documento y la de la norma, separadas de la lectura del revisor', /rechazase de plano la demanda/.test(salidaRecibido) && /senalara los defectos/.test(salidaRecibido) && /Lectura del revisor/.test(salidaRecibido));

/* Sin flancos, la sección no se dibuja: el papel es más corto, no igual. */
const sinFlancos: DatosDelInformeRecibido = { ...recibido, informe: { ...recibido.informe, porDondeSeAtaca: [] } };
const doc6 = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc6, 'helvetica', sinFlancos, 11);
check('sin flancos la seccion no se dibuja', textoDe(doc6).length < salidaRecibido.length, `${textoDe(doc6).length} < ${salidaRecibido.length}`);

/* Un informe guardado antes de que la sección existiera no revienta. */
const anterior = { ...recibido, informe: { ...recibido.informe, porDondeSeAtaca: undefined } } as DatosDelInformeRecibido;
const doc7 = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc7, 'helvetica', anterior, 11);
check('un informe anterior a la seccion se dibuja igual, sin ella', doc7.getNumberOfPages() >= 1 && !/Lectura del revisor/.test(textoDe(doc7)));

/* ─── LA TERCERA FORMA: EL INFORME QUE NO SE PUDO ORDENAR ───────────────────
 *
 * Existe, la firma la paga, y hasta hoy era la unica que no se podia
 * descargar. Lo que tiene que aguantar: que el texto salga entero, que la
 * cabecera diga cual de los dos se leyo —el origen manda sobre la forma— y
 * que no se le inventen secciones que el revisor no produjo.
 */
const libre: DatosDelInformeLibre = {
  documentType: 'Accion de tutela',
  fileName: 'tutela.pdf',
  fecha: '9 de septiembre de 2026',
  caracteres: 4912,
  truncado: false,
  conFicha: true,
  modo: 'INFORME_LIBRE',
  origen: 'ESCRITO_PROPIO',
  texto: 'El escrito cumple lo esencial.\n\nPero la tercera pretension es subsidiaria mal redactada y conviene reformularla como orden concreta.'
};
const doc8 = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc8, 'helvetica', libre, 11);
const salidaLibre = textoDe(doc8);
check('el informe sin secciones se dibuja con su texto completo', /El escrito cumple lo esencial/.test(salidaLibre) && /subsidiaria mal redactada/.test(salidaLibre));
check('y declara por que no viene por secciones', /no se pudo ordenar por secciones/.test(salidaLibre));
check('no se le inventan secciones que el revisor no produjo', !/FORTALEZAS|DEBILIDADES|RECOMENDACIONES/.test(salidaLibre));
check('sobre un escrito propio la cabecera dice revision del escrito', /Revisi.{1,6}n del escrito/.test(salidaLibre));

/* El origen manda sobre la forma: un documento recibido sin secciones sigue siendo un documento recibido. */
const libreRecibido: DatosDelInformeLibre = { ...libre, origen: 'DOCUMENTO_RECIBIDO', fileName: 'auto.pdf' };
const doc9 = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc9, 'helvetica', libreRecibido, 11);
const salidaLibreRecibido = textoDe(doc9);
check('un documento recibido sin secciones no se rotula como escrito propio', !/Revisi.{1,6}n del escrito/.test(salidaLibreRecibido) && /Documento recibido/.test(salidaLibreRecibido));

/* Un informe largo sin secciones pagina igual que uno estructurado. */
const libreLargo: DatosDelInformeLibre = {
  ...libre,
  texto: Array.from({ length: 60 }, (_, k) => `Parrafo ${k + 1}: ` + 'revisar con cuidado la redaccion de la pretension y su relacion con los hechos narrados, '.repeat(2)).join('\n\n')
};
const doc10 = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc10, 'helvetica', libreLargo, 11);
check('un informe largo sin secciones pagina en vez de salirse de la hoja', doc10.getNumberOfPages() >= 3, String(doc10.getNumberOfPages()));

/* ─── LA COMPROBACIÓN AUTOMÁTICA EN EL PAPEL (14 de septiembre de 2026) ─────
 *
 * El servidor ya no escribe corchetes ni avisos dentro del informe: manda la
 * comprobación como dato. El papel tiene que dibujar la banda arriba y la marca
 * junto al hallazgo. Y un informe guardado ANTES, con sus corchetes, tiene que
 * salir con la advertencia UNA vez —junto al hallazgo— y no además dentro del
 * párrafo, que es lo que haría dibujar su texto tal cual.
 */
const cuantas = (texto: string, re: RegExp): number => (texto.match(new RegExp(re.source, 'g')) ?? []).length;

const MENSAJE_DEROGADA = 'NORMA DEROGADA — este artículo NO está vigente: Derogado por la Ley 820 de 2003. La revisión lo nombró de todos modos; no se apoye en él.';
const conComprobacion: DatosDelInforme = {
  ...base,
  informe: {
    ...base.informe,
    debilidades: ['Debe invocarse el artículo 2035 del Código Civil.'],
    pasajesDelCaso: 4,
    comprobaciones: {
      articulos: [
        {
          codigo: 'CODIGO CIVIL',
          norma: 'Código Civil',
          articulo: 2035,
          vigencia: { estado: 'DEROGADO', detalle: 'Derogado por la Ley 820 de 2003', fuentes: ['SENADO'], consultadoEn: '2026-09-14' },
          glosa: null,
          glosas: [],
          clases: ['DEROGADA'],
          mensajes: [{ clase: 'DEROGADA', texto: MENSAJE_DEROGADA }],
          dondeAparece: [{ seccion: 'debilidades', indice: 0 }]
        }
      ],
      cuenta: { derogada: 1, modulada: 0, fuentesEnDesacuerdo: 0, noLoDiceElArticulo: 0, noComprobada: 0 },
      avisos: ['COMPROBACIÓN AUTOMÁTICA DE VIGENCIA — 1 DEROGADO(S): CODIGO CIVIL, art. 2035.'],
      vigenciaComprobada: true,
      glosaComprobada: true
    }
  }
};
const doc11 = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc11, 'helvetica', conComprobacion, 11);
const salidaComprobada = textoDe(doc11);
check('el PDF lleva la banda de comprobación automática', /COMPROBACI.{1,6}N AUTOM.{1,6}TICA/.test(salidaComprobada));
check('con el conteo por clase', /Derogada: 1/.test(salidaComprobada));
check('y la marca junto al hallazgo, con su rótulo y su mensaje', /Derogada .{1,6} C.{1,6}digo Civil, art\. 2035/.test(salidaComprobada) && cuantas(salidaComprobada, /NORMA DEROGADA/) === 1, String(cuantas(salidaComprobada, /NORMA DEROGADA/)));
check('y dice con cuántos pasajes del caso se cruzó', /Se cruz.{1,6} con 4 pasajes del caso/.test(salidaComprobada));

const guardadoConCorchetes: DatosDelInforme = {
  ...base,
  informe: {
    ...base.informe,
    debilidades: [`Debe invocarse el artículo 2035 [${MENSAJE_DEROGADA}] del Código Civil.`],
    recomendaciones: [
      'COMPROBACIÓN AUTOMÁTICA DE VIGENCIA — esta revisión citó artículos por fuera de la ficha verificada, y el sistema los consultó uno por uno en las fuentes normativas oficiales (la Secretaría del Senado y el Gestor Normativo de Función Pública): 1 DEROGADO(S): CODIGO CIVIL, art. 2035. Cada uno queda señalado en el punto donde la revisión lo nombra. El resto del informe no cambia; lo señalado no se puede usar tal como está.',
      'Formular la petición como orden concreta.'
    ]
  }
};
const doc12 = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc12, 'helvetica', guardadoConCorchetes, 11);
const salidaGuardada = textoDe(doc12);
check('un informe guardado con corchetes no los imprime dentro del párrafo', !/\[NORMA DEROGADA/.test(salidaGuardada));
check('pero su advertencia sigue: UNA vez, junto al hallazgo', cuantas(salidaGuardada, /NORMA DEROGADA/) === 1, String(cuantas(salidaGuardada, /NORMA DEROGADA/)));
check(
  'y su aviso sale una vez, en la banda, no además en las recomendaciones',
  cuantas(salidaGuardada, /COMPROBACI.{1,6}N AUTOM.{1,6}TICA DE VIGENCIA/) === 1 && /Derogada: 1/.test(salidaGuardada),
  String(cuantas(salidaGuardada, /COMPROBACI.{1,6}N AUTOM.{1,6}TICA DE VIGENCIA/))
);

const doc13 = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc13, 'helvetica', { ...base, informe: { ...base.informe, comprobaciones: null, pasajesDelCaso: 0 } }, 11);
check('una nueva revisión dice en el papel que no repitió la comprobación', /no repiti.{1,6} la comprobaci/.test(textoDe(doc13)));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
