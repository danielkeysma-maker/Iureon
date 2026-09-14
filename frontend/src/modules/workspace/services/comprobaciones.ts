import { extraerMarcasGuardadas } from './marcas';
import type {
  CampoDelInforme,
  ClaseDeComprobacion,
  ComprobacionDeArticulo,
  ComprobacionesDelInforme,
  CorreccionTextual,
  InformeDeRevision,
  LugarDelInforme,
  SeccionDelInforme
} from './review.api';

/**
 * LA COMPROBACIÓN AUTOMÁTICA DEL INFORME, LISTA PARA DIBUJAR. Puro: sin React.
 *
 * ─── POR QUÉ EXISTE ────────────────────────────────────────────────────────
 *
 * Desde el 14 de septiembre de 2026 («opción 2») el servidor manda la vigencia
 * y la glosa como DATO y deja el texto del informe con las palabras del
 * revisor. Las tres superficies que muestran el informe —el diálogo, el taller
 * y el PDF/Word— necesitan lo mismo: una banda arriba con los conteos y los
 * avisos, y una marca junto a cada hallazgo afectado. Si cada una lo calculara
 * por su cuenta, la primera corrección dejaría a las otras dos atrás.
 *
 * ─── Y LOS INFORMES GUARDADOS ANTES ────────────────────────────────────────
 *
 * Traen la comprobación ESCRITA: corchetes donde el revisor nombró el artículo
 * y dos avisos al frente de las recomendaciones. `normalizarInforme` los saca
 * del texto —por apertura y cierre exactos, nunca por un corchete suelto— y
 * los devuelve con la misma forma que manda el servidor, hasta donde el texto
 * alcanza. Así la advertencia se ve UNA vez (en la banda o junto al hallazgo)
 * y no además dentro del párrafo, y nada de lo que se veía desaparece.
 */

export type OrigenDeLaComprobacion =
  /** El servidor mandó el dato. */
  | 'SERVIDOR'
  /** Informe guardado antes del cambio, leído de sus corchetes y avisos. */
  | 'TEXTO_GUARDADO'
  /** «Volver a revisar»: no se repitió la comprobación. */
  | 'NO_SE_REPITIO'
  /** Informe viejo sin nada escrito: no se sabe si se comprobó. No se afirma nada. */
  | 'SIN_DATOS';

export interface InformeNormalizado {
  /** El texto del revisor, sin marcas ni avisos. */
  informe: InformeDeRevision;
  comprobaciones: ComprobacionesDelInforme | null;
  origen: OrigenDeLaComprobacion;
  pasajesDelCaso: number | null;
}

export const ETIQUETA_DE_CLASE: Record<ClaseDeComprobacion, string> = {
  DEROGADA: 'Derogada',
  MODULADA: 'Modulada',
  FUENTES_EN_DESACUERDO: 'Fuentes en desacuerdo',
  NO_LO_DICE_EL_ARTICULO: 'No lo dice el artículo',
  NO_COMPROBADA: 'No comprobada'
};

/**
 * LAS CLASES QUE SE MARCAN SOBRE EL HALLAZGO: las mismas que antes llevaban
 * corchete en línea. Lo NO COMPROBADO —la fuente que no respondió, la glosa
 * dudosa— nunca se marcó en el párrafo, a propósito: «no pude comprobarlo»
 * pegado a cada cita convierte un mal minuto del Senado en un informe lleno de
 * avisos, y la falsa alarma enseña a ignorar también los verdaderos. Se cuenta
 * y se nombra en la banda.
 */
const SE_MARCAN: ReadonlySet<ClaseDeComprobacion> = new Set(['DEROGADA', 'MODULADA', 'FUENTES_EN_DESACUERDO', 'NO_LO_DICE_EL_ARTICULO']);

const CLAVE_DE_CUENTA: Record<ClaseDeComprobacion, keyof ComprobacionesDelInforme['cuenta']> = {
  DEROGADA: 'derogada',
  MODULADA: 'modulada',
  FUENTES_EN_DESACUERDO: 'fuentesEnDesacuerdo',
  NO_LO_DICE_EL_ARTICULO: 'noLoDiceElArticulo',
  NO_COMPROBADA: 'noComprobada'
};

const ORDEN: ClaseDeComprobacion[] = ['DEROGADA', 'MODULADA', 'FUENTES_EN_DESACUERDO', 'NO_LO_DICE_EL_ARTICULO', 'NO_COMPROBADA'];

/* ─── Los informes guardados antes ─────────────────────────────────────────── */

const INICIO_AVISO_VIGENCIA = 'COMPROBACIÓN AUTOMÁTICA DE VIGENCIA — ';
const INICIO_AVISO_GLOSA = 'COMPROBACIÓN AUTOMÁTICA DE LO QUE ESTA REVISIÓN AFIRMA DE CADA ARTÍCULO — ';

/** Los artículos que un tramo del aviso nombra, «NORMA, art. N; NORMA, art. M». */
const nombradosEn = (tramo: string): Array<{ norma: string; articulo: number }> =>
  tramo
    .split('; ')
    .map((x) => /^(.+), art\. (\d+)$/.exec(x.trim()))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ norma: m[1], articulo: Number(m[2]) }));

/**
 * Qué artículos declara cada aviso, por clase. La redacción es la de
 * `avisoDeVigencia` y `avisoDeGlosa` del backend; los cortes se hacen en las
 * frases fijas que siguen a cada tramo, no en un punto cualquiera, porque las
 * normas y las frases juzgadas pueden traer puntos.
 */
const declaradosEnAvisos = (avisos: string[]): Array<{ clase: ClaseDeComprobacion; norma: string; articulo: number }> => {
  const salida: Array<{ clase: ClaseDeComprobacion; norma: string; articulo: number }> = [];
  const agregar = (clase: ClaseDeComprobacion, lista: Array<{ norma: string; articulo: number }>) =>
    lista.forEach((x) => salida.push({ clase, ...x }));
  for (const aviso of avisos) {
    if (aviso.startsWith(INICIO_AVISO_VIGENCIA)) {
      const derogados = /\d+ DEROGADO\(S\): (.*?)(?=\. \d+ vigente\(s\)|\. \d+ sobre el\/los|\. Cada uno queda)/.exec(aviso);
      const modulados = /\d+ vigente\(s\) pero MODULADO\(S\) por la Corte: (.*?)(?=\. \d+ sobre el\/los|\. Cada uno queda)/.exec(aviso);
      const discrepantes = /\d+ sobre el\/los que las fuentes oficiales NO COINCIDEN: (.*?)(?=\. Cada uno queda)/.exec(aviso);
      if (derogados) agregar('DEROGADA', nombradosEn(derogados[1]));
      if (modulados) agregar('MODULADA', nombradosEn(modulados[1]));
      if (discrepantes) agregar('FUENTES_EN_DESACUERDO', nombradosEn(discrepantes[1]));
    } else if (aviso.startsWith(INICIO_AVISO_GLOSA)) {
      const noSostenidas = /\d+ que el texto oficial NO SOSTIENE: (.*?)(?=\. \d+ que no se pudo|\. Lo no sostenido queda|\. Lo dudoso no se da)/.exec(aviso);
      const dudosas = /\d+ que no se pudo dar por comprobada\(s\): (.*?)(?=\. Lo no sostenido queda|\. Lo dudoso no se da)/.exec(aviso);
      if (noSostenidas) {
        /* Cada entrada trae la frase juzgada, que puede llevar «; »: se ancla en «— la revisión afirma «». */
        for (const m of noSostenidas[1].matchAll(/(?:^|; )([^;«»]+?), art\. (\d+) — la revisión afirma «/g)) {
          salida.push({ clase: 'NO_LO_DICE_EL_ARTICULO', norma: m[1], articulo: Number(m[2]) });
        }
      }
      if (dudosas) agregar('NO_COMPROBADA', nombradosEn(dudosas[1]));
    }
  }
  return salida;
};

const casillas = (i: InformeDeRevision): Array<{ lugar: LugarDelInforme; texto: string; poner: (t: string) => void }> => {
  const salida: Array<{ lugar: LugarDelInforme; texto: string; poner: (t: string) => void }> = [];
  salida.push({ lugar: { seccion: 'resumen', indice: 0 }, texto: i.resumen, poner: (t) => (i.resumen = t) });
  (['fortalezas', 'debilidades', 'seccionesFaltantes', 'recomendaciones'] as const).forEach((seccion) =>
    i[seccion].forEach((texto, indice) => salida.push({ lugar: { seccion, indice }, texto, poner: (t) => (i[seccion][indice] = t) }))
  );
  i.erroresDeAplicacion.forEach((e, indice) =>
    (['donde', 'problema', 'correccion'] as const).forEach((campo) =>
      salida.push({ lugar: { seccion: 'erroresDeAplicacion', indice, campo }, texto: e[campo], poner: (t) => (e[campo] = t) })
    )
  );
  /* La cita NO entra: es verbatim del abogado y nunca llevó marca. */
  (i.correccionesTextuales ?? []).forEach((c: CorreccionTextual, indice) =>
    (['problema', 'reemplazo'] as const).forEach((campo) =>
      salida.push({ lugar: { seccion: 'correccionesTextuales', indice, campo }, texto: c[campo], poner: (t) => (c[campo] = t) })
    )
  );
  return salida;
};

const copiaProfunda = (i: InformeDeRevision): InformeDeRevision => JSON.parse(JSON.stringify(i)) as InformeDeRevision;

const leerDelTexto = (original: InformeDeRevision): InformeNormalizado => {
  const informe = copiaProfunda(original);
  delete informe.comprobaciones;

  /* 1. Los avisos del FRENTE de las recomendaciones, y solo del frente: ahí los ponía el controlador. */
  const avisos: string[] = [];
  while (informe.recomendaciones.length > 0) {
    const primera = informe.recomendaciones[0];
    if (!primera.startsWith(INICIO_AVISO_VIGENCIA) && !primera.startsWith(INICIO_AVISO_GLOSA)) break;
    avisos.push(primera);
    informe.recomendaciones.shift();
  }

  /* 2. Las marcas de cada casilla, con su lugar. */
  const porArticulo = new Map<number, ComprobacionDeArticulo>();
  const entrada = (articulo: number): ComprobacionDeArticulo => {
    let a = porArticulo.get(articulo);
    if (!a) {
      a = {
        codigo: '',
        norma: '',
        articulo,
        vigencia: { estado: 'VIGENTE', detalle: '', fuentes: [], consultadoEn: '' },
        glosa: null,
        glosas: [],
        clases: [],
        mensajes: [],
        dondeAparece: []
      };
      porArticulo.set(articulo, a);
    }
    return a;
  };
  let huboMarcas = false;
  for (const casilla of casillas(informe)) {
    if (!casilla.texto) continue;
    const { texto, marcas } = extraerMarcasGuardadas(casilla.texto);
    if (marcas.length === 0) continue;
    huboMarcas = true;
    casilla.poner(texto);
    for (const m of marcas) {
      /* Sin número legible no hay a qué artículo atarla; se ata al 0 para no perder el aviso. */
      const a = entrada(m.articulo ?? 0);
      if (!a.clases.includes(m.clase)) a.clases.push(m.clase);
      const mensaje = m.marca.slice(1, -1);
      if (!a.mensajes.some((x) => x.clase === m.clase && x.texto === mensaje)) a.mensajes.push({ clase: m.clase, texto: mensaje });
      const lugar: LugarDelInforme =
        m.delReemplazo ? { seccion: 'correccionesTextuales', indice: casilla.lugar.indice, campo: 'reemplazo' } : casilla.lugar;
      if (!a.dondeAparece.some((l) => l.seccion === lugar.seccion && l.indice === lugar.indice && l.campo === lugar.campo)) {
        a.dondeAparece.push(lugar);
      }
    }
  }

  if (avisos.length === 0 && !huboMarcas) {
    return { informe: original, comprobaciones: null, origen: 'SIN_DATOS', pasajesDelCaso: original.pasajesDelCaso ?? null };
  }

  /* 3. Lo que los avisos declaran y el texto no marcó (una cita del abogado, lo dudoso). La norma, del aviso. */
  const declarados = declaradosEnAvisos(avisos);
  for (const d of declarados) {
    const a = entrada(d.articulo);
    if (!a.clases.includes(d.clase)) a.clases.push(d.clase);
  }
  /*
   * La norma, del aviso. Primero la del aviso de glosa, que la escribe como la
   * lee el abogado («Ley 820 de 2003»); después la de vigencia, que usa la
   * clave interna («CODIGO CIVIL») y solo llena lo que falte.
   */
  const deGlosa = (d: { clase: ClaseDeComprobacion }): boolean => d.clase === 'NO_LO_DICE_EL_ARTICULO' || d.clase === 'NO_COMPROBADA';
  for (const d of [...declarados.filter(deGlosa), ...declarados.filter((x) => !deGlosa(x))]) {
    const a = entrada(d.articulo);
    if (!a.norma) a.norma = d.norma;
  }

  const articulos = [...porArticulo.values()];
  const cuenta = { derogada: 0, modulada: 0, fuentesEnDesacuerdo: 0, noLoDiceElArticulo: 0, noComprobada: 0 };
  for (const a of articulos) for (const clase of a.clases) cuenta[CLAVE_DE_CUENTA[clase]]++;

  return {
    informe,
    comprobaciones: { articulos, cuenta, avisos, vigenciaComprobada: true, glosaComprobada: true },
    origen: 'TEXTO_GUARDADO',
    pasajesDelCaso: original.pasajesDelCaso ?? null
  };
};

/**
 * El informe listo para dibujar en cualquiera de las tres superficies. El
 * informe que llega no se muta.
 */
export const normalizarInforme = (informe: InformeDeRevision): InformeNormalizado => {
  if (informe.comprobaciones === null) {
    return { informe, comprobaciones: null, origen: 'NO_SE_REPITIO', pasajesDelCaso: informe.pasajesDelCaso ?? null };
  }
  if (informe.comprobaciones) {
    return { informe, comprobaciones: informe.comprobaciones, origen: 'SERVIDOR', pasajesDelCaso: informe.pasajesDelCaso ?? null };
  }
  return leerDelTexto(informe);
};

/* ─── Lo que se dibuja ─────────────────────────────────────────────────────── */

export interface MarcaDelHallazgo {
  clase: ClaseDeComprobacion;
  etiqueta: string;
  articulo: number;
  /** Vacío cuando un informe viejo no la dejó escrita. */
  norma: string;
  mensaje: string;
  /** En qué campos del hallazgo aparece el artículo; «reemplazo» y «cita» se rotulan aparte. */
  campos: CampoDelInforme[];
}

/** Las marcas que van junto a un hallazgo: una por artículo y clase, aunque lo nombre varias veces. */
export const marcasDelHallazgo = (
  comprobaciones: ComprobacionesDelInforme | null,
  seccion: SeccionDelInforme,
  indice: number
): MarcaDelHallazgo[] => {
  if (!comprobaciones) return [];
  const salida: MarcaDelHallazgo[] = [];
  for (const a of comprobaciones.articulos) {
    const aqui = a.dondeAparece.filter((l) => l.seccion === seccion && l.indice === indice);
    if (aqui.length === 0) continue;
    for (const m of a.mensajes) {
      if (!SE_MARCAN.has(m.clase)) continue;
      salida.push({
        clase: m.clase,
        etiqueta: ETIQUETA_DE_CLASE[m.clase],
        articulo: a.articulo,
        norma: a.norma,
        mensaje: m.texto,
        campos: aqui.map((l) => l.campo).filter((c): c is CampoDelInforme => Boolean(c))
      });
    }
  }
  return salida;
};

/** El rótulo corto de una marca: «Derogada · Código Civil, art. 2035». */
export const rotuloDeMarca = (m: MarcaDelHallazgo): string => {
  const donde = m.campos.includes('reemplazo') ? ' · en el reemplazo propuesto' : m.campos.includes('cita') && m.campos.length === 1 ? ' · en la cita del escrito' : '';
  const articulo = m.articulo > 0 ? `${m.norma ? `${m.norma}, ` : ''}art. ${m.articulo}` : '';
  return [m.etiqueta, articulo].filter(Boolean).join(' · ') + donde;
};

export interface LineasDeLaBanda {
  titulo: string;
  cuenta: Array<{ clase: ClaseDeComprobacion; etiqueta: string; cantidad: number }>;
  /** Los avisos de cabecera de siempre, una vez cada uno. */
  avisos: string[];
  /** Lo no comprobado por la vigencia, que no tiene marca propia ni aviso. */
  noComprobadas: string[];
  /** Una línea de estado cuando no hay conteos que mostrar. */
  nota: string | null;
}

/**
 * La banda de la comprobación. null cuando no hay nada que decir: un encabezado
 * seguido de nada es una casilla que se aprende a saltar.
 */
export const lineasDeLaBanda = (n: InformeNormalizado): LineasDeLaBanda | null => {
  const titulo = 'Comprobación automática';
  if (n.origen === 'NO_SE_REPITIO') {
    return { titulo, cuenta: [], avisos: [], noComprobadas: [], nota: 'Esta revisión no repitió la comprobación automática.' };
  }
  const c = n.comprobaciones;
  if (!c) return null;
  if (!c.vigenciaComprobada) {
    return {
      titulo,
      cuenta: [],
      avisos: [],
      noComprobadas: [],
      nota: 'La comprobación automática no pudo completarse: las fuentes oficiales no respondieron. Lo que esta revisión cita por fuera de la ficha quedó sin comprobar.'
    };
  }
  const cuenta = ORDEN.map((clase) => ({ clase, etiqueta: ETIQUETA_DE_CLASE[clase], cantidad: c.cuenta[CLAVE_DE_CUENTA[clase]] })).filter((x) => x.cantidad > 0);
  const noComprobadas = c.articulos
    .filter((a) => a.vigencia.estado === 'NO_VERIFICABLE')
    .map((a) => `${a.norma ? `${a.norma}, ` : ''}art. ${a.articulo} — ${a.mensajes.find((m) => m.clase === 'NO_COMPROBADA')?.texto ?? a.vigencia.detalle}`);
  if (cuenta.length === 0 && c.avisos.length === 0) {
    if (c.articulos.length === 0) return null;
    const k = c.articulos.length;
    return {
      titulo,
      cuenta: [],
      avisos: [],
      noComprobadas: [],
      nota: `Se ${k === 1 ? 'comprobó 1 artículo citado' : `comprobaron ${k} artículos citados`} por fuera de la ficha, en las fuentes oficiales; ninguno requiere atención.`
    };
  }
  return { titulo, cuenta, avisos: c.avisos, noComprobadas, nota: null };
};

/** «Se cruzó con N pasajes del caso», o null cuando no se cruzó ninguno. */
export const lineaDePasajes = (n: Pick<InformeNormalizado, 'pasajesDelCaso'>): string | null =>
  n.pasajesDelCaso && n.pasajesDelCaso > 0
    ? `Se cruzó con ${n.pasajesDelCaso} ${n.pasajesDelCaso === 1 ? 'pasaje' : 'pasajes'} del caso.`
    : null;
