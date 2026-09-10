/*
 * NO SE DAÑÓ NADA QUE YA ESTUVIERA VERIFICADO.
 *
 * ─── POR QUÉ EXISTE ────────────────────────────────────────────────────────
 *
 * El 10 de septiembre de 2026 se añadió a veinticinco fichas el FUNDAMENTO
 * SUSTANCIAL que les faltaba —la causal, leída en el texto oficial del Código
 * Civil— porque el motor, al no tenerla, se negaba a invocarla y escribía tres
 * veces «el fundamento sustancial… no está verificado en este escrito».
 *
 * El miedo legítimo ante una pasada así no es que la adición esté mal: es que
 * al escribirla se mueva, sin que nadie lo note, un TÉRMINO o una AUTORIDAD que
 * costó leer artículo por artículo. Un plazo cambiado por accidente es
 * indistinguible de uno comprobado hasta que un abogado pierde el suyo.
 *
 * Por eso este check no juzga si la adición es buena —eso se juzga contra la
 * fuente oficial, artículo por artículo— sino que TODO LO DEMÁS siguió
 * idéntico. Compara el catálogo compilado contra el retrato tomado antes de
 * tocar nada (`research/catalogo-antes-del-fundamento-sustancial.json`) y falla
 * si:
 *
 *   · hay una ficha de más o de menos, o cambió un id, un nombre o un rol;
 *   · cambió el término, la autoridad competente, las secciones exigidas o la
 *     fuente de CUALQUIER ficha —incluidas las veinticinco tocadas—;
 *   · cambió el `legalBasis` de una ficha que no está en la lista de abajo;
 *   · el `legalBasis` de una de la lista NO empieza por su texto anterior, es
 *     decir, se reescribió en vez de ampliarse;
 *   · una ficha de la lista no creció, lo que significaría que la lista quedó
 *     vieja y este check estaría autorizando un cambio que ya no ocurre.
 *
 * El retrato guarda la huella de los campos congelados y el `legalBasis`
 * entero: la huella basta para detectar el cambio, y el texto completo hace
 * falta para poder comprobar que la adición es una ADICIÓN y no una
 * reescritura.
 */
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ALL_CATALOGS } from '../data';
import type { Actuacion } from '../types';

/**
 * Las fichas a las que esta pasada añadió el fundamento sustancial, y las
 * ÚNICAS cuyo `legalBasis` puede haber crecido. Añadir un id aquí es una
 * decisión deliberada, no el efecto colateral de una corrida.
 */
const FUNDAMENTO_SUSTANCIAL_ANADIDO: readonly string[] = [
  'civil/demanda-de-declaracion-de-pertenencia',
  'civil/sentencia-de-declaracion-de-pertenencia',
  'civil/demanda-de-pago-por-consignacion',
  'civil/demanda-divisoria',
  'civil/demanda-de-deslinde-y-amojonamiento',
  'civil/demanda-de-proceso-de-sucesion',
  'familia/demanda-de-cesacion-de-efectos-civiles-de-matrimonio-religioso',
  'familia/sentencia-de-cesacion-de-efectos-civiles-de-matrimonio-religioso',
  'familia/solicitud-de-divorcio-por-mutuo-consentimiento',
  'familia/sentencia-de-divorcio',
  'familia/demanda-de-separacion-de-cuerpos',
  'familia/sentencia-de-separacion-de-cuerpos',
  'familia/demanda-de-separacion-de-bienes',
  'familia/demanda-de-liquidacion-de-sociedad-conyugal-o-patrimonial',
  'familia/sentencia-aprobatoria-de-la-particion-de-la-sociedad-conyugal-o-patrimonial',
  'familia/demanda-de-peticion-de-herencia',
  'familia/demanda-de-nulidad-de-capitulaciones-matrimoniales',
  'familia/sentencia-de-nulidad-de-matrimonio-civil',
  'familia/solicitud-de-declaracion-de-ausencia',
  'notarial/solicitud-de-divorcio-ante-notario-por-mutuo-acuerdo',
  'notarial/escritura-publica-de-divorcio-o-de-cesacion-de-efectos-civiles-del-matrimonio-religioso-ante-notario',
  'notarial/solicitud-de-liquidacion-de-herencia-ante-notario',
  'notarial/solicitud-de-liquidacion-de-sociedad-conyugal-ante-notario',
  'notarial/solicitud-de-declaracion-de-posesion-regular-ante-notario',
  'notarial/solicitud-de-matrimonio-civil-ante-notario',

  /*
   * SEGUNDA TANDA, el mismo día: los otros cuatro cuerpos normativos que la
   * auditoría señaló —Constitución Título II, Código Sustantivo del Trabajo,
   * Código Penal y Código de Comercio—, doce fichas de cuatro ramas. Se
   * añaden a la MISMA lista y contra el MISMO retrato a propósito: el retrato
   * es anterior a las dos tandas, así que la garantía que se comprueba no es
   * «no se dañó nada desde la tanda anterior» sino «no se ha dañado nada desde
   * antes de tocar el catálogo», que es la que el abogado necesita.
   */
  'constitucional/solicitud-de-habeas-corpus',
  'constitucional/impugnacion-de-la-decision-que-niega-el-habeas-corpus',
  'constitucional/accion-de-tutela-contra-providencia-judicial',
  'laboral/demanda-de-reintegro-por-fuero-sindical',
  'laboral/demanda-de-levantamiento-de-fuero-sindical',
  'laboral/sentencia-de-fuero-sindical',
  'laboral/contestacion-de-la-demanda-laboral',
  'laboral/excepciones-en-proceso-ejecutivo-laboral',
  'penal/solicitud-de-incidente-de-reparacion-integral',
  'penal/sentencia-penal-condenatoria',
  'penal/sentencia-penal-absolutoria',
  'civil/demanda-de-impugnacion-de-actos-de-asambleas-juntas-directivas-o-de-socios'
];

interface FilaDelRetrato {
  id: string;
  exactName: string;
  branch: string;
  role: string;
  legalBasis: string;
  hTerm: string;
  hAuth: string;
  hSections: string;
  hSource: string;
}

interface Retrato {
  tomadoEl: string;
  total: number;
  filas: FilaDelRetrato[];
}

/*
 * El retrato se tomó con `json.dumps(valor, ensure_ascii=False, sort_keys=True,
 * separators=(',', ':'))`. Aquí hay que reproducir ESA cadena y no una
 * parecida: un separador distinto cambiaría todas las huellas y convertiría
 * este check en una alarma permanente, que es la clase de alarma que alguien
 * acaba apagando.
 */
const canonico = (valor: unknown): string => {
  if (valor === null || valor === undefined) return 'null';
  if (Array.isArray(valor)) return `[${valor.map(canonico).join(',')}]`;
  if (typeof valor === 'object') {
    const objeto = valor as Record<string, unknown>;
    return `{${Object.keys(objeto)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonico(objeto[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(valor);
};

const huella = (valor: unknown): string =>
  createHash('sha256').update(canonico(valor), 'utf8').digest('hex').slice(0, 16);

const RETRATO = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'research',
  'catalogo-antes-del-fundamento-sustancial.json'
);

const retrato = JSON.parse(readFileSync(RETRATO, 'utf8')) as Retrato;
const vivas: Actuacion[] = ALL_CATALOGS.flatMap((c) => c.actuaciones);
const porId = new Map(vivas.map((a) => [a.id, a]));
const enElRetrato = new Set(retrato.filas.map((f) => f.id));
const permitidas = new Set(FUNDAMENTO_SUSTANCIAL_ANADIDO);

const fallos: string[] = [];
const crecidas = new Set<string>();

if (vivas.length !== retrato.total) {
  fallos.push(`el catálogo tiene ${vivas.length} fichas y el retrato ${retrato.total}`);
}

for (const fila of retrato.filas) {
  const actuacion = porId.get(fila.id);
  if (!actuacion) {
    fallos.push(`falta la ficha ${fila.id}, que sí estaba antes`);
    continue;
  }
  if (actuacion.exactName !== fila.exactName) fallos.push(`${fila.id}: cambió exactName`);
  if (actuacion.branch !== fila.branch) fallos.push(`${fila.id}: cambió branch`);
  if (actuacion.role !== fila.role) fallos.push(`${fila.id}: cambió role`);
  if (huella(actuacion.term) !== fila.hTerm) fallos.push(`${fila.id}: CAMBIÓ EL TÉRMINO`);
  if (huella(actuacion.competentAuthority) !== fila.hAuth) {
    fallos.push(`${fila.id}: CAMBIÓ LA AUTORIDAD COMPETENTE`);
  }
  if (huella(actuacion.requiredSections) !== fila.hSections) {
    fallos.push(`${fila.id}: CAMBIARON LAS SECCIONES EXIGIDAS`);
  }
  if (huella(actuacion.sourceUrl) !== fila.hSource) fallos.push(`${fila.id}: CAMBIÓ LA FUENTE`);

  if (actuacion.legalBasis === fila.legalBasis) continue;
  if (!permitidas.has(fila.id)) {
    fallos.push(`${fila.id}: cambió el legalBasis de una ficha que nadie autorizó a tocar`);
    continue;
  }
  if (!actuacion.legalBasis.startsWith(fila.legalBasis)) {
    fallos.push(`${fila.id}: el legalBasis se REESCRIBIÓ; aquí solo se permite añadir al final`);
    continue;
  }
  crecidas.add(fila.id);
}

for (const actuacion of vivas) {
  if (!enElRetrato.has(actuacion.id)) {
    fallos.push(`sobra la ficha ${actuacion.id}, que no estaba antes`);
  }
}

for (const id of FUNDAMENTO_SUSTANCIAL_ANADIDO) {
  if (!porId.has(id)) {
    fallos.push(`la lista de fichas tocadas nombra ${id}, que no existe en el catálogo`);
  } else if (!crecidas.has(id)) {
    fallos.push(`${id} está en la lista de fichas tocadas y su legalBasis no creció`);
  }
}

if (fallos.length > 0) {
  console.error(`FAIL catálogo intacto: ${fallos.length} diferencia(s) no autorizada(s)`);
  for (const f of fallos) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  `ok   catálogo intacto: ${vivas.length} fichas antes y ${vivas.length} después; ` +
    `${crecidas.size} con fundamento sustancial añadido; ` +
    '0 cambios en término, autoridad, secciones, fuente o inventario'
);
/* El ejecutor exige uno de sus tres banners; sin él marca el check como roto. */
console.log('ALL CHECKS PASSED');
