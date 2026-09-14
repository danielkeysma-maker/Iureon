/**
 * Guarda la cara nueva de Expedientes —«Mis casos», el caso en tres zonas, las
 * carpetas, el lector y el archivo sin texto— contra lo que las maquetas
 * prometen y el producto no hace, y contra lo que la piel no puede tumbar.
 *
 * Run with: npm run check:expedientes-cara
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. «NO SÉ» PINTADO COMO «CERO». El servidor manda `documentos: null` cuando
 *    no pudo contar y `estaSemana: null` cuando no leyó la agenda. Un `?? 0` o
 *    una pestaña vacía convierten esa ignorancia en una afirmación: «este caso
 *    no tiene documentos», «nada vence esta semana». Las dos son las mentiras
 *    más caras de esta pantalla.
 *
 * 2. EL BORRADO QUE DECÍA «VACÍA» PORQUE LA CUENTA FALLÓ. El diálogo de borrar
 *    una carpeta empezaba con `{ subcarpetas: 0, documentos: 0 }` y, si la
 *    consulta del contenido fallaba, se quedaba con esos ceros y decía «Esta
 *    carpeta está vacía» — sobre una carpeta cuyo borrado se lleva en cascada
 *    documentos indexados y sus archivos guardados.
 *
 * 3. LO QUE LAS MAQUETAS DIBUJAN Y NO EXISTE: la línea de tiempo «Qué ha
 *    pasado» (no hay registro por caso), «Citar en un escrito / la página 3»
 *    (la búsqueda no conoce páginas), «Dejarlo así» para un escaneado (hoy se
 *    rechaza antes de guardarse), y el «no se borra, puede volver a traerlo»
 *    del diálogo de quitar (quitar BORRA el documento y su archivo).
 *
 * Se leen los componentes como TEXTO y sin comentarios: los comentarios que
 * explican por qué no se pinta algo contienen la palabra.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  avisoDelTermino,
  cuentaDePestana,
  destinosDeCarpeta,
  destinosDeDocumento,
  documentosEnPalabras,
  enPalabrasElResumen,
  esUrgente,
  lineaDeEstaSemana,
  plazoEnPalabras,
  relevanciaEnPalabras,
  resumenDeCarpeta,
  textoDelBorrado
} from '../services/casoEnPantalla';
import type { Carpeta, DocumentoIndexado } from '../services/expedientes.api';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* ─── 1. EL PLAZO EN PALABRAS ────────────────────────────────────────────── */
check('0 días es «hoy»', plazoEnPalabras(0) === 'hoy', plazoEnPalabras(0));
check('1 día es «mañana»', plazoEnPalabras(1) === 'mañana', plazoEnPalabras(1));
check('3 días es «en 3 días»', plazoEnPalabras(3) === 'en 3 días', plazoEnPalabras(3));
check('-1 es «vencido hace 1 día», en singular', plazoEnPalabras(-1) === 'vencido hace 1 día', plazoEnPalabras(-1));
check('-4 es «vencido hace 4 días»', plazoEnPalabras(-4) === 'vencido hace 4 días', plazoEnPalabras(-4));

check('3 días es urgente', esUrgente({ diasRestantes: 3, vencido: false }));
check('4 días no es urgente', !esUrgente({ diasRestantes: 4, vencido: false }));
check('lo vencido siempre es urgente', esUrgente({ diasRestantes: -10, vencido: true }));

const termino = (dias: number, verificado = true) => ({
  agendaId: 'a',
  vence: '0000-00-00',
  diasRestantes: dias,
  que: 'la actuación 00',
  verificado,
  vencido: dias < 0
});
const aviso1 = avisoDelTermino({ proximoTermino: termino(3), terminoVencido: null });
check('el aviso del próximo dice cuántos días quedan', aviso1?.titulo === 'Quedan 3 días para la actuación 00', aviso1?.titulo);
const aviso2 = avisoDelTermino({ proximoTermino: termino(8), terminoVencido: termino(-2) });
check('lo vencido manda sobre lo próximo', aviso2?.titulo === 'Venció hace 2 días: la actuación 00', aviso2?.titulo);
check('y lo próximo queda como segunda línea', aviso2?.detalle === 'Después: en 8 días · la actuación 00', aviso2?.detalle ?? '');
check('hoy no dice «quedan 0 días»', avisoDelTermino({ proximoTermino: termino(0), terminoVencido: null })?.titulo === 'Vence hoy: la actuación 00');
check(
  'un término sin verificar viaja como tal',
  avisoDelTermino({ proximoTermino: termino(2, false), terminoVencido: null })?.verificado === false
);
check('sin términos no hay aviso', avisoDelTermino({ proximoTermino: null, terminoVencido: null }) === null);
check('un servidor sin el campo tampoco inventa aviso', avisoDelTermino({}) === null);

/* ─── 2. «NO SÉ» NO ES «CERO» ────────────────────────────────────────────── */
check('documentos null no se pinta', documentosEnPalabras(null) === null);
check('documentos undefined no se pinta', documentosEnPalabras(undefined) === null);
check('0 documentos sí se dice, porque se contó', documentosEnPalabras(0) === '0 documentos');
check('1 documento en singular', documentosEnPalabras(1) === '1 documento');
check('la pestaña sin agenda leída no lleva número', cuentaDePestana(null) === null);
check('la pestaña leída y vacía dice 0', cuentaDePestana([]) === '0');
check(
  'sin agenda leída, la línea de la lista es el aviso del servidor y no «nada vence»',
  lineaDeEstaSemana(null, 'No se pudo leer la agenda.') === 'No se pudo leer la agenda.'
);
check('una semana leída y vacía lo dice', lineaDeEstaSemana([], null) === 'Nada vence esta semana.');
check('uno pide atención', lineaDeEstaSemana(['x'], null) === '1 caso vence esta semana o ya venció.');
check('varios piden atención', lineaDeEstaSemana(['x', 'y'], null) === '2 casos vencen esta semana o ya vencieron.');

/* ─── 3. EL BORRADO QUE NO SE PUDO CONTAR ─────────────────────────────────── */
const sinContar = textoDelBorrado({ estado: 'sin-contar' });
check('si la cuenta falló, NO se dice vacía', sinContar.vacia === false);
check('y se exige escribir el nombre', sinContar.exigeNombre === true);
check('y no se promete ningún número', sinContar.partes.length === 0);
const vacia = textoDelBorrado({ estado: 'contado', subcarpetas: 0, documentos: 0 });
check('contada y vacía sí es vacía, sin teclear', vacia.vacia && !vacia.exigeNombre);
const llena = textoDelBorrado({ estado: 'contado', subcarpetas: 2, documentos: 6 });
check(
  'contada y llena dice cuánto se va y exige el nombre',
  llena.partes.join(' y ') === '2 subcarpeta(s) y 6 documento(s) indexado(s)' && llena.exigeNombre,
  llena.partes.join(' y ')
);

/* ─── 4. MOVER SIN CICLOS, TAMBIÉN EN LA PANTALLA ─────────────────────────── */
const c = (id: string, padreId: string | null, nombre: string): Carpeta => ({
  id,
  expedienteId: 'e',
  padreId,
  nombre,
  createdAt: ''
});
const ARBOL = [c('p', null, 'Pruebas'), c('d', 'p', 'Documentales'), c('t', 'd', 'Anexos'), c('a', null, 'Actuaciones')];
const deP = destinosDeCarpeta(ARBOL, 'p');
const motivo = (lista: ReturnType<typeof destinosDeCarpeta>, id: string | null) => lista.find((x) => x.id === id)?.motivo;
check('una carpeta no se mueve dentro de sí misma', motivo(deP, 'p') === 'es-ella');
check('ni dentro de su hija', motivo(deP, 'd') === 'dentro-de-ella');
check('ni dentro de su nieta', motivo(deP, 't') === 'dentro-de-ella');
check('la raíz no se ofrece si ya está en la raíz', motivo(deP, null) === 'ya-esta-aqui');
check('una hermana sí es destino', motivo(deP, 'a') === null);
check('la ruta se escribe completa', destinosDeCarpeta(ARBOL, 'a').find((x) => x.id === 't')?.ruta === 'Pruebas › Documentales › Anexos');
const conCiclo = [c('x', 'y', 'X'), c('y', 'x', 'Y')];
check('un ciclo que ya exista en la base no cuelga la pantalla', destinosDeCarpeta(conCiclo, 'x').length === 3);
const deDoc = destinosDeDocumento(ARBOL, 'd');
check('un documento no se «mueve» a donde ya está', motivo(deDoc, 'd') === 'ya-esta-aqui' && motivo(deDoc, null) === null);

/* ─── 5. LO QUE HAY EN CADA CARPETA, CONTADO CON LO YA CARGADO ────────────── */
const doc = (documentId: string, carpetaId: string | null): DocumentoIndexado => ({
  documentId,
  titulo: documentId,
  fragmentos: 1,
  indexadoEl: '',
  carpetaId
});
const DOCS = [doc('1', 'p'), doc('2', 'p'), doc('3', 'd'), doc('4', null)];
const rp = resumenDeCarpeta('p', ARBOL, DOCS);
check('cuenta los documentos y subcarpetas directas', rp.documentos === 2 && rp.subcarpetas === 1, JSON.stringify(rp));
check('en palabras', enPalabrasElResumen(rp) === '2 documentos · 1 subcarpeta', enPalabrasElResumen(rp));
check('vacía se dice', enPalabrasElResumen({ documentos: 0, subcarpetas: 0 }) === 'Vacía');

/* ─── 6. LA SIMILITUD SE DICE CON PALABRAS ───────────────────────────────── */
check('similitud alta', relevanciaEnPalabras(0.8) === 'Muy relacionado');
check('similitud media', relevanciaEnPalabras(0.65) === 'Relacionado');
check('similitud baja', relevanciaEnPalabras(0.4) === 'Algo relacionado');
check('nunca un porcentaje', !/%/.test([0.1, 0.5, 0.9].map(relevanciaEnPalabras).join('')));

/* ─── 7. LAS PANTALLAS, LEÍDAS COMO TEXTO ────────────────────────────────── */
const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const crudo = (ruta: string): string => readFileSync(join(SRC, ruta), 'utf8');
const leer = (ruta: string): string => sinComentarios(crudo(ruta));

const COMP = 'modules/expedientes/components/';
const VISTA = leer(`${COMP}ExpedientesView.tsx`);
const CARPETAS = leer(`${COMP}CarpetasDelExpediente.tsx`);
const INDEXAR = leer(`${COMP}IndexarEnExpediente.tsx`);
const LECTOR = leer(`${COMP}LeerDocumentoIndexado.tsx`);
const BUSCAR = leer(`${COMP}BuscarEnExpediente.tsx`);
const API = leer('modules/expedientes/services/expedientes.api.ts');
const APP = leer('App.tsx');

/* Las cinco pantallas que se rehicieron enteras con la cara nueva. */
const REHECHAS: Record<string, string> = {
  'ExpedientesView.tsx': VISTA,
  'CarpetasDelExpediente.tsx': CARPETAS,
  'IndexarEnExpediente.tsx': INDEXAR,
  'LeerDocumentoIndexado.tsx': LECTOR,
  'BuscarEnExpediente.tsx': BUSCAR
};
/* Todo el módulo, incluidos los paneles que conservan su interior. */
const MODULO: Record<string, string> = {
  ...REHECHAS,
  'ActoresDelExpediente.tsx': leer(`${COMP}ActoresDelExpediente.tsx`),
  'ClienteDelExpediente.tsx': leer(`${COMP}ClienteDelExpediente.tsx`),
  'TraerAlExpediente.tsx': leer(`${COMP}TraerAlExpediente.tsx`),
  'PreguntasDelExpedientePanel.tsx': leer(`${COMP}PreguntasDelExpedientePanel.tsx`)
};

const raices = VISTA.match(/data-visita="vista-expedientes"\s+className="cara-nueva cn-exp[^"]*"/g) ?? [];
check('las DOS ramas (lista y caso) llevan la visita guiada y la cara nueva en su raíz', raices.length === 2, `${raices.length}`);

check('la lista sale de «Mis casos» y no de la lista plana', VISTA.includes('expedientesApi.listarMisCasos()') && !/expedientesApi\.listar\(\)/.test(VISTA));
check('las pestañas se cuentan con lo que manda el servidor', VISTA.includes('cuentaDePestana(misCasos.pestanas[id])'));
check('sin agenda leída, «Esta semana» dice el aviso y no se pinta vacía', VISTA.includes("misCasos.pestanas.estaSemana === null"));
check('los documentos de una tarjeta pasan por el ayudante que calla ante null', VISTA.includes('documentosEnPalabras(caso.documentos)'));
check('ninguna cuenta del caso cae a cero por falta de dato', !/(documentos|actores|terminosPendientes)\s*\?\?\s*0/.test(VISTA));
check('el plazo de la lista y el aviso del caso usan el ayudante', VISTA.includes('plazoEnPalabras(t.diasRestantes)') && VISTA.includes('avisoDelTermino(abierto)'));
check('el término sin verificar se marca, no se afirma', VISTA.includes('cn-exp-plazo--sin-verificar') && VISTA.includes('cn-exp-termino--sin-verificar'));
check('el aviso abre la agenda por un camino real', VISTA.includes('onClick={onIrAAgenda}') && /<ExpedientesView\s+onIrAAgenda=/.test(APP));
check('el caso abre por «Documentos»', VISTA.includes("React.useState<VistaDelCaso>('documentos')"));

/* ─── 8. EL BORRADO QUE NO SE PUDO CONTAR, EN LA PANTALLA ────────────────── */
check('ya no hay una cuenta que empiece en ceros', !/\{\s*subcarpetas:\s*0,\s*documentos:\s*0\s*\}/.test(CARPETAS));
check('un fallo del conteo es el estado «sin contar»', CARPETAS.includes("contenido = { estado: 'sin-contar' }"));
check('y el diálogo lo dice con palabras', CARPETAS.includes('No se pudo contar lo que tiene dentro.'));
check('y el botón no responde hasta que se escriba el nombre', CARPETAS.includes('deshabilitado: !contenido || (texto?.exigeNombre === true && !nombreBien)'));
check('mover una carpeta ofrece destinos sin ciclos', CARPETAS.includes('destinosDeCarpeta(carpetas, dialogo.carpeta.id)') && CARPETAS.includes('disabled={d.motivo !== null}'));
check('renombrar y mover usan la ruta PATCH que ya existía', API.includes('async renombrarCarpeta(') && API.includes('async moverCarpeta('));

/* ─── 9. QUITAR PREGUNTA, Y DICE LO QUE EL SERVIDOR HACE ─────────────────── */
check('quitar un documento pasa por un diálogo de confirmación', /onConfirmar:[\s\S]{0,120}quitarDocumento\(/.test(CARPETAS));
check('y ya no hay un «quitar» de un clic en el panel de indexar', !INDEXAR.includes('quitarDocumento'));
check('el diálogo no promete que el documento se conserva', !/no se borra|volver a traerlo/.test(CARPETAS + LECTOR));

/* ─── 10. LO QUE LAS MAQUETAS DIBUJAN Y NO EXISTE ────────────────────────── */
for (const [nombre, codigo] of Object.entries(MODULO)) {
  check(`${nombre} no ofrece «Dejarlo así»`, !/Dejarlo así/.test(codigo));
  check(`${nombre} no ofrece citar`, !/Citar/.test(codigo));
  check(`${nombre} no pinta «Qué ha pasado»`, !/Qué ha pasado/.test(codigo));
  check(`${nombre} no pinta «Lo que Iureon leyó»`, !/Lo que Iureon leyó/.test(codigo));
  check(`${nombre} no trae un porcentaje de similitud`, !/similitud\s*\*\s*100/.test(codigo));
  check(`${nombre} no trae un nombre verosímil de ejemplo`, !/Mosquera|ACME/.test(codigo), 'README-app §3');
  check(`${nombre} no trae un despacho verosímil`, !/Juzgado\s+(?!00\b)\d+/.test(codigo), 'README-app §3');
  check(`${nombre} no trae un radicado verosímil`, !/\b(?!0+\b)\d{15,}\b/.test(codigo), 'README-app §3');
}
check('el escaneado tiene su pantalla, marcada por el lector y no por el texto del motivo', INDEXAR.includes('if (r.sinTexto) setSinTexto(elegido.name)'));
check('y ofrece las dos salidas reales', INDEXAR.includes('Pedir el original con texto') && INDEXAR.includes('Reemplazar el archivo'));
check('la ayuda ya no dice que el archivo no se envía', !/el archivo no se envía/.test(INDEXAR));
check('el lector sigue sobre el visor compartido', LECTOR.includes('<VisorDeArchivo'));
check('la búsqueda distingue «no se pudo» de «no hay»', BUSCAR.includes("r.estado !== 'OK'"));
check('y dice la similitud con palabras', BUSCAR.includes('relevanciaEnPalabras(p.similitud)'));

/* ─── 11. LA ESCALA EMPIEZA EN 14 ────────────────────────────────────────── */
for (const [nombre, codigo] of Object.entries(REHECHAS)) {
  const m = codigo.match(/text-\[(?:\d|1[0-3])(?:\.\d+)?px\]|\btext-(?:meta|label|ui)\b|\bbtn-sm\b|\bnotice-unverified\b|\bcard\b(?!-)/);
  check(`${nombre}: nada por debajo de 14 px ni piezas de la cara vieja`, !m, m?.[0] ?? '');
}

/* ─── 12. EL BLOQUE DE CSS NO SE SALE DE `.cara-nueva` ───────────────────── */
const CSS = readFileSync(join(SRC, 'design', 'cara-nueva.css'), 'utf8');
const MARCA = '/* ─── Expedientes ─── */';
const inicio = CSS.indexOf(MARCA);
check('cara-nueva.css tiene el bloque de Expedientes', inicio !== -1);
const siguiente = CSS.indexOf('/* ─── ', inicio + MARCA.length);
const bloque = inicio === -1 ? '' : CSS.slice(inicio, siguiente === -1 ? undefined : siguiente).replace(/\/\*[\s\S]*?\*\//g, ' ');
const sueltos: string[] = [];
const ajenos: string[] = [];
const guiones: string[] = [];
const rojos: string[] = [];
const monos: string[] = [];
const oros: string[] = [];
for (const m of bloque.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const cabeza = m[1].replace(/@media[^{]*\{/g, '').trim();
  const cuerpo = m[2];
  for (const sel of cabeza.split(',').map((s) => s.trim()).filter(Boolean)) {
    const bien =
      sel.startsWith('.cara-nueva') ||
      sel.startsWith(":root:not([data-theme='light']) .cara-nueva") ||
      sel.startsWith(":root[data-theme='dark'] .cara-nueva");
    if (!bien) sueltos.push(sel);
    if (!/cn-exp/.test(sel)) ajenos.push(sel);
    /* El guion es solo de «sin verificar». */
    if (/dashed/.test(cuerpo) && !/--sin-verificar/.test(sel)) guiones.push(sel);
    /* El rojo es de lo destructivo. */
    if (/var\(--danger\)/.test(cuerpo) && !/--peligro/.test(sel)) rojos.push(sel);
    /* El mono es de lo citable: el radicado. */
    if (/var\(--mono\)|monospace/.test(cuerpo) && !/cn-exp-mono/.test(sel)) monos.push(sel);
    /* El oro es del módulo activo, y eso lo pinta la barra, no esta pantalla. */
    if (/--gold/.test(cuerpo)) oros.push(sel);
  }
}
check('todo selector del bloque vive bajo .cara-nueva', bloque !== '' && sueltos.length === 0, sueltos.join(' · '));
check('todo selector del bloque es de cn-exp', bloque !== '' && ajenos.length === 0, ajenos.join(' · '));
check('el borde discontinuo solo aparece en lo que no está verificado', guiones.length === 0, guiones.join(' · '));
check('el rojo de peligro solo aparece en lo destructivo', rojos.length === 0, rojos.join(' · '));
check('el mono solo aparece en lo citable', monos.length === 0, monos.join(' · '));
check('el oro no aparece', oros.length === 0, oros.join(' · '));
const chicos = [...bloque.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1])).filter((n) => n < 14);
check('ningún tamaño del bloque baja de 14 px', bloque !== '' && chicos.length === 0, chicos.join(', '));
check(
  'el bloque trae su modo oscuro por los dos caminos',
  bloque.includes(":root:not([data-theme='light']) .cara-nueva") && bloque.includes(":root[data-theme='dark'] .cara-nueva")
);
check('las zonas ocultas con `hidden` no se encienden desde el CSS', bloque.includes('.cn-exp-zona:not([hidden])') && !/\.cn-exp-zona\s*\{[^}]*display/.test(bloque));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
