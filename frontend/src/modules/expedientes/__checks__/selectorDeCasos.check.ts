import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buscarCasos, filtrarPorRama, indexarCaso, opcionesDeRama, type CasoIndexado } from '../services/buscarCasos';
import {
  CASOS_PARA_FILTRAR_POR_RAMA,
  CUANTOS_RECIENTES,
  SIN_CLIENTE,
  casosParaEscoger,
  recordarCaso
} from '../services/casosDelSelector';
import type { CasoBuscable } from '../types';

/**
 * EL SELECTOR COMPARTIDO DE «DE QUÉ CASO ES».
 *
 * Run with: npm run check:selector-de-casos
 *
 * Pura: sin React, sin red, sin `localStorage`. Vigila las tres cosas que, de
 * torcerse, dejan al abogado sin encontrar su caso y sin saber por qué:
 *
 *   1. EL SELECTOR BUSCA CON LAS REGLAS DE LA LISTA, no con un «contiene» sobre
 *      la carátula. Cédula por dígitos y desde el principio, radicado con o sin
 *      guiones, cliente, contraparte, personas, despacho y rama. Aquí se prueban
 *      SOBRE LA FORMA DE DATO QUE EL SELECTOR RECIBE —sin el resumen del caso—,
 *      que es lo que una firma nota cuando alguien lo estrecha por accidente.
 *   2. EL ORDEN NO SE LO INVENTA EL SERVIDOR. Lo abierto hace poco arriba, los
 *      grupos contiguos, y un desempate escrito: sin él la misma lista se
 *      reordena sola entre dos pantallas y hace dudar de si falta alguno.
 *   3. UN GRUPO ES CONTIGUO. Un cliente que sale dos veces se lee como dos
 *      clientes distintos.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const leer = (rel: string): string => readFileSync(join(SRC, rel), 'utf8');

/* ─── LOS CASOS DE JUGUETE, CON LA FORMA QUE EL SELECTOR RECIBE ──────────── */

/**
 * `CasoBuscable`, NO `ExpedienteEnLista`: sin `proximoTermino`, sin
 * `documentos`, sin `terminosLeidos`. Es exactamente lo que
 * `expedientesApi.listar()` entrega, y probar con la forma rica escondería que
 * la búsqueda dejó de aceptar la pobre.
 */
const caso = (p: Partial<CasoBuscable> & { id: string; caratula: string }): CasoBuscable => ({
  radicado: null,
  despacho: null,
  rama: null,
  clienteId: null,
  clienteNombre: null,
  contraparte: null,
  estado: 'ACTIVO',
  notas: null,
  createdBy: 'abogada@firma.co',
  createdAt: '2026-03-01T10:00:00.000Z',
  updatedAt: '2026-03-01T10:00:00.000Z',
  ...p
});

const MOSQUERA = caso({
  id: 'c1',
  caratula: 'Mosquera vs. ACME',
  radicado: '11001-31-03-001-2026-00123-00',
  despacho: 'Juzgado 1 Civil del Circuito de Bogotá',
  rama: 'CIVIL',
  clienteNombre: 'Ana Mosquera',
  clienteDocumento: '1102811692',
  contraparte: 'ACME S.A.S.',
  personas: [
    { nombre: 'Tomás Wilches', identificacion: '79.456.123', papel: 'TESTIGO', lado: 'CONTRARIO' }
  ]
});
const DESPIDO = caso({
  id: 'c2',
  caratula: 'Despido de Gaitán',
  rama: 'LABORAL',
  clienteNombre: 'José Gaitán',
  clienteDocumento: '80123456',
  createdAt: '2026-05-02T10:00:00.000Z'
});
const SUCESION = caso({
  id: 'c3',
  caratula: 'Sucesión Mosquera',
  rama: 'FAMILIA',
  clienteNombre: 'Ana Mosquera',
  clienteDocumento: '1102811692',
  createdAt: '2026-06-02T10:00:00.000Z'
});
const HUERFANO = caso({ id: 'c4', caratula: 'Zapata, consulta suelta', rama: 'CIVIL' });

const TODOS = [MOSQUERA, DESPIDO, SUCESION, HUERFANO];
const indices: CasoIndexado<CasoBuscable>[] = TODOS.map((c) => indexarCaso(c));

const encontrados = (texto: string, lista = indices): string[] =>
  buscarCasos(lista, texto).map((r) => r.caso.id);

/* ─── 1. LAS REGLAS DE LA LISTA, SOBRE LA FORMA DEL SELECTOR ─────────────── */

check('por carátula', encontrados('sucesión').join() === 'c3');
check('sin tildes y sin mayúsculas', encontrados('SUCESION').join() === 'c3');
check('por nombre del cliente', encontrados('mosquera').join() === 'c1,c3');
check('por contraparte', encontrados('acme').join() === 'c1');
check('por despacho', encontrados('juzgado 1 civil').join() === 'c1');
check('por nombre de una persona registrada', encontrados('wilches').join() === 'c1');
check('por el código de la rama', encontrados('laboral').join() === 'c2');
check(
  'y por el nombre del catálogo de esa rama',
  encontrados('seguridad social').join() === 'c2',
  encontrados('seguridad social').join()
);

check('por cédula del cliente', encontrados('1102811692').join() === 'c1,c3');
check('con puntos y espacios, que dan igual', encontrados('1.102.811.692').join() === 'c1,c3');
check('con «C.C.» delante', encontrados('C.C. 1102811692').join() === 'c1,c3');
check('por la cédula de una persona del caso', encontrados('79456123').join() === 'c1');
check(
  'un fragmento DEL MEDIO de una cédula no encuentra nada: se compara desde el primer dígito',
  encontrados('28116').length === 0,
  encontrados('28116').join()
);

check('por el radicado entero con guiones', encontrados('11001-31-03-001-2026-00123-00').join() === 'c1');
check('y sin ellos', encontrados('11001310300120260012300').join() === 'c1');
check('por un trozo largo del radicado', encontrados('110013103001').join() === 'c1');
check('por el consecutivo, que es un segmento entero', encontrados('00123').join() === 'c1');
check('por el año del radicado', encontrados('2026').join() === 'c1');

check('varias palabras: TODAS tienen que aparecer', encontrados('mosquera acme').join() === 'c1');
check('y en campos distintos cada una', encontrados('gaitan laboral').join() === 'c2');
check('lo que no está no coincide', encontrados('inexistente').length === 0);
check('sin texto, entran todos', encontrados('').length === TODOS.length);

/* ─── 2. EL FILTRO DE RAMA ───────────────────────────────────────────────── */

const ramas = opcionesDeRama(indices, null);
check(
  'las ramas del desplegable son las de estos casos, por nombre',
  ramas.map((r) => r.valor).join() === 'CIVIL,FAMILIA,LABORAL',
  ramas.map((r) => `${r.valor}:${r.etiqueta}`).join(' | ')
);
check(
  'filtrar por rama recorta la lista',
  filtrarPorRama<CasoIndexado<CasoBuscable>>(indices, 'CIVIL')
    .map((x) => x.caso.id)
    .join() === 'c1,c4'
);
check('y «Todas» no recorta nada', filtrarPorRama<CasoIndexado<CasoBuscable>>(indices, null).length === 4);
check(
  'el umbral del filtro está escrito en un solo sitio y es una cifra',
  Number.isInteger(CASOS_PARA_FILTRAR_POR_RAMA) && CASOS_PARA_FILTRAR_POR_RAMA > 0,
  String(CASOS_PARA_FILTRAR_POR_RAMA)
);

/* ─── 3. LA MEMORIA DE LO ABIERTO HACE POCO ──────────────────────────────── */

check('un caso nuevo va al frente', recordarCaso(['a', 'b'], 'c').join() === 'c,a,b');
check('volver a escogerlo lo SUBE, no lo duplica', recordarCaso(['a', 'b', 'c'], 'c').join() === 'c,a,b');
check('el más viejo se cae al llegar al tope', recordarCaso(['a', 'b', 'c'], 'd', 3).join() === 'd,a,b');
check('un id vacío no ensucia la lista', recordarCaso(['a'], '   ').join() === 'a');
check('el tope por defecto es una cifra escrita', CUANTOS_RECIENTES >= 1);

/* ─── 4. EL ORDEN Y LOS GRUPOS ───────────────────────────────────────────── */

const idsDe = (recientes: string[]): string[] => casosParaEscoger(indices, recientes).map((f) => f.caso.id);
const clientesDe = (recientes: string[]): string[] => casosParaEscoger(indices, recientes).map((f) => f.cliente);

const sinRecientes = casosParaEscoger(indices, []);
check(
  'sin nada reciente, los clientes van por nombre y el montón sin cliente al final',
  sinRecientes.map((f) => f.cliente).join(' | ') ===
    ['Ana Mosquera', 'Ana Mosquera', 'José Gaitán', SIN_CLIENTE].join(' | '),
  sinRecientes.map((f) => f.cliente).join(' | ')
);
check(
  'y dentro de un cliente, por carátula con la colación española',
  sinRecientes
    .filter((f) => f.cliente === 'Ana Mosquera')
    .map((f) => f.caso.caratula)
    .join(' | ') === 'Mosquera vs. ACME | Sucesión Mosquera'
);

check(
  'lo abierto hace poco sube su grupo al primer puesto',
  idsDe(['c2']).join() === 'c2,c1,c3,c4',
  idsDe(['c2']).join()
);
check(
  'y dentro del grupo, el reciente va antes que su hermano',
  idsDe(['c3']).join() === 'c3,c1,c2,c4',
  idsDe(['c3']).join()
);
check(
  'el orden de la recencia manda entre grupos',
  idsDe(['c2', 'c3']).join() === 'c2,c3,c1,c4',
  idsDe(['c2', 'c3']).join()
);
check(
  'el montón sin cliente encabeza si es lo último que se abrió',
  idsDe(['c4']).join() === 'c4,c1,c3,c2',
  idsDe(['c4']).join()
);

/* LA CONTIGÜIDAD, QUE ES LA QUE SE ROMPERÍA AL ORDENAR SOLO POR RECENCIA. */
const contiguos = (clientes: string[]): boolean => {
  const vistos = new Set<string>();
  let anterior = '';
  for (const c of clientes) {
    if (c !== anterior && vistos.has(c)) return false;
    vistos.add(c);
    anterior = c;
  }
  return true;
};
for (const recientes of [[], ['c3'], ['c1'], ['c2', 'c3'], ['c3', 'c2', 'c4'], ['c1', 'c2', 'c3', 'c4']]) {
  check(
    `ningún cliente sale dos veces con recientes [${recientes.join(',')}]`,
    contiguos(clientesDe(recientes)),
    clientesDe(recientes).join(' | ')
  );
}
check(
  'la guarda de contigüidad muerde: una lista partida se detecta',
  !contiguos(['Ana', 'José', 'Ana'])
);
/*
 * Y MUERDE SOBRE LO QUE DE VERDAD SE HARÍA MAL. Ordenar los CASOS por recencia
 * —lo obvio al leer «lo abierto hace poco primero»— parte el grupo de Ana
 * Mosquera en dos con solo abrir un caso suyo y otro de Gaitán, y la lista
 * muestra al mismo cliente dos veces. Por eso la recencia ordena los GRUPOS.
 */
const ingenuo = ['c1', 'c2'];
const puestoIngenuo = (id: string): number =>
  ingenuo.indexOf(id) === -1 ? Number.POSITIVE_INFINITY : ingenuo.indexOf(id);
const porRecenciaASecas = [...indices]
  .sort((a, b) => puestoIngenuo(a.caso.id) - puestoIngenuo(b.caso.id))
  .map((x) => x.caso.clienteNombre ?? SIN_CLIENTE);
check(
  'ordenar los CASOS por recencia partiría un cliente en dos; ordenar los GRUPOS no',
  !contiguos(porRecenciaASecas) && contiguos(clientesDe(ingenuo)),
  `ingenuo: ${porRecenciaASecas.join(' | ')}`
);

check(
  'la rama viaja como texto secundario de cada fila',
  sinRecientes.find((f) => f.caso.id === 'c2')?.rama === 'Laboral & Seguridad Social',
  String(sinRecientes.find((f) => f.caso.id === 'c2')?.rama)
);
check(
  'y un caso sin rama lo dice, en vez de dejar el renglón vacío',
  casosParaEscoger([indexarCaso(caso({ id: 'x', caratula: 'Sin rama' }))], [])[0]?.rama === 'Sin rama registrada',
  String(casosParaEscoger([indexarCaso(caso({ id: 'x', caratula: 'Sin rama' }))], [])[0]?.rama)
);
check('un caso reciente se marca como tal', casosParaEscoger(indices, ['c1'])[0]?.reciente === true);
check('y uno que no, no', casosParaEscoger(indices, ['c1']).find((f) => f.caso.id === 'c2')?.reciente === false);

/* ─── 5. BUSCAR Y AGRUPAR JUNTOS, QUE ES COMO SE USA ─────────────────────── */

const soloMosquera = casosParaEscoger(
  buscarCasos(indices, 'mosquera')
    .map((r) => indices.find((x) => x.caso.id === r.caso.id)!)
    .filter(Boolean),
  ['c3']
);
check(
  'buscar y agrupar dan una sola cabecera con los dos casos del cliente',
  soloMosquera.map((f) => `${f.cliente}/${f.caso.id}`).join(' | ') === 'Ana Mosquera/c3 | Ana Mosquera/c1',
  soloMosquera.map((f) => `${f.cliente}/${f.caso.id}`).join(' | ')
);

/* ─── 6. LA PANTALLA ────────────────────────────────────────────────────── */

const SELECTOR = leer('modules/expedientes/components/SelectorDeExpediente.tsx');
const sinComentarios = (f: string): string =>
  f.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ').replace(/\/\/.*$/gm, ' ');
const CODIGO = sinComentarios(SELECTOR);

check('sigue leyendo la lista del gancho compartido', CODIGO.includes('useExpedientes()'));
check('y no la carga por su cuenta', !/expedientesApi[\s\S]{0,40}\.listar\(\)/.test(CODIGO));
check('conserva la cara nueva como opción por pantalla', CODIGO.includes("cara === 'nueva'"));
check(
  'busca con las reglas de la lista, no con una copia',
  CODIGO.includes('buscarCasos(') && CODIGO.includes('indexarCaso(') && !CODIGO.includes('.toLowerCase().includes(')
);
check('agrupa y ordena con el ayudante probado aquí', CODIGO.includes('casosParaEscoger('));
check(
  'el filtro de rama solo se pinta pasado el umbral y con más de una rama',
  CODIGO.includes('expedientes.length > CASOS_PARA_FILTRAR_POR_RAMA && ramas.length > 1')
);
check(
  '«Sin expediente» va siempre y va primero, también con la búsqueda escrita',
  /\{ valor: '', etiqueta: 'Sin expediente' \},\s*\.\.\.filas\.map/.test(CODIGO)
);
check('nada coincide se dice con lo que se escribió', SELECTOR.includes('Ninguno coincide con «{filtro.trim()}»'));
check(
  'y «Ver todos» limpia la búsqueda Y la rama, que son los dos motivos de no ver nada',
  SELECTOR.includes('Ver todos') &&
    CODIGO.includes("setFiltro('');") &&
    CODIGO.includes('setRama(null);')
);
check('escoger un caso lo anota como reciente', CODIGO.includes('anotarCasoAbierto(correo, nuevo)'));
check(
  '«Sin expediente» NO cuenta como caso abierto',
  CODIGO.includes('if (nuevo) setRecientes(anotarCasoAbierto(correo, nuevo));')
);
check(
  'el correo sale de la sesión firmada y no de un contexto que lanza fuera de su proveedor',
  CODIGO.includes('readSession()?.user.email') && !CODIGO.includes('useTenant()')
);
check('la cara vieja conserva la lista nativa y le añade los grupos', CODIGO.includes('<optgroup'));

const GUARDADO = leer('modules/expedientes/services/casosDelSelector.ts');
check('lo reciente se guarda por correo, no en una lista común del equipo', GUARDADO.includes('[suyo]: lista'));
check(
  'y todo acceso al almacenamiento va en try/catch',
  (GUARDADO.match(/try \{/g) ?? []).length >= 2 && (GUARDADO.match(/\} catch/g) ?? []).length >= 2
);
check(
  'la clave se importa de donde se borra la sesión, no se copia el texto',
  GUARDADO.includes("import { CLAVE_DE_CASOS_RECIENTES } from '../../auth/session'")
);
const SESION = leer('modules/auth/session.ts');
check('y cerrar sesión se la lleva', /CLAVES_DE_LA_SESION[\s\S]{0,200}removeItem\(clave\)/.test(SESION));

console.log('');
if (fallos === 0) {
  console.log('ALL CHECKS PASSED');
} else {
  console.log(`${fallos} FALLA(S)`);
  process.exitCode = 1;
}
