import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MAX_NOMBRE_DE_DOCUMENTO,
  nombreRepetidoEnCarpeta,
  rotuloDelPasaje,
  validarNombreDeDocumento
} from '../nombreDelDocumento';

/**
 * GUARDA DEL RENOMBRADO DE DOCUMENTOS.
 *
 * Run with: npm run check:renombrar-documento
 *
 * Pura: sin base, sin red. Vigila cuatro cosas que no se notan hasta que hacen
 * daño:
 *
 *   1. Las reglas del nombre (vacío, largo, separadores, caracteres de control).
 *   2. Que el nombre repetido se juzgue como en las carpetas: dentro del mismo
 *      sitio, sin distinguir mayúsculas ni espacios de los extremos.
 *   3. Que el servicio filtre por firma Y por expediente, responda 404 a lo
 *      ajeno, no toque la clave del almacenamiento y deje constancia.
 *   4. Que los pasajes que ven el abogado y el motor tomen el nombre de UNA
 *      sola fuente: `legal_documents.title`.
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

/* ─── 1. LAS REGLAS DEL NOMBRE ───────────────────────────────────────────── */

const bien = validarNombreDeDocumento('  Contestación de la demanda (v2).pdf  ');
check(
  'un nombre normal se acepta y llega sin espacios en los extremos',
  bien.ok && bien.nombre === 'Contestación de la demanda (v2).pdf'
);

const vacio = validarNombreDeDocumento('   ');
check('un nombre vacío se rechaza con MISSING_NOMBRE', !vacio.ok && vacio.code === 'MISSING_NOMBRE');

const noCadena = validarNombreDeDocumento(undefined);
check('un cuerpo sin nombre se rechaza con MISSING_NOMBRE', !noCadena.ok && noCadena.code === 'MISSING_NOMBRE');

check('el tope es de 160 caracteres', MAX_NOMBRE_DE_DOCUMENTO === 160);
const justo = validarNombreDeDocumento('a'.repeat(160));
const largo = validarNombreDeDocumento('a'.repeat(161));
check('160 caracteres se aceptan', justo.ok);
check('161 caracteres se rechazan con NOMBRE_LARGO', !largo.ok && largo.code === 'NOMBRE_LARGO');

const conBarra = validarNombreDeDocumento('pruebas/demanda');
const conContrabarra = validarNombreDeDocumento('pruebas' + String.fromCharCode(92) + 'demanda');
check('la barra se rechaza con NOMBRE_INVALIDO', !conBarra.ok && conBarra.code === 'NOMBRE_INVALIDO');
check('la contrabarra se rechaza con NOMBRE_INVALIDO', !conContrabarra.ok && conContrabarra.code === 'NOMBRE_INVALIDO');

for (const codigo of [0, 9, 10, 13, 27, 127]) {
  const r = validarNombreDeDocumento('Demanda' + String.fromCharCode(codigo) + 'final');
  check(`el carácter de control ${codigo} se rechaza`, !r.ok && r.code === 'NOMBRE_INVALIDO');
}

/* ─── 2. EL NOMBRE REPETIDO, CON LA REGLA DE LAS CARPETAS ────────────────── */

const docs = [
  { documentId: 'd1', titulo: 'Demanda', carpetaId: null },
  { documentId: 'd2', titulo: 'Poder', carpetaId: 'c1' },
  { documentId: 'd3', titulo: 'Auto admisorio', carpetaId: 'c1' }
];

check(
  'repetido en la raíz, sin distinguir mayúsculas ni espacios',
  nombreRepetidoEnCarpeta('  DEMANDA ', null, 'd9', docs)
);
check('el mismo nombre en OTRA carpeta no es repetido', !nombreRepetidoEnCarpeta('Demanda', 'c1', 'd9', docs));
check('repetido dentro de la misma carpeta', nombreRepetidoEnCarpeta('poder', 'c1', 'd3', docs));
check(
  'renombrarse a sí mismo (cambiar solo mayúsculas) no es repetido',
  !nombreRepetidoEnCarpeta('POder', 'c1', 'd2', docs)
);

/* ─── 3. EL NOMBRE DEL PASAJE SALE DE UNA SOLA FUENTE ────────────────────── */

const titulos = new Map([['d1', 'Demanda renombrada']]);
check('el pasaje lleva el título vigente', rotuloDelPasaje(titulos, 'd1', 'viejo.pdf') === 'Demanda renombrada');
check('sin título se cae al nombre del fragmento', rotuloDelPasaje(titulos, 'd2', 'sentencia.pdf') === 'sentencia.pdf');
check('sin nada, null (el render pone «documento del caso»)', rotuloDelPasaje(titulos, 'd2', null) === null);

/* ─── 4. EL SERVICIO, LA RUTA Y LOS LECTORES ─────────────────────────────── */

const servicio = cuerpoDe(sinComentarios(leer('modules/expedientes/candidatos.service.ts')), 'export const renombrarDocumento');
check('existe renombrarDocumento en candidatos.service', servicio.length > 0);
check('valida con la regla compartida', servicio.includes('validarNombreDeDocumento('));
check(
  'comprueba que el documento sea de ESE expediente (por sus fragmentos)',
  servicio.includes('documentosDelExpediente(firmId, expedienteId)')
);
check('lo ajeno es 404, no 403', servicio.includes("'DOC_NOT_FOUND'") && servicio.includes('404') && !servicio.includes('403'));
check('el repetido es 409 NOMBRE_REPETIDO', servicio.includes("'NOMBRE_REPETIDO'") && servicio.includes('409'));
check(
  'la escritura filtra por firma explícitamente (el service role salta RLS)',
  servicio.includes(".from('legal_documents')") && servicio.includes(".eq('firm_id', firmId)")
);
check('escribe en title, la fuente única', servicio.includes('title: '));
check('no toca la clave del almacenamiento', !servicio.includes('b2_file_url'));
check('no reescribe los fragmentos', !servicio.includes('document_embeddings'));

const controlador = sinComentarios(leer('modules/expedientes/expedientes.controller.ts'));
const renombrarCtl = cuerpoDe(controlador, 'export const renombrarDocumentoController');
check('existe el controlador', renombrarCtl.length > 0);
check('toma la firma del token', renombrarCtl.includes('req.firmId'));
check(
  'deja constancia en la auditoría',
  renombrarCtl.includes('auditService.record(') && renombrarCtl.includes("'EXPEDIENTE_DOCUMENT_RENAMED'")
);
check(
  'la acción está declarada en el tipo de auditoría',
  leer('modules/audit/audit.service.ts').includes("'EXPEDIENTE_DOCUMENT_RENAMED'")
);

const rutas = sinComentarios(leer('modules/expedientes/expedientes.routes.ts'));
const patchDoc = rutas.indexOf("'/expedientes/:id/documentos/:documentId',");
check('existe PATCH /expedientes/:id/documentos/:documentId', patchDoc !== -1 && rutas.lastIndexOf('router.patch(', patchDoc) > rutas.lastIndexOf('router.delete(', patchDoc));
check(
  'la ruta va detrás de bloquearSiPlanVencido',
  rutas.slice(patchDoc, rutas.indexOf(')', patchDoc)).includes('bloquearSiPlanVencido')
);

const material = sinComentarios(leer('modules/expedientes/materialDelExpediente.ts'));
check('el material del motor resuelve títulos', material.includes('titulosDeDocumentos(') && material.includes('rotuloDelPasaje('));
check('el material ya no nombra por el fragmento', !material.includes('archivo: m.fileName'));

const buscar = cuerpoDe(controlador, 'export const buscarEnExpedienteController');
check('la búsqueda del expediente resuelve títulos', buscar.includes('titulosDeDocumentos(') && buscar.includes('rotuloDelPasaje('));
check('la búsqueda ya no nombra por el fragmento', !buscar.includes('documento: m.fileName'));

const api = readFileSync(join(process.cwd(), '..', 'frontend', 'src', 'modules', 'expedientes', 'services', 'expedientes.api.ts'), 'utf8');
const cliente = cuerpoDe(api, 'async renombrarDocumento(');
check(
  'el frontend tiene el método cliente (un endpoint que existe no prueba que alguien lo llame)',
  api.includes('async renombrarDocumento(') &&
    api.includes('`/api/expedientes/${expedienteId}/documentos/${documentId}`') &&
    api.includes('httpClient.patch')
);
void cliente;

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
