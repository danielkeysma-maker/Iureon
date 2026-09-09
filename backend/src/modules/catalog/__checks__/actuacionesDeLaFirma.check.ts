/**
 * Las actuaciones que la firma añade por su cuenta. SIN RED Y SIN BASE.
 *
 * Run with: npm run check:actuaciones-firma
 *
 * ─── QUÉ SE VIGILA AQUÍ, Y POR QUÉ ESTO Y NO OTRA COSA ──────────────────────
 *
 * Esta función es la única del producto que deja entrar al catálogo un nombre
 * que nadie verificó. Todo lo que impide que eso se vuelva peligroso es
 * determinista y cabe en este archivo:
 *
 *  1. que una actuación propia NO pueda taparle el nombre a una publicada —si
 *     lo hiciera, el abogado elegiría la copia sin norma y el motor redactaría
 *     sin el artículo y el término que sí existían;
 *  2. que nazca declarada como no verificada, y que solo ascienda con término
 *     Y fuente, nunca con el término solo;
 *  3. que el bloque que recibe el modelo diga que NO hay ficha y le prohíba
 *     inventar artículo, término y secciones. Sin esa frase el modelo rellena
 *     el hueco, que es lo que hace por defecto.
 *
 * Nada de esto toca la red ni Supabase: son funciones puras sobre el catálogo
 * publicado. Va en la suite de siempre, no en la de red.
 */
import { catalogService } from '../catalog.service';
import { renderCatalogGuidance } from '../../agent/catalogGuidance';
import {
  actuacionPropiaComoCatalogo,
  slugDeActuacion,
  validarActuacionPropia,
  AVISO_SIN_NORMA
} from '../firmActuaciones.validate';
import type { FirmActuacion } from '../types';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const RAMAS = catalogService.listBranches();
const CIVIL = catalogService.list('CIVIL');

const nueva = (over: Partial<FirmActuacion> = {}): FirmActuacion => ({
  id: 'civil/acuerdo-de-pago-ante-el-conjunto-residencial',
  area: 'CIVIL',
  exactName: 'Acuerdo de pago ante el conjunto residencial',
  role: 'LITIGANTE',
  termStatus: 'NO_VERIFICADO',
  legalBasis: null,
  termDescription: null,
  sourceUrl: null,
  note: null,
  createdBy: 'abogada@firma.co',
  createdAt: '2026-09-08T12:00:00.000Z',
  ...over
});

// ─── 1. VALIDACIÓN ──────────────────────────────────────────────────────────

const ok = validarActuacionPropia(
  {
    area: 'CIVIL',
    exactName: 'Acuerdo de pago ante el conjunto residencial',
    createdBy: 'abogada@firma.co'
  },
  RAMAS,
  CIVIL,
  []
);

check('un nombre nuevo de una rama conocida se acepta', ok.ok);
check(
  'el id sale de la rama y del nombre',
  ok.ok && ok.value.id === 'civil/acuerdo-de-pago-ante-el-conjunto-residencial',
  ok.ok ? ok.value.id : ''
);
check('nace SIN término verificado', ok.ok && ok.value.termStatus === 'NO_VERIFICADO');

const ramaInventada = validarActuacionPropia(
  { area: 'MARITIMO', exactName: 'Demanda de avería gruesa', createdBy: 'a@b.co' },
  RAMAS,
  [],
  []
);
check(
  'una rama que no existe se rechaza',
  !ramaInventada.ok && ramaInventada.error.code === 'UNKNOWN_BRANCH'
);

const corto = validarActuacionPropia(
  { area: 'CIVIL', exactName: 'Sí', createdBy: 'a@b.co' },
  RAMAS,
  CIVIL,
  []
);
check('un nombre de menos de cuatro caracteres se rechaza', !corto.ok);

const largo = validarActuacionPropia(
  { area: 'CIVIL', exactName: 'x'.repeat(121), createdBy: 'a@b.co' },
  RAMAS,
  CIVIL,
  []
);
check('un nombre de más de ciento veinte caracteres se rechaza', !largo.ok);

/*
 * LA GARANTÍA QUE MÁS IMPORTA. Se prueba contra el catálogo REAL y con el
 * nombre escrito de otra forma —en minúsculas—, porque así es como llegaría de
 * verdad: nadie copia el nombre exacto de la ficha que no encontró.
 */
const publicada = CIVIL[0];
const sombra = validarActuacionPropia(
  { area: 'CIVIL', exactName: publicada.exactName.toLowerCase(), createdBy: 'a@b.co' },
  RAMAS,
  CIVIL,
  []
);
check(
  'no se deja crear una que tape a una publicada',
  !sombra.ok && sombra.error.code === 'SHADOWS_CATALOGUE' && sombra.error.status === 409,
  publicada.exactName
);
check(
  'y el rechazo dice cuál es la que ya existe, para poder elegirla',
  !sombra.ok && sombra.error.message.includes(publicada.exactName)
);

const repetida = validarActuacionPropia(
  {
    area: 'CIVIL',
    exactName: '  acuerdo   de PAGO ante el conjunto residencial ',
    createdBy: 'a@b.co'
  },
  RAMAS,
  CIVIL,
  [nueva()]
);
check(
  'no se repite el nombre en la misma rama, aunque cambien mayúsculas y espacios',
  !repetida.ok && repetida.error.code === 'DUPLICATE_NAME' && repetida.error.status === 409
);

const otraRama = validarActuacionPropia(
  {
    area: 'LABORAL',
    exactName: 'Acuerdo de pago ante el conjunto residencial',
    createdBy: 'a@b.co'
  },
  RAMAS,
  catalogService.list('LABORAL'),
  [nueva()]
);
check('el mismo nombre en OTRA rama sí se permite', otraRama.ok);

check(
  'el slug no colisiona con un id del catálogo publicado',
  catalogService.getById(
    slugDeActuacion('CIVIL', 'Acuerdo de pago ante el conjunto residencial')
  ) === null
);

// ─── 2. CÓMO SE PUBLICA ─────────────────────────────────────────────────────

const sinCurar = actuacionPropiaComoCatalogo(nueva());

check('se publica marcada como de la firma', sinCurar.firmDefined === true);
check(
  'sin curar, el término queda NO_VERIFICADO y sin texto',
  sinCurar.term.status === 'NO_VERIFICADO' && sinCurar.term.description === null
);
check(
  'sin curar, el fundamento dice que ninguna norma verificada la respalda',
  sinCurar.legalBasis === AVISO_SIN_NORMA
);
check('no se le inventan secciones obligatorias', sinCurar.requiredSections.length === 0);
check('sin curar, no lleva sello de verificación de la firma', sinCurar.verification === undefined);

/*
 * EL TÉRMINO SIN FUENTE NO ASCIENDE. Es el mismo CHECK que la base impone, y
 * se repite aquí porque una fila escrita por otra vía no puede publicar un
 * plazo que nadie puede contrastar.
 */
const conTerminoSinFuente = actuacionPropiaComoCatalogo(
  nueva({ termStatus: 'NO_VERIFICADO', termDescription: 'Diez días hábiles' })
);
check(
  'un término sin fuente no se publica como verificado',
  conTerminoSinFuente.term.status === 'NO_VERIFICADO' &&
    conTerminoSinFuente.term.description === null
);

const curada = actuacionPropiaComoCatalogo(
  nueva({
    termStatus: 'VERIFICADO',
    termDescription: 'Diez (10) días hábiles siguientes a la comunicación.',
    legalBasis: 'Ley 675 de 2001, art. 58',
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=4162'
  })
);
check('con término Y fuente, la firma la deja verificada', curada.term.status === 'VERIFICADO');
check('y queda atribuida a quien la escribió', curada.verification?.verifiedBy === 'abogada@firma.co');
check(
  'lo que reemplaza queda registrado como «no verificado», que es lo que había',
  curada.verification?.replaced.status === 'NO_VERIFICADO'
);

const noCaduca = actuacionPropiaComoCatalogo(
  nueva({
    termStatus: 'NO_CADUCA',
    termDescription: 'La norma no fija plazo.',
    sourceUrl: 'https://www.suin-juriscol.gov.co/'
  })
);
check('«no caduca» no se confunde con «verificado»', noCaduca.term.status === 'NO_CADUCA');

// ─── 3. LO QUE RECIBE EL MODELO ─────────────────────────────────────────────

const prompt = renderCatalogGuidance(sinCurar) ?? '';

check('hay bloque de instrucción para una actuación de la firma', prompt.length > 0);
check('el prompt DICE que no tiene ficha verificada', /NO TIENE FICHA VERIFICADA/.test(prompt));
check(
  'el prompt prohíbe inventar números de artículo',
  /PROHIBIDO INVENTAR/.test(prompt) && /números de artículo/i.test(prompt)
);
check(
  'el prompt prohíbe afirmar plazos y términos',
  /no afirmes plazos, términos ni caducidades/i.test(prompt)
);
check(
  'el prompt prohíbe enunciar secciones como exigidas por una norma',
  /secciones como si una norma las exigiera/i.test(prompt)
);
check(
  'el prompt ordena decirlo EN EL ESCRITO',
  /EN EL PROPIO ESCRITO/.test(prompt) && /no está verificado/i.test(prompt)
);
check(
  'el prompt NO abre diciendo que los datos fueron verificados contra la norma',
  !/fueron verificados contra el texto de la norma/.test(prompt)
);

/*
 * Y la ficha de fábrica no cambió: el bloque nuevo es una rama, no un
 * reemplazo. Si esto fallara, las 794 fichas verificadas habrían dejado de
 * entregarle su artículo al modelo.
 */
const promptPublicada = renderCatalogGuidance(publicada) ?? '';
check(
  'una ficha del catálogo sigue recibiendo su bloque verificado',
  /CATÁLOGO PROCESAL VERIFICADO/.test(promptPublicada) &&
    !/NO TIENE FICHA VERIFICADA/.test(promptPublicada)
);

const promptCurada = renderCatalogGuidance(curada) ?? '';
check(
  'curada por la firma, el prompt sigue diciendo que no hay ficha verificada',
  /NO TIENE FICHA VERIFICADA/.test(promptCurada)
);
check(
  'pero ya le entrega el término y el artículo que la firma comprobó',
  promptCurada.includes('Ley 675 de 2001, art. 58') && /aportado por la firma/.test(promptCurada)
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
