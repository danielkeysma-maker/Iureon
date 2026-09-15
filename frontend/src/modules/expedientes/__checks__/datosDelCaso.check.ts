/**
 * Guarda la edición de los datos del caso: nombre, radicado, despacho, rama,
 * contraparte y notas.
 *
 * Run with: npm run check:datos-del-caso
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. BORRAR LO QUE NADIE TOCÓ. El servidor lee `null` como «bórrelo» y
 *    `undefined` como «no lo toque». Un formulario que manda los seis campos
 *    borra el radicado de quien solo corrigió una tilde del nombre si el campo
 *    llegó vacío por un estado intermedio. Por eso viaja SOLO lo que cambió.
 *
 * 2. UN CASO SIN NOMBRE. El servidor lo rechaza; la pantalla lo dice antes y
 *    con las mismas palabras, para que el abogado no lea dos mensajes
 *    distintos para la misma regla.
 *
 * 3. UNA RAMA ESCRITA A MANO QUE DESAPARECE. Casos viejos guardan «Restitución
 *    de tierras» como texto. Si el selector solo ofreciera códigos del
 *    catálogo, abrir el diálogo y guardar otra cosa la borraría sin que nadie
 *    la hubiera elegido.
 *
 * 4. UN AVISO DEL RADICADO QUE BLOQUEA. Hay radicados legítimos que no son de
 *    23 dígitos (una tutela «T-1234», un número interno). El aviso orienta y
 *    nunca impide guardar.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AVISO_DEL_RADICADO,
  SIN_NOMBRE,
  aplicarGuardado,
  avisoDelRadicado,
  cambiosDelCaso,
  datosDelCaso,
  errorDelCaso,
  hayCambios,
  leerRama,
  opcionesDeCliente,
  opcionesDeRamaParaEditar
} from '../services/datosDelCaso';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import type { Expediente, ExpedienteEnLista } from '../types';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const caso = (o: Partial<Expediente> = {}): Expediente => ({
  id: 'e1',
  caratula: 'Cliente 00 contra Entidad 00',
  radicado: '00000-00-00-000-0000-00000-00',
  despacho: 'Juzgado 00 Civil Municipal',
  rama: 'CIVIL',
  clienteId: 'cli-1',
  clienteNombre: 'Cliente 00',
  contraparte: 'Entidad 00',
  estado: 'ACTIVO',
  notas: 'Nota 00',
  createdBy: 'u',
  createdAt: '',
  updatedAt: '',
  ...o
});

/* ─── 1. SE PRELLENA CON LO GUARDADO ─────────────────────────────────────── */
const inicial = datosDelCaso(caso());
check('prellena la carátula', inicial.caratula === 'Cliente 00 contra Entidad 00');
check('prellena el radicado tal como se guardó', inicial.radicado === '00000-00-00-000-0000-00000-00');
const vacio = datosDelCaso(caso({ radicado: null, despacho: null, rama: null, contraparte: null, notas: null }));
check('lo que no existe se prellena vacío, no con «null»', Object.values(vacio).slice(1).every((v) => v === ''), JSON.stringify(vacio));
check('una rama en blanco se prellena como «sin rama»', datosDelCaso(caso({ rama: '   ' })).rama === '');

/* ─── 2. SOLO VIAJA LO QUE CAMBIÓ ────────────────────────────────────────── */
check('sin cambios no viaja nada', Object.keys(cambiosDelCaso(inicial, { ...inicial })).length === 0);
check('sin cambios, no hay cambios', !hayCambios(inicial, { ...inicial }));
const soloRama = cambiosDelCaso(inicial, { ...inicial, rama: 'LABORAL' });
check('cambiar la rama manda solo la rama', JSON.stringify(soloRama) === JSON.stringify({ rama: 'LABORAL' }), JSON.stringify(soloRama));
check('y nunca manda los campos que no se tocaron', !('radicado' in soloRama) && !('notas' in soloRama) && !('caratula' in soloRama));
const vaciarRadicado = cambiosDelCaso(inicial, { ...inicial, radicado: '   ' });
check('vaciar el radicado a propósito manda null (bórrelo)', vaciarRadicado.radicado === null && Object.keys(vaciarRadicado).length === 1);
check('espacios alrededor no cuentan como cambio', Object.keys(cambiosDelCaso(inicial, { ...inicial, despacho: '  Juzgado 00 Civil Municipal ' })).length === 0);
const conEspacios = cambiosDelCaso(inicial, { ...inicial, contraparte: '  Entidad 01 ' });
check('lo que sí cambió viaja sin los espacios de los bordes', conEspacios.contraparte === 'Entidad 01', String(conEspacios.contraparte));
check('agregar un radicado a un caso sin él lo manda', cambiosDelCaso(vacio, { ...vacio, radicado: '11001' }).radicado === '11001');
check('quitar la rama manda null', cambiosDelCaso(inicial, { ...inicial, rama: '' }).rama === null);

/* ─── 3. EL NOMBRE ES OBLIGATORIO, CON LAS PALABRAS DEL SERVIDOR ─────────── */
check('el mensaje es el mismo del servidor', SIN_NOMBRE === 'El expediente no se puede quedar sin nombre.');
check('una carátula vacía se bloquea', errorDelCaso({ ...inicial, caratula: '' }) === SIN_NOMBRE);
check('una carátula de solo espacios también', errorDelCaso({ ...inicial, caratula: '   ' }) === SIN_NOMBRE);
check('con nombre no hay error', errorDelCaso(inicial) === null);
const servidor = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'backend', 'src', 'modules', 'expedientes', 'expedientes.service.ts'),
  'utf8'
);
check('y el servidor sigue diciendo exactamente eso', servidor.includes(`'${SIN_NOMBRE}'`));

/* ─── 4. EL AVISO DEL RADICADO ORIENTA Y NO BLOQUEA ─────────────────────── */
check('23 dígitos con guiones no avisan', avisoDelRadicado('00000-00-00-000-0000-00000-00') === null);
check('23 dígitos con espacios no avisan', avisoDelRadicado('00000 00 00 000 0000 00000 00') === null);
check('23 dígitos seguidos no avisan', avisoDelRadicado('00000000000000000000000') === null);
check('22 dígitos avisan', avisoDelRadicado('0000000000000000000000') === AVISO_DEL_RADICADO);
check('24 dígitos avisan', avisoDelRadicado('000000000000000000000000') === AVISO_DEL_RADICADO);
check('un radicado vacío no avisa: es opcional', avisoDelRadicado('   ') === null);
check('el aviso dice lo que pide la regla', AVISO_DEL_RADICADO === 'Un radicado de la Rama Judicial tiene 23 dígitos; revise si falta alguno.');
check('el aviso no es error: con 22 dígitos se puede guardar', errorDelCaso({ ...inicial, radicado: '0000000000000000000000' }) === null);

/* ─── 5. RAMA DEL CATÁLOGO O ESCRITA A MANO ──────────────────────────────── */
const deCatalogo = leerRama('LABORAL');
check('un código conocido es del catálogo', deCatalogo.tipo === 'catalogo' && deCatalogo.etiqueta === BRANCH_LABELS.LABORAL);
const aMano = leerRama('Restitución de tierras');
check('un texto que no es código es «a mano»', aMano.tipo === 'manual' && aMano.texto === 'Restitución de tierras');
check('«constructor» no se toma por código', leerRama('constructor').tipo === 'manual');
check('nula o en blanco es «ninguna»', leerRama(null).tipo === 'ninguna' && leerRama('  ').tipo === 'ninguna');

const opcionesCatalogo = opcionesDeRamaParaEditar('LABORAL');
check('la primera opción es «Sin rama»', opcionesCatalogo[0].valor === '' && opcionesCatalogo[0].etiqueta === 'Sin rama');
check('ofrece todas las ramas del catálogo', Object.keys(BRANCH_LABELS).every((k) => opcionesCatalogo.some((o) => o.valor === k)));
check('con su nombre del catálogo', opcionesCatalogo.find((o) => o.valor === 'CIVIL')?.etiqueta === BRANCH_LABELS.CIVIL);
check('sin rama a mano no hay opción «registrada a mano»', !opcionesCatalogo.some((o) => o.etiqueta.includes('(registrada a mano)')));
const opcionesManual = opcionesDeRamaParaEditar('Restitución de tierras');
const legado = opcionesManual.find((o) => o.valor === 'Restitución de tierras');
check('la rama a mano sigue visible como opción', legado?.etiqueta === 'Restitución de tierras (registrada a mano)', legado?.etiqueta);
check('y se puede reemplazar por una del catálogo', opcionesManual.some((o) => o.valor === 'LABORAL'));
check('dejarla elegida no manda ningún cambio', Object.keys(cambiosDelCaso(datosDelCaso(caso({ rama: 'Restitución de tierras' })), datosDelCaso(caso({ rama: 'Restitución de tierras' })))).length === 0);
check('ninguna opción se repite', new Set(opcionesManual.map((o) => o.valor)).size === opcionesManual.length);

/* ─── 6. LO GUARDADO SE APLICA SIN TOCAR LO QUE CUENTA EL SERVIDOR ───────── */
const enLista: ExpedienteEnLista = {
  ...caso(),
  terminosLeidos: true,
  proximoTermino: null,
  terminoVencido: null,
  terminosPendientes: 3,
  documentos: 7,
  personas: null
};
const devuelto = caso({ rama: 'LABORAL', radicado: '11001', clienteNombre: null, updatedAt: '2030' });
const aplicado = aplicarGuardado(enLista, devuelto);
check('se aplica la rama nueva', aplicado.rama === 'LABORAL' && aplicado.radicado === '11001');
check('las cuentas del servidor no se pierden', aplicado.documentos === 7 && aplicado.terminosPendientes === 3 && aplicado.terminosLeidos === true);
check('el nombre del cliente no se borra si la respuesta no lo trae', aplicado.clienteNombre === 'Cliente 00');
check('no muta el original', enLista.rama === 'CIVIL');

/* ─── 6b. EL CLIENTE SE BUSCA POR NOMBRE O POR CÉDULA, CON O SIN PUNTOS ──── */
/*
 * El dueño vio en producción la lista azul del sistema con «— sin cliente —».
 * La lista nueva filtra por el nombre y por el documento; el filtro compartido
 * compara texto, así que la búsqueda de cada fila lleva el documento en los
 * dígitos, agrupado con puntos y tal como se guardó.
 */
const CLIENTES = [
  { id: 'c1', fullName: 'Cliente Uno 00', documentId: '92522595' },
  { id: 'c2', fullName: 'Cliente Dos 00', documentId: '1.102.811.692' },
  { id: 'c3', fullName: 'Entidad 00', documentId: '900123456-7' }
];
const opcionesCliente = opcionesDeCliente(CLIENTES);
/* Espejo del filtro de `SelectorEnCascada`: nombre o búsqueda, en minúsculas. */
const filtrar = (q: string) =>
  opcionesCliente
    .filter((o) => o.etiqueta.toLowerCase().includes(q.trim().toLowerCase()) || Boolean(o.busqueda?.toLowerCase().includes(q.trim().toLowerCase())))
    .map((o) => o.valor)
    .join(',');
check('la primera opción es «Sin cliente»', opcionesCliente[0].valor === '' && opcionesCliente[0].etiqueta === 'Sin cliente');
check('cada cliente lleva su documento tal como se guardó', opcionesCliente.find((o) => o.valor === 'c2')?.documento === '1.102.811.692');
check('se encuentra por nombre', filtrar('uno') === 'c1', filtrar('uno'));
check('por cédula escrita con puntos aunque se guardó sin ellos', filtrar('92.522.595') === 'c1', filtrar('92.522.595'));
check('por cédula sin puntos aunque se guardó con ellos', filtrar('1102811692') === 'c2', filtrar('1102811692'));
check('por NIT con dígito de verificación', filtrar('900123456-7') === 'c3', filtrar('900123456-7'));
check('«Sin cliente» no aparece al buscar un documento', !filtrar('92522595').split(',').includes(''));

/* ─── 7. LA PANTALLA, LEÍDA COMO TEXTO ───────────────────────────────────── */
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const leer = (ruta: string): string => sinComentarios(readFileSync(join(SRC, ruta), 'utf8'));
const DIALOGO = leer('modules/expedientes/components/EditarDatosDelCaso.tsx');
const VISTA = leer('modules/expedientes/components/ExpedientesView.tsx');

check('el diálogo manda solo los cambios', DIALOGO.includes('cambiosDelCaso(inicial, datos)') && DIALOGO.includes('expedientesApi.actualizar(expediente.id, cambios)'));
check('el diálogo usa el marco compartido', DIALOGO.includes('<Dialog'));
check('bloquea el nombre vacío antes de llamar', DIALOGO.indexOf('errorDelCaso(datos)') !== -1 && DIALOGO.indexOf('errorDelCaso(datos)') < DIALOGO.indexOf('expedientesApi.actualizar('));
check('pinta el aviso del radicado', DIALOGO.includes('avisoDelRadicado(datos.radicado)'));
check('el radicado va en mono', /id="editar-caso-radicado"[^>]*cn-exp-mono|cn-exp-mono[^"]*"[^>]*id="editar-caso-radicado"/.test(DIALOGO));
check('la rama usa el selector del formulario', DIALOGO.includes('<SelectorDelFormulario') && DIALOGO.includes('opcionesDeRamaParaEditar('));
check('el error del servidor se queda dentro del diálogo', DIALOGO.includes('setError((err as Error).message)'));
check('cancelar con cambios pregunta', DIALOGO.includes('hayCambiosSinGuardar={cambiado}') && DIALOGO.includes('Descartar los cambios'));
check('no pregunta con el diálogo del navegador', !/\bconfirm\(/.test(DIALOGO));
check('el diálogo abre en el campo pedido', DIALOGO.includes('data-campo='));
const menuEditar = VISTA.indexOf('Editar datos del caso');
check('«Editar datos del caso» es la primera opción de «Más opciones»', menuEditar !== -1 && menuEditar < VISTA.indexOf('Traer algo de otro módulo'));
check('hay un botón «Editar» junto al título', VISTA.includes('cn-exp-editar'));
check('la columna derecha ofrece agregar la rama y el radicado que faltan', VISTA.includes("abrirEdicion('rama')") && VISTA.includes("abrirEdicion('radicado')"));
check('con el plan vencido no se ofrece editar', VISTA.includes('usePlanSoloLectura()') && /!soloLectura && \(/.test(VISTA));
check('lo guardado se aplica al caso abierto y a la lista', VISTA.includes('aplicarGuardado(') && /setMisCasos\(/.test(VISTA));
const CLIENTE = leer('modules/expedientes/components/ClienteDelExpediente.tsx');
check('el cliente se elige con el selector del formulario', CLIENTE.includes('<SelectorDelFormulario') && CLIENTE.includes('opcionesDeCliente('));
check('y se sigue guardando por la misma ruta', CLIENTE.includes('expedientesApi.actualizar(expediente.id, { clienteId })'));
check('el documento va en mono como detalle', CLIENTE.includes('cn-exp-mono'));
check('se conserva «Cerrar»', CLIENTE.includes("'Cerrar'"));
const chico = DIALOGO.match(/text-\[(?:\d|1[0-3])(?:\.\d+)?px\]|\btext-(?:meta|label|ui)\b|\bbtn-sm\b/);
check('nada por debajo de 14 px en el diálogo', !chico, chico?.[0] ?? '');

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
