/**
 * Guarda la cara nueva de Herramientas —la portada, las siete con pantalla, el
 * detalle de festivos y la agenda— contra lo que la maqueta dibuja y el
 * producto no hace, y contra las cifras de muestra que la maqueta imprime.
 *
 * Run with: npm run check:herramientas-cara
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. UNA CIFRA DE MUESTRA CON CARA DE DATO. `app-herramientas.html` pone de
 *    ejemplo una tasa bancaria de 18,70, dos índices del IPC, un capital, un
 *    salario y una fecha con «quedan 3 días hábiles». Copiados a un campo o a
 *    un rótulo, se leen como la tasa o el índice vigentes: es el fallo de las
 *    calculadoras que «caían a su propia estimación», con otro traje. Las cifras
 *    salen del servidor; los ejemplos son ceros.
 *
 * 2. LO QUE LA MAQUETA DIBUJA Y NO EXISTE: «Guardar en un caso» en el contador,
 *    el interruptor de la vacancia (el servidor la descuenta siempre), «quedan N
 *    días hábiles» contados desde hoy, y el botón «Nueva liquidación». La tabla
 *    de intereses «Por tramos de tasa» salió de esta lista el 14 de septiembre
 *    de 2026: el servidor ya liquida cada periodo con su tasa certificada, y la
 *    sección 5b vigila que la pinte con las tasas y las fuentes que él manda.
 *
 * 3. LA PIEL QUE TUMBA UNA LLAMADA. Pasar siete diálogos a pantallas es
 *    reescribir siete archivos; la llamada al servidor, las dos exportaciones y
 *    la copia al portapapeles tienen que seguir ahí, cada una en su pantalla.
 *
 * Se leen los componentes como TEXTO y sin comentarios: los comentarios que
 * explican por qué algo no se pinta contienen la palabra.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HERRAMIENTAS, coincideConLaBusqueda, esHerramienta, herramientaAlAbrir } from '../herramientas';
import { celdasDelMes, huecoInicial, moverMes, rotuloDelDia } from '../../agenda/mesDelCalendario';
import type { CalendarioAnual } from '../types';
import type { EntradaDeAgenda } from '../../agenda/types';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* ─── 1. QUÉ SE ABRE AL ENTRAR ───────────────────────────────────────────── */
check('las ocho pantallas tienen identificador', HERRAMIENTAS.length === 8, String(HERRAMIENTAS.length));
check('un identificador conocido es herramienta', esHerramienta('intereses') && esHerramienta('agenda'));
check('uno desconocido no lo es', !esHerramienta('ejecutoria') && !esHerramienta('') && !esHerramienta(null));
check('sin nada recordado se ve la portada', herramientaAlAbrir(null, false) === null);
check('lo recordado se vuelve a abrir', herramientaAlAbrir('cuantia', false) === 'cuantia');
check('un recordado viejo o mal escrito abre la portada, no una pantalla vacía', herramientaAlAbrir('nueva-liquidacion', false) === null);
check('lo que trae un borrador abre la agenda aunque se recordara otra', herramientaAlAbrir('intereses', true) === 'agenda');
check('buscar ignora mayúsculas y tildes', coincideConLaBusqueda(['Indexación por IPC'], 'INDEXACION'));
check('buscar por lo que hace, no solo por el nombre', coincideConLaBusqueda(['Intereses de mora', 'Comercial o legal civil'], 'civil'));
check('sin búsqueda todo coincide', coincideConLaBusqueda(['Glosario'], '   '));
check('lo que no coincide no aparece', !coincideConLaBusqueda(['Glosario', 'Términos del oficio'], 'salario'));

/* ─── 2. EL MES DEL CALENDARIO ───────────────────────────────────────────── */
check('un mes que empieza en lunes no tiene hueco', huecoInicial(2025, 8) === 0, String(huecoInicial(2025, 8)));
check('uno que empieza en domingo deja seis', huecoInicial(2024, 8) === 6, String(huecoInicial(2024, 8)));
check('diciembre avanza a enero del año siguiente', JSON.stringify(moverMes({ anio: 2030, mes: 11 }, 1)) === JSON.stringify({ anio: 2031, mes: 0 }));
check('enero retrocede a diciembre del anterior', JSON.stringify(moverMes({ anio: 2030, mes: 0 }, -1)) === JSON.stringify({ anio: 2029, mes: 11 }));

const CAL: CalendarioAnual = {
  anio: 2030,
  festivos: [{ fecha: '2030-01-07', nombre: 'Festivo de prueba', regla: 'TRASLADO_LUNES', fechaOriginal: '2030-01-06' }],
  vacancia: { desde: '2030-12-20', hasta: '2030-01-10', descripcion: '' },
  semanaSanta: { jueves: '2030-04-18', viernes: '2030-04-19', lunesAMiercoles: ['2030-04-15'], nota: '' },
  diasHabilesPorMes: [],
  fuentes: []
};
const entrada = (fechaLimite: string, verificado: boolean, asunto = 'Proceso 00'): EntradaDeAgenda =>
  ({ id: fechaLimite + asunto, fechaLimite, terminoVerificado: verificado, asunto, actuacionNombre: 'Actuación 00' }) as EntradaDeAgenda;

const enero = celdasDelMes(2030, 0, CAL, [entrada('2030-01-21', true), entrada('2030-01-21', false, 'Proceso 01'), entrada('2030-02-01', true)]);
const dia = (d: number) => enero[d - 1];
check('enero trae sus 31 días', enero.length === 31, String(enero.length));
check('el sábado y el domingo no son hábiles', dia(5).finDeSemana && dia(6).finDeSemana && dia(5).noHabil);
check('el festivo que manda el servidor se pinta con su nombre', dia(7).festivo === 'Festivo de prueba' && dia(7).noHabil);
check('la vacancia que cruza el año se reconoce del lado de enero', dia(9).vacancia && !dia(14).vacancia);
check('un día corriente es hábil', !dia(15).noHabil, JSON.stringify(dia(15)));
check('los vencimientos caen en su día y solo en su mes', dia(21).vencimientos.length === 2 && enero.every((c) => c.vencimientos.every((e) => e.fechaLimite.startsWith('2030-01'))));
check('un vencimiento sin verificar marca el día entero', dia(21).sinVerificar);
check('el rótulo nombra el vencimiento y cuenta los demás', rotuloDelDia(dia(21)) === 'Proceso 00 y 1 más', String(rotuloDelDia(dia(21))));
check('sin vencimiento, el rótulo es el festivo', rotuloDelDia(dia(7)) === 'Festivo de prueba');
check('un día corriente no lleva rótulo', rotuloDelDia(dia(15)) === null);
const abril = celdasDelMes(2030, 3, CAL, []);
check('el lunes santo del servidor no es hábil', abril[14].semanaSanta && abril[14].noHabil);
const sinCalendario = celdasDelMes(2030, 0, null, []);
check('sin el calendario del año no se inventa ningún festivo', sinCalendario.every((c) => !c.festivo && !c.vacancia && !c.semanaSanta));

/* ─── 3. LAS PANTALLAS, LEÍDAS COMO TEXTO ────────────────────────────────── */
const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const leer = (ruta: string): string => sinComentarios(readFileSync(join(SRC, ruta), 'utf8'));

const PANTALLAS: Record<string, string> = {
  ToolsView: leer('modules/tools/components/ToolsView.tsx'),
  PantallaDeHerramienta: leer('modules/tools/components/PantallaDeHerramienta.tsx'),
  FuentesBox: leer('modules/tools/components/FuentesBox.tsx'),
  Terminos: leer('modules/procedural-terms/components/ProceduralTermsModal.tsx'),
  Intereses: leer('modules/tools/components/InteresesModal.tsx'),
  Indexacion: leer('modules/tools/components/IndexacionModal.tsx'),
  Cuantia: leer('modules/tools/components/CuantiaModal.tsx'),
  Liquidacion: leer('modules/settlements/components/LaborSettlementModal.tsx'),
  Festivos: leer('modules/tools/components/CalendarioModal.tsx'),
  Glosario: leer('modules/search/components/LegalSearchGlossaryModal.tsx'),
  Agenda: leer('modules/agenda/components/AgendaModal.tsx'),
  AgendaForm: leer('modules/agenda/components/AgendaForm.tsx'),
  CalendarioDelMes: leer('modules/agenda/components/CalendarioDelMes.tsx')
};
const P = PANTALLAS;
const APP = leer('App.tsx');

check(
  'la raíz lleva la visita guiada y la cara nueva en el mismo elemento',
  /data-visita="vista-tools"\s+className="cara-nueva cn-her[ "]/.test(P.ToolsView)
);
check('Herramientas se sigue montando con su época', APP.includes('<ToolsView key={herramientasEpoca} />'));
check('Expedientes sigue abriendo la agenda', APP.includes("recordar(PANTALLAS.herramienta, 'agenda')"));
check('la portada decide qué abrir con lo recordado y lo pendiente', P.ToolsView.includes('herramientaAlAbrir(recordado(PANTALLAS.herramienta), hayPendiente())'));
check('abrir y cerrar se recuerdan', P.ToolsView.includes('recordar(PANTALLAS.herramienta, id)') && P.ToolsView.includes('recordar(PANTALLAS.herramienta, null)'));

/* Cada una con pantalla, no con diálogo: la maqueta las pinta de página entera. */
for (const nombre of ['Terminos', 'Intereses', 'Indexacion', 'Cuantia', 'Liquidacion', 'Festivos', 'Glosario', 'Agenda']) {
  check(`${nombre} es una pantalla de Herramientas`, P[nombre].includes('<PantallaDeHerramienta'));
}
for (const nombre of ['Terminos', 'Intereses', 'Indexacion', 'Cuantia', 'Liquidacion', 'Festivos', 'Glosario']) {
  check(`${nombre} ya no abre un diálogo`, !/design\/Dialog'/.test(P[nombre]));
}
check('la pantalla compartida tiene columna de datos y de resultado', P.PantallaDeHerramienta.includes('cn-her-formulario') && P.PantallaDeHerramienta.includes('cn-her-resultado'));
check('y en el teléfono una barra con «volver» y el primario abajo', P.PantallaDeHerramienta.includes('cn-her-barra-movil') && P.PantallaDeHerramienta.includes('cn-her-pie-movil'));

/* ─── 4. LAS LLAMADAS Y LAS SALIDAS SIGUEN AHÍ ───────────────────────────── */
const LLAMADAS: Array<[string, string]> = [
  ['Terminos', 'termsApi.calculate({ notifiedDate, termInDays, jurisdictionType, termUnit })'],
  ['Terminos', 'dejarPendiente(pendienteDesdeElContador({'],
  ['ToolsView', "onPonerEnAgenda={() => abrir('agenda')}"],
  ['ToolsView', "onVolverAlContador={() => abrir('terminos')}"],
  ['Agenda', 'exportarAgendaIcs(aExportar, filtro)'],
  ['Agenda', 'await exportarAgendaPdf(aExportar, filtro)'],
  ['AgendaForm', 'valoresInicialesDelFormulario(pendiente, hoyISO())'],
  ['Liquidacion', 'settlementsApi.calculate({ monthlySalary: salario, startDate, endDate, terminationType })'],
  ['Intereses', 'toolsApi.intereses({'],
  ['Intereses', 'toolsApi.parametros()'],
  ['Indexacion', 'toolsApi.indexacion({'],
  ['Indexacion', 'toolsApi.parametros()'],
  ['Cuantia', 'toolsApi.cuantia({ pretension: Number(pretension), anio, jurisdiccion })'],
  ['Cuantia', 'toolsApi.parametros()'],
  ['Festivos', 'toolsApi.calendario(anio, semanaSantaCompleta)'],
  ['Glosario', "searchGlossary(searchQuery.trim(), 'TODAS', controller.signal)"],
  ['Agenda', "agendaApi.listar('TODAS')"],
  ['Agenda', "agendaApi.editar(entrada.id, { estado: 'CUMPLIDA' })"],
  ['Agenda', 'agendaApi.borrar(entrada.id)'],
  ['Agenda', 'toolsApi.calendario(visto.anio, true)'],
  ['Agenda', 'tomarPendiente()'],
  ['AgendaForm', 'agendaApi.crear({'],
  ['AgendaForm', 'agendaApi.previsualizar({'],
  ['AgendaForm', 'agendaApi.plazoDe(actuacionId)'],
  ['AgendaForm', '<SelectorDeExpediente']
];
/* Sin espacios: el formateador parte `toolsApi.parametros()` en dos renglones y la llamada sigue siendo la misma. */
const junto = (texto: string): string => texto.replace(/\s+/g, '');
for (const [nombre, llamada] of LLAMADAS) check(`${nombre} conserva ${llamada}`, junto(P[nombre]).includes(junto(llamada)));
for (const nombre of ['Terminos', 'Intereses', 'Indexacion', 'Cuantia', 'Liquidacion', 'Festivos']) {
  check(`${nombre} exporta a Excel y a PDF desde el mismo libro`, P[nombre].includes('exportarExcel(l)') && P[nombre].includes('await exportarPdf(l)'));
}
for (const nombre of ['Terminos', 'Liquidacion', 'Glosario']) {
  check(`${nombre} conserva la copia al portapapeles`, P[nombre].includes('navigator.clipboard.writeText('));
}
check('la agenda sigue ofreciendo el detalle de festivos', P.Agenda.includes('onClick={onVerFestivos}'));
check('borrar un término de la agenda pregunta antes', P.Agenda.includes('onClick={() => setPorBorrar(e)}') && P.Agenda.includes('void borrar(porBorrar)'));

/* ─── 5. NINGUNA CIFRA DE LA MAQUETA, NINGÚN NOMBRE VEROSÍMIL ────────────── */
const MUESTRAS: Array<[string, RegExp]> = [
  ['la tasa de muestra 18,70', /18[.,]70/],
  ['el IPC de muestra 105,48', /105[.,]48/],
  ['el IPC de muestra 145,12', /145[.,]12/],
  ['el capital de muestra', /\b5\.?000\.?000\b/],
  ['el valor de muestra', /\b10\.?000\.?000\b/],
  ['la pretensión de muestra', /\b80\.?000\.?000\b/],
  ['el salario de muestra', /2\.?480\.?000/],
  ['la cuenta de días inventada', /quedan 3 días|Un miércoles/],
  ['las fechas de la vacancia escritas a mano', /20 de diciembre|10 de enero/],
  ['los nombres de la maqueta', /Mosquera|ACME|Peralta/],
  ['un despacho verosímil', /Juzgado\s+(?!00\b)\d+/],
  ['una tasa pactada de muestra', /placeholder="24"/]
];
for (const [nombre, codigo] of Object.entries(PANTALLAS)) {
  for (const [que, re] of MUESTRAS) {
    const m = codigo.match(re);
    check(`${nombre} no trae ${que}`, !m, m?.[0] ?? '');
  }
  /*
   * «Por tramos» estuvo vetado mientras intereses se liquidaba con una sola tasa:
   * prometerlo era prometer una consulta que el producto no hacía. Desde el 14
   * de septiembre de 2026 el backend guarda las certificaciones oficiales y
   * parte la mora en tramos, así que Intereses (la tabla) y la portada (la
   * tarjeta) pueden decirlo — PERO SOLO MIENTRAS ESO EXISTA. El permiso no se
   * concede por nombre: se comprueba leyendo los dos archivos del backend. Si
   * alguien retira la tabla de tasas o el cálculo por tramos, el veto vuelve
   * solo y este check exige quitar el texto.
   */
  const puedeDecirTramos = (nombre === 'Intereses' || nombre === 'ToolsView') && tramosCertificadosExisten();
  const vetado = puedeDecirTramos ? /Guardar en un caso|Nueva liquidación|Descontar la vacancia judicial/ : /Por tramos|Guardar en un caso|Nueva liquidación|Descontar la vacancia judicial/;
  check(`${nombre}: sin ${puedeDecirTramos ? '' : '«Por tramos», '}«Guardar en un caso», «Nueva liquidación» ni el interruptor de vacancia`, !vetado.test(codigo));
  check(`${nombre} no pregunta con el diálogo del navegador`, !/\b(confirm|alert|prompt)\(/.test(codigo));
  const chico = codigo.match(/text-\[(?:\d|1[0-3])(?:\.\d+)?px\]|\btext-(?:meta|label|ui)\b|\bbtn-sm\b|\bnotice-unverified\b|\bnotice\b|\bt-row\b|\bt-head\b|\bcard\b(?!-)/);
  check(`${nombre}: nada por debajo de 14 px ni piezas de la cara vieja`, !chico, chico?.[0] ?? '');
}
/* ─── Intereses por tramos de tasa ───────────────────────────────────────── */
/*
 * La prueba de que los tramos existen de verdad, leída del backend: la tabla de
 * certificaciones con su resolución y URL por fila, y el cálculo que parte la
 * mora en ellas. Es una declaración de función (se eleva) porque el veto de
 * «Por tramos», más arriba, la consulta antes de llegar aquí.
 */
function tramosCertificadosExisten(): boolean {
  const TOOLS_BACKEND = join(SRC, '..', '..', 'backend', 'src', 'modules', 'tools');
  try {
    const tabla = readFileSync(join(TOOLS_BACKEND, 'tasasCertificadas.ts'), 'utf8');
    const calculo = readFileSync(join(TOOLS_BACKEND, 'interesesPorTramos.ts'), 'utf8');
    return (
      tabla.includes('export const CERTIFICACIONES_IBC') &&
      tabla.includes("resolucion: 'Resolución") &&
      tabla.includes('superfinanciera.gov.co') &&
      calculo.includes('export const partirEnTramos') &&
      calculo.includes('export const liquidarIntereses')
    );
  } catch {
    return false;
  }
}
check('el backend tiene la tabla de tasas certificadas y el cálculo por tramos que la tarjeta y la tabla prometen', tramosCertificadosExisten());
check('la tarjeta de la portada dice «Por tramos» porque el cálculo existe', P.ToolsView.includes('Por tramos, con la tasa certificada de cada periodo'));
check('Intereses pinta «Por tramos de tasa» con los tramos que manda el servidor', P.Intereses.includes('Por tramos de tasa') && junto(P.Intereses).includes(junto('resultado.tramos.map((t)')));
check('cada tramo enlaza la resolución que certificó su tasa', P.Intereses.includes('href={t.url}') && P.Intereses.includes('{t.resolucion}'));
check('la tabla de tramos se desliza dentro de su caja en el teléfono', P.Intereses.includes('cn-her-desliza') && P.Intereses.includes('cn-her-tabla--tramos-tasa'));
check('Intereses dice de dónde salen las tasas y cuándo se consultaron', P.Intereses.includes('Tasas certificadas por la Superintendencia Financiera; consultadas el'));
check('Intereses ya no pide escribir el bancario corriente', !P.Intereses.includes('ibcEA') && !P.Intereses.includes('intereses-ibc'));
check('las exportaciones llevan la tabla de tramos', P.Intereses.includes("'Interés del tramo'") && junto(P.Intereses).includes(junto('filas: resultado.tramos.map(')));
check('si el corte pasa de la última certificación, la tarjeta dice hasta dónde se liquidó', P.Intereses.includes('Liquidado hasta'));

check('los ejemplos de dinero son ceros',P.Intereses.includes('placeholder="$0.000.000"') && P.Cuantia.includes('placeholder="$0.000.000"') && P.Liquidacion.includes('placeholder="$0.000.000"') && P.Indexacion.includes('placeholder="$0.000.000"'));
check('los ejemplos de tasas e índices son ceros', P.Intereses.includes('placeholder="00,00"') && P.Indexacion.includes('placeholder="000,00"'));
check('la vacancia del contador sale del servidor o del desglose, no de una fecha fija', !/diciembre|enero/.test(P.Terminos));

/* ─── 6. EL BLOQUE DE CSS ────────────────────────────────────────────────── */
const CSS = readFileSync(join(SRC, 'design', 'cara-nueva.css'), 'utf8');
const MARCA = '/* ─── Herramientas ─── */';
const FIN = '/* ─── fin Herramientas ─── */';
const inicio = CSS.indexOf(MARCA);
const fin = CSS.indexOf(FIN);
check('cara-nueva.css tiene el bloque de Herramientas con su cierre', inicio !== -1 && fin > inicio);
const bloque = inicio === -1 || fin === -1 ? '' : CSS.slice(inicio + MARCA.length, fin).replace(/\/\*[\s\S]*?\*\//g, ' ');
const reglas = new Map<string, string>();
const sueltos: string[] = [];
const ajenos: string[] = [];
const guiones: string[] = [];
const monos: string[] = [];
const oros: string[] = [];
const rojos: string[] = [];
for (const m of bloque.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const cabeza = m[1].replace(/@media[^{]*\{/g, '').trim();
  const cuerpo = m[2];
  for (const sel of cabeza.split(',').map((s) => s.trim()).filter(Boolean)) {
    reglas.set(sel, `${reglas.get(sel) ?? ''}${cuerpo}`);
    const bien =
      sel.startsWith('.cara-nueva') ||
      sel.startsWith(":root:not([data-theme='light']) .cara-nueva") ||
      sel.startsWith(":root[data-theme='dark'] .cara-nueva");
    if (!bien) sueltos.push(sel);
    if (!/cn-her/.test(sel)) ajenos.push(sel);
    if (/dashed/.test(cuerpo) && !/--sin-verificar/.test(sel)) guiones.push(sel);
    if (/var\(--mono\)|monospace/.test(cuerpo) && !/cn-her-(mono|cifra)/.test(sel)) monos.push(sel);
    if (/--gold/.test(cuerpo)) oros.push(sel);
    if (/var\(--danger\)/.test(cuerpo) && !/--peligro|cn-her-error/.test(sel)) rojos.push(sel);
  }
}
const regla = (sel: string): string => reglas.get(sel) ?? '';
check('todo selector del bloque vive bajo .cara-nueva', bloque !== '' && sueltos.length === 0, sueltos.join(' · '));
check('todo selector del bloque es de cn-her', bloque !== '' && ajenos.length === 0, ajenos.join(' · '));
check('el borde discontinuo solo es de lo que no está verificado', guiones.length === 0, guiones.join(' · '));
check('el mono solo es de lo citable', monos.length === 0, monos.join(' · '));
check('el oro no aparece', oros.length === 0, oros.join(' · '));
check('el rojo es de lo destructivo y del error', rojos.length === 0, rojos.join(' · '));
const chicos = [...bloque.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1])).filter((n) => n < 14);
check('ningún tamaño del bloque baja de 14 px', bloque !== '' && chicos.length === 0, chicos.join(', '));
check(
  'el bloque trae su modo oscuro por los dos caminos',
  bloque.includes(":root:not([data-theme='light']) .cara-nueva") && bloque.includes(":root[data-theme='dark'] .cara-nueva")
);
for (const sel of ['.cara-nueva .cn-her-boton', '.cara-nueva .cn-her-volver', '.cara-nueva .cn-her-tarjeta', '.cara-nueva .cn-her-opcion', '.cara-nueva .cn-her-icono']) {
  check(`${sel} mide al menos 44 px`, /min-height:\s*(4[4-9]|[5-9]\d)px/.test(regla(sel)), regla(sel));
}
check('en el teléfono las dos columnas se apilan', /grid-template-columns:\s*minmax\(0,\s*1fr\)/.test(regla('.cara-nueva .cn-her-columnas')) || /@media \(max-width: 860px\)\s*\{[^@]*cn-her-columnas[^}]*minmax\(0, 1fr\)/.test(bloque));
check('la tarjeta en tinta tiene su color en oscuro', /--her-tinta/.test(bloque) && bloque.includes(":root[data-theme='dark'] .cara-nueva.cn-her"));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
