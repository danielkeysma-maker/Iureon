/**
 * Guarda la búsqueda y los filtros de la lista de Expedientes.
 *
 * Run with: npm run check:buscar-casos
 *
 * El 14 de septiembre el dueño pidió encontrar un caso por CÉDULA o NIT, por
 * NOMBRE o por RADICADO, y filtrar por AÑO y MES. Lo que puede mentir aquí:
 *
 * 1. LA CÉDULA ESCRITA DE OTRA FORMA. «1.000.000.001», «1000000001» y
 *    «1 000 000 001» son la misma persona; un NIT con su dígito de
 *    verificación también. Comparar el texto tal cual no encuentra al cliente.
 * 2. EL FRAGMENTO QUE COINCIDE CON TODO. Cinco dígitos están dentro de casi
 *    cualquier radicado de veintitrés: una búsqueda de cédula que también
 *    busque por «contiene» en el radicado llena la lista de casos ajenos.
 * 3. LA COINCIDENCIA QUE NO SE VE. Si el caso aparece porque la contraparte
 *    se llama así, y la tarjeta no muestra a la contraparte, el abogado cree
 *    que la búsqueda falló. Se dice por qué coincidió.
 * 4. EL MES DE BOGOTÁ LEÍDO EN UTC. Un caso registrado el 31 de diciembre a
 *    las 8 p. m. en Colombia es del 1 de enero en UTC.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MESES,
  aniosDeRegistro,
  buscarCasos,
  filtrarPorRegistro,
  filtrosEnPalabras,
  indexarCaso,
  mesesDeRegistro,
  registroEnBogota
} from '../services/buscarCasos';
import { filtrarCasos } from '../services/agruparCasos';
import type { ExpedienteEnLista } from '../types';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const caso = (id: string, o: Partial<ExpedienteEnLista> = {}): ExpedienteEnLista => ({
  id,
  caratula: `Caso ${id}`,
  radicado: null,
  despacho: null,
  rama: null,
  clienteId: null,
  clienteNombre: null,
  contraparte: null,
  estado: 'ACTIVO',
  notas: null,
  createdBy: 'u',
  createdAt: '2026-03-10T15:00:00Z',
  updatedAt: '',
  terminosLeidos: true,
  proximoTermino: null,
  terminoVencido: null,
  terminosPendientes: 0,
  documentos: 0,
  clienteDocumento: null,
  personas: [],
  ...o
});

const CASOS = [
  caso('cc', { clienteId: 'c1', clienteNombre: 'Cliente 01', clienteDocumento: '1000000001' }),
  caso('nit', { clienteId: 'c2', clienteNombre: 'Entidad 02', clienteDocumento: '9000000010' }),
  caso('contra', {
    clienteId: 'c3',
    clienteNombre: 'Cliente 03',
    personas: [
      { nombre: 'Álvaro Pérez Contraparte', identificacion: '20.000.002', papel: 'DEMANDADO', lado: 'CONTRARIO' },
      { nombre: 'Testigo Uno', identificacion: null, papel: 'TESTIGO', lado: 'PROPIO' }
    ]
  }),
  caso('rad', { radicado: '00001-00-00-000-2024-00123-00', createdAt: '2025-12-31T01:00:00Z' }),
  caso('rad23', { radicado: '00000000000020230004500', createdAt: '2025-06-01T12:00:00Z' }),
  caso('texto', { caratula: 'Proceso de restitución', contraparte: 'Inmobiliaria Cero', despacho: 'Juzgado 00 Civil' }),
  caso('viejo', { clienteId: 'c9', clienteNombre: 'Cliente 09', personas: null, createdAt: 'no es fecha' })
];
const INDICE = CASOS.map(indexarCaso);
const ids = (q: string) => buscarCasos(INDICE, q).map((r) => r.caso.id).join(',');
const porQue = (q: string, id: string) => buscarCasos(INDICE, q).find((r) => r.caso.id === id)?.porQue ?? null;

/* ─── 1. CÉDULA Y NIT: SOLO DÍGITOS ──────────────────────────────────────── */
check('la cédula con puntos encuentra la guardada sin puntos', ids('1.000.000.001') === 'cc', ids('1.000.000.001'));
check('sin puntos también', ids('1000000001') === 'cc');
check('con espacios también', ids('1 000 000 001') === 'cc');
check('con el prefijo «C.C.» también', ids('C.C. 1.000.000.001') === 'cc', ids('C.C. 1.000.000.001'));
check('el NIT con su dígito de verificación encuentra el guardado con el dígito pegado', ids('900.000.001-0') === 'nit', ids('900.000.001-0'));
check('el NIT sin el dígito de verificación también', ids('900000001') === 'nit', ids('900000001'));
check('«NIT 900.000.001» también', ids('NIT 900.000.001') === 'nit', ids('NIT 900.000.001'));
check('los primeros dígitos bastan desde cinco', ids('10000') === 'cc', ids('10000'));
check('la identificación de una persona del caso, escrita con puntos, se encuentra sin ellos', ids('20000002') === 'contra', ids('20000002'));
check('un fragmento del medio de la cédula no la encuentra', ids('0000001') === '', ids('0000001'));
check('cuatro dígitos no son una cédula', !ids('1000').split(',').includes('cc'), ids('1000'));
const mCc = porQue('1.000.000.001', 'cc');
check('dice por qué: la cédula del cliente, como se guardó', mCc?.etiqueta === 'cédula o NIT del cliente' && mCc.valor === '1000000001' && mCc.mono, JSON.stringify(mCc));
const mContra = porQue('20.000.002', 'contra');
check(
  'y si es de la contraparte, lo dice con el nombre',
  mContra?.etiqueta === 'cédula o NIT de la contraparte Álvaro Pérez Contraparte' && mContra.valor === '20.000.002',
  JSON.stringify(mContra)
);

/* ─── 2. NOMBRES: CLIENTE, CARÁTULA, DESPACHO Y CADA PERSONA ─────────────── */
check('el nombre de la contraparte encuentra el caso, sin tildes ni mayúsculas', ids('alvaro perez') === 'contra', ids('alvaro perez'));
check('varias palabras coinciden aunque estén en campos distintos', ids('cliente 03 testigo') === 'contra', ids('cliente 03 testigo'));
check('si falta una palabra en todos los campos, no coincide', ids('alvaro inexistente') === '');
check('las palabras en otro orden también', ids('contraparte alvaro') === 'contra');
const mPersona = porQue('alvaro', 'contra');
check('dice «persona: nombre (contraparte)»', mPersona?.etiqueta === 'persona' && mPersona.valor === 'Álvaro Pérez Contraparte (contraparte)', JSON.stringify(mPersona));
const mTestigo = porQue('testigo uno', 'contra');
check('una persona de su lado dice su papel', mTestigo?.valor === 'Testigo Uno (testigo)', JSON.stringify(mTestigo));
check('la contraparte escrita en el caso también busca', ids('inmobiliaria') === 'texto');
check('y lo dice, porque la tarjeta no la muestra', porQue('inmobiliaria', 'texto')?.etiqueta === 'contraparte');
check('lo que la tarjeta ya muestra no trae «por qué»', porQue('cliente 01', 'cc') === null && porQue('restitucion', 'texto') === null);
check('el despacho sigue buscando', ids('juzgado 00 civil') === 'texto');
check('un caso con personas sin leer no revienta y se encuentra por lo demás', ids('cliente 09') === 'viejo');

/* ─── 3. RADICADO ────────────────────────────────────────────────────────── */
check('el radicado con guiones, escrito sin ellos', ids('00001000000020240012300') === 'rad', ids('00001000000020240012300'));
check('el radicado escrito con otros guiones', ids('00001-00-00-000-2024-00123') === 'rad');
check('el consecutivo solo, en su segmento', ids('00123') === 'rad', ids('00123'));
check('cinco dígitos que cruzan segmentos no coinciden con el radicado', ids('02400') === '', ids('02400'));
check('el consecutivo del radicado corrido de 23 dígitos, en su segmento', ids('00045') === 'rad23', ids('00045'));
check('«2024» encuentra el radicado de ese año', ids('2024') === 'rad', ids('2024'));
check('«2023» encuentra el año del radicado corrido (dígitos 13 a 16)', ids('2023') === 'rad23', ids('2023'));
check('y dice que coincidió con el año del radicado', porQue('2024', 'rad')?.etiqueta === 'año del radicado' && porQue('2024', 'rad')?.valor === '00001-00-00-000-2024-00123-00');
check('el radicado buscado entero no trae «por qué»: la tarjeta lo muestra', porQue('00001000000020240012300', 'rad') === null);
check('«1999» no encuentra radicados de otro año', ids('1999') === '');

/* ─── 4. LO DE ANTES SIGUE IGUAL ─────────────────────────────────────────── */
check('filtrarCasos usa la misma búsqueda', filtrarCasos(CASOS, 'alvaro').map((c) => c.id).join(',') === 'contra');
check('sin texto no filtra nada', buscarCasos(INDICE, '   ').length === CASOS.length);

/* ─── 5. AÑO Y MES DE REGISTRO, EN BOGOTÁ ───────────────────────────────── */
check('el 31 de diciembre a las 8 p. m. de Bogotá es diciembre, no enero', JSON.stringify(registroEnBogota('2026-01-01T01:00:00Z')) === '{"anio":2025,"mes":12}', JSON.stringify(registroEnBogota('2026-01-01T01:00:00Z')));
check('una fecha ilegible no inventa año', registroEnBogota('no es fecha') === null && registroEnBogota('') === null);
check('los años salen de los casos, del más reciente al más antiguo, sin repetir', JSON.stringify(aniosDeRegistro(INDICE)) === '[2026,2025]', JSON.stringify(aniosDeRegistro(INDICE)));
check('los meses son los que hay en ese año', JSON.stringify(mesesDeRegistro(INDICE, 2025)) === '[6,12]', JSON.stringify(mesesDeRegistro(INDICE, 2025)));
check('doce meses con su nombre', MESES.length === 12 && MESES[0] === 'enero' && MESES[11] === 'diciembre');
const soloIds = (xs: { caso: ExpedienteEnLista }[]) => xs.map((x) => x.caso.id).join(',');
check('filtrar por año', soloIds(filtrarPorRegistro(INDICE, { anio: 2025, mes: null })) === 'rad,rad23', soloIds(filtrarPorRegistro(INDICE, { anio: 2025, mes: null })));
check('por año y mes', soloIds(filtrarPorRegistro(INDICE, { anio: 2025, mes: 12 })) === 'rad');
check('el mes sin año no filtra: se elige después del año', filtrarPorRegistro(INDICE, { anio: null, mes: 3 }).length === INDICE.length);
check('el caso con fecha ilegible sale en «Todos» y en ningún año', filtrarPorRegistro(INDICE, { anio: null, mes: null }).some((x) => x.caso.id === 'viejo') && !filtrarPorRegistro(INDICE, { anio: 2026, mes: null }).some((x) => x.caso.id === 'viejo'));

/* La combinación con pestañas: se filtra la pestaña, luego la fecha, luego el texto. */
const pestana = INDICE.filter((x) => ['rad', 'rad23', 'cc'].includes(x.caso.id));
check('pestaña + año + texto se combinan', soloIds(buscarCasos(filtrarPorRegistro(pestana, { anio: 2025, mes: null }), '2024')) === 'rad');
check('y un texto que está en otra pestaña no aparece', buscarCasos(filtrarPorRegistro(pestana, { anio: null, mes: null }), 'alvaro').length === 0);

check(
  'los filtros activos en palabras',
  filtrosEnPalabras({ busqueda: ' alvaro ', anio: 2025, mes: 12 }).join(' · ') === 'búsqueda «alvaro» · año 2025 · diciembre',
  filtrosEnPalabras({ busqueda: ' alvaro ', anio: 2025, mes: 12 }).join(' · ')
);
check('sin filtros no dice nada', filtrosEnPalabras({ busqueda: '', anio: null, mes: null }).length === 0);

/* ─── 6. MIL CASOS SIGUEN SIENDO INMEDIATOS ─────────────────────────────── */
const MIL = Array.from({ length: 3000 }, (_, i) =>
  indexarCaso(
    caso(`m${i}`, {
      clienteNombre: `Cliente ${i}`,
      clienteDocumento: String(1000000000 + i),
      radicado: `0000000000002020${String(i).padStart(5, '0')}00`,
      personas: [{ nombre: `Persona ${i}`, identificacion: null, papel: 'DEMANDADO', lado: 'CONTRARIO' }]
    })
  )
);
const t0 = performance.now();
for (const q of ['persona 2999', '1.000.002.999', '2020', '02999', 'cliente']) buscarCasos(MIL, q);
const ms = performance.now() - t0;
check('cinco búsquedas sobre 3.000 casos tardan menos de 150 ms', ms < 150, `${ms.toFixed(1)} ms`);

/* ─── 7. LA PANTALLA ─────────────────────────────────────────────────────── */
const AQUI = dirname(fileURLToPath(import.meta.url));
const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const VISTA = sinComentarios(readFileSync(join(AQUI, '..', 'components', 'ExpedientesView.tsx'), 'utf8'));
const LISTAS = sinComentarios(readFileSync(join(AQUI, '..', 'components', 'CasosEnLaLista.tsx'), 'utf8'));
const FILTROS = sinComentarios(readFileSync(join(AQUI, '..', 'components', 'FiltrosDeLaLista.tsx'), 'utf8'));

check('el índice se calcula una vez por respuesta del servidor', /React\.useMemo\(\s*\(\)\s*=>\s*\(misCasos\?\.expedientes \?\? \[\]\)\.map\(indexarCaso\)/.test(VISTA));
check('la búsqueda espera como mucho 150 ms en listas grandes', /ESPERA_DE_BUSQUEDA_MS = (\d+)/.test(VISTA) && Number(/ESPERA_DE_BUSQUEDA_MS = (\d+)/.exec(VISTA)?.[1]) <= 150);
check('Enter abre el caso si queda uno solo', /e\.key === 'Enter'[\s\S]{0,300}length === 1[\s\S]{0,200}abrir\(/.test(VISTA));
check('Escape borra la búsqueda', /e\.key === 'Escape'[\s\S]{0,120}setBusqueda\(''\)/.test(VISTA));
check('los filtros no se guardan en el navegador', !/localStorage/.test(VISTA + FILTROS));
check('el año y el mes dicen qué fecha es', FILTROS.includes('Registrado en Iureon'));
check('los años salen de los casos, nunca escritos', FILTROS.includes('aniosDeRegistro(') && !/\b20[0-9]{2}\b/.test(FILTROS));
check('el mes espera al año', /disabled=\{anio === null\}/.test(FILTROS) && FILTROS.includes('Elija primero el año'));
check('en escritorio el selector de la casa; en el teléfono el nativo', FILTROS.includes('<SelectorEnCascada') && FILTROS.includes('<select') && FILTROS.includes('useVentanaAncha()'));
check('«Limpiar filtros» aparece con cualquier filtro puesto', /hayFiltros\s*&&[\s\S]{0,500}Limpiar filtros/.test(VISTA));
check('«Ninguno coincide» nombra los filtros puestos', LISTAS.includes('Ninguno coincide') && LISTAS.includes('filtros.join('));
check('la tarjeta dice por qué coincidió', LISTAS.includes('Coincide con:') && LISTAS.includes('cn-exp-mono'));
check('el aviso de búsqueda incompleta se muestra', VISTA.includes('misCasos?.avisoBusqueda'));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
