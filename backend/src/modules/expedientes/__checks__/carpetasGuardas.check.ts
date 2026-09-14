import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validarNombreDeCarpeta, validarNombreDeDocumento } from '../nombreDelDocumento';

/**
 * GUARDAS DE LAS CARPETAS DEL EXPEDIENTE.
 *
 * Run with: npm run check:carpetas-guardas
 *
 * Pura: sin base, sin red. Vigila tres huecos que no se notan hasta que hacen
 * daño:
 *
 *   1. El nombre de la carpeta sigue EXACTAMENTE las reglas del nombre de un
 *      documento (vacío, 160 caracteres, barras, caracteres de control), con una
 *      sola regla compartida y no con una copia que se desincronice.
 *   2. Mover un documento o una carpeta comprueba el EXPEDIENTE de la ruta, no
 *      solo la firma: sin eso, un documento de otro caso de la misma firma se
 *      podía colgar de una carpeta de este caso.
 *   3. Crear, renombrar, mover y borrar una carpeta dejan constancia en la
 *      auditoría de la firma.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const RAIZ = join(process.cwd(), 'src');
const leer = (rel: string): string => readFileSync(join(RAIZ, rel), 'utf8');

/* El código sin comentarios: la documentación de un defecto no debe cazar a su guarda. */
const sinComentarios = (fuente: string): string =>
  fuente.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');

/** El cuerpo de una función exportada: desde su declaración hasta la siguiente exportación. */
const cuerpoDe = (fuente: string, declaracion: string): string => {
  const inicio = fuente.indexOf(declaracion);
  if (inicio === -1) return '';
  const fin = fuente.indexOf('export ', inicio + declaracion.length);
  return fuente.slice(inicio, fin === -1 ? undefined : fin);
};

/* ─── 1. EL NOMBRE DE LA CARPETA, CON LA REGLA DEL DOCUMENTO ─────────────── */

const bien = validarNombreDeCarpeta('  Pruebas del demandante  ');
check('un nombre normal se acepta y llega sin espacios en los extremos', bien.ok && bien.nombre === 'Pruebas del demandante');

const vacio = validarNombreDeCarpeta('   ');
check('un nombre vacío se rechaza con MISSING_NOMBRE', !vacio.ok && vacio.code === 'MISSING_NOMBRE');
const noCadena = validarNombreDeCarpeta(undefined);
check('un cuerpo sin nombre se rechaza con MISSING_NOMBRE', !noCadena.ok && noCadena.code === 'MISSING_NOMBRE');

check('160 caracteres se aceptan', validarNombreDeCarpeta('a'.repeat(160)).ok);
const largo = validarNombreDeCarpeta('a'.repeat(161));
check('161 caracteres se rechazan con NOMBRE_LARGO', !largo.ok && largo.code === 'NOMBRE_LARGO');
check(
  'se cuenta por puntos de código: 160 letras con tilde siguen cabiendo',
  validarNombreDeCarpeta('á'.repeat(160)).ok
);

const conBarra = validarNombreDeCarpeta('Pruebas/Testimonios');
const conContrabarra = validarNombreDeCarpeta('Pruebas' + String.fromCharCode(92) + 'Testimonios');
check('la barra se rechaza con NOMBRE_INVALIDO', !conBarra.ok && conBarra.code === 'NOMBRE_INVALIDO');
check('la contrabarra se rechaza con NOMBRE_INVALIDO', !conContrabarra.ok && conContrabarra.code === 'NOMBRE_INVALIDO');

for (const codigo of [0, 9, 10, 13, 27, 127]) {
  const r = validarNombreDeCarpeta('Pruebas' + String.fromCharCode(codigo) + 'finales');
  check(`el carácter de control ${codigo} se rechaza`, !r.ok && r.code === 'NOMBRE_INVALIDO');
}

/* La misma regla, no una copia: ante los mismos casos, los dos validadores dan el mismo veredicto. */
const casos = ['', '  x  ', 'a'.repeat(160), 'a'.repeat(161), 'a/b', 'a' + String.fromCharCode(92) + 'b', 'a\nb', 'Poder'];
check(
  'carpeta y documento dan el mismo veredicto y el mismo código en todos los casos',
  casos.every((c) => {
    const a = validarNombreDeCarpeta(c);
    const b = validarNombreDeDocumento(c);
    return a.ok === b.ok && (a.ok || b.ok || a.code === b.code);
  })
);

const nombres = sinComentarios(leer('modules/expedientes/nombreDelDocumento.ts'));
check(
  'la carpeta y el documento delegan en un único núcleo',
  (nombres.match(/validarNombreVisible\(/g) ?? []).length === 2 && nombres.includes('const validarNombreVisible = (')
);

/* ─── 2. EL SERVICIO DE CARPETAS ─────────────────────────────────────────── */

const servicio = sinComentarios(leer('modules/expedientes/carpetas.service.ts'));

const crear = cuerpoDe(servicio, 'export const crearCarpeta');
check('crearCarpeta valida con la regla compartida', crear.includes('validarNombreDeCarpeta('));

const moverC = cuerpoDe(servicio, 'export const moverCarpeta');
check('moverCarpeta valida el nombre con la regla compartida', moverC.includes('validarNombreDeCarpeta('));
check('el servicio ya no valida nombres a mano con trim()', !servicio.includes('.trim()'));
check(
  'moverCarpeta comprueba que la carpeta movida sea de ESE expediente antes de tocar nada',
  moverC.includes('carpetaDelExpediente(expedienteId, carpetaId)')
);
check(
  'moverCarpeta comprueba que el padre destino sea de ESE expediente',
  moverC.includes('carpetaDelExpediente(expedienteId, cambios.padreId)')
);
check(
  'la escritura de la carpeta filtra por expediente',
  moverC.includes(".from('expediente_carpetas')") && moverC.includes(".eq('expediente_id', expedienteId)")
);

const carpetaDelExp = servicio.slice(servicio.indexOf('const carpetaDelExpediente'), servicio.indexOf('export const crearCarpeta'));
check(
  'carpetaDelExpediente consulta por expediente y responde 404',
  carpetaDelExp.includes(".eq('expediente_id', expedienteId)") &&
    carpetaDelExp.includes("'CARPETA_NOT_FOUND'") &&
    carpetaDelExp.includes('404')
);

const moverD = cuerpoDe(servicio, 'export const moverDocumento');
check('existe moverDocumento', moverD.length > 0);
check(
  'moverDocumento comprueba que el documento sea de ESE expediente (por sus fragmentos)',
  moverD.includes('exigirDocumentoDelExpediente(firmId, expedienteId, documentId)')
);
/* La consulta vive en candidatos.service: las carpetas no tocan `document_embeddings` (lo exige check:expedientes). */
const docDelExp = cuerpoDe(
  sinComentarios(leer('modules/expedientes/candidatos.service.ts')),
  'export const exigirDocumentoDelExpediente'
);
check(
  'esa comprobación filtra fragmentos por firma, expediente y documento',
  docDelExp.includes(".from('document_embeddings')") &&
    docDelExp.includes(".eq('firm_id', firmId)") &&
    docDelExp.includes(".eq('expediente_id', expedienteId)") &&
    docDelExp.includes(".eq('document_id', documentId)")
);
check(
  'un documento de otro caso es 404, no 403',
  docDelExp.includes("'DOC_NOT_FOUND'") && docDelExp.includes('404') && !docDelExp.includes('403') && !servicio.includes('403')
);
check(
  'la comprobación del documento va ANTES de la escritura',
  moverD.indexOf('exigirDocumentoDelExpediente(') !== -1 &&
    moverD.indexOf('exigirDocumentoDelExpediente(') < moverD.indexOf('.update(')
);
check('moverDocumento comprueba que la carpeta destino sea de ESE expediente', moverD.includes('carpetaDelExpediente(expedienteId, carpetaId)'));
check('la escritura del documento sigue filtrando por firma (service role)', moverD.includes(".eq('firm_id', firmId)"));

/* ─── 3. LA AUDITORÍA DE LAS CUATRO ACCIONES ─────────────────────────────── */

const auditoria = leer('modules/audit/audit.service.ts');
const controlador = sinComentarios(leer('modules/expedientes/expedientes.controller.ts'));

const acciones: Array<[string, string]> = [
  ['EXPEDIENTE_CARPETA_CREATED', 'export const crearCarpetaController'],
  ['EXPEDIENTE_CARPETA_RENAMED', 'export const moverCarpetaController'],
  ['EXPEDIENTE_CARPETA_MOVED', 'export const moverCarpetaController'],
  ['EXPEDIENTE_CARPETA_DELETED', 'export const borrarCarpetaController']
];
for (const [accion, declaracion] of acciones) {
  check(`${accion} está declarada en el tipo de auditoría`, auditoria.includes(`'${accion}'`));
  const cuerpo = cuerpoDe(controlador, declaracion);
  check(
    `${accion} se registra desde su controlador`,
    cuerpo.includes('auditService.record(') && cuerpo.includes(`'${accion}'`)
  );
}

const moverCtl = cuerpoDe(controlador, 'export const moverCarpetaController');
check('el renombrado y el traslado anotan de dónde a dónde', moverCtl.includes('→'));
const borrarCtl = cuerpoDe(controlador, 'export const borrarCarpetaController');
check(
  'el borrado anota lo que se llevó por delante',
  borrarCtl.includes('subcarpetas') && borrarCtl.includes('documentos')
);
check(
  'la auditoría se escribe DESPUÉS de que la acción tuvo éxito',
  borrarCtl.indexOf('borrarCarpeta(') !== -1 && borrarCtl.indexOf('borrarCarpeta(') < borrarCtl.indexOf('auditService.record(')
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
