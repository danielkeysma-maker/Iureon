/**
 * Guarda la cara nueva del taller y del informe de revisión —el taller de un
 * escrito, el visor del original, el diálogo «Revisar un documento», la banda
 * de la comprobación automática y las dos lecturas del informe— contra lo que
 * las maquetas prometen y el producto no hace, y contra lo que la piel no puede
 * tumbar.
 *
 * Run with: npm run check:taller-cara
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * `public/handoff/app-informe-de-revision.html` y los artboards del taller de
 * `app-redaccion-revision.html` se dibujaron con frases que el código no
 * sostiene: «estas advertencias se retiran cuando se corrija lo que señalan»
 * (nada las retira), una marca «no se pudo dar por comprobada» sobre un
 * hallazgo (lo no comprobado solo se cuenta en la banda), un botón «Buscar en
 * el escrito» que no existe, significados para los colores del resaltador
 * («Importante», «Por comprobar»…) que el producto no tiene, versiones con un
 * motivo inventado, páginas que el informe no conoce, y ejemplos jurídicos
 * verosímiles. Copiarlos no rompe nada: por eso se vigilan aquí.
 *
 * Y lo estructural: los dos estratos del informe —lo que exige la norma y el
 * criterio del revisor— rotulados una vez y en su orden, «Ir al punto» solo
 * cuando hay un punto, los identificadores de color que viajan a la base y a la
 * guía, y el bloque de CSS dentro de `.cara-nueva` con sus dos modos oscuros.
 *
 * Se leen los componentes como TEXTO y sin comentarios: los comentarios que
 * explican por qué algo no se pinta contienen la frase que no se pinta.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ComprobacionesDelInforme } from '../services/review.api';
import { marcasDelHallazgo } from '../services/comprobaciones';
import { primerLugarMarcado } from '../components/ComprobacionAutomatica';
import { destinoDelTabulador } from '../components/LecturaAmpliaDelInforme';
import { cintaSeEscondeEnElTelefono } from '../services/cintaDelGuardado';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const leer = (ruta: string): string => sinComentarios(readFileSync(join(SRC, ruta), 'utf8'));
const cuenta = (texto: string, aguja: string): number => texto.split(aguja).length - 1;

const C = 'modules/workspace/components/';
const TALLER = leer(`${C}TallerDeEscrito.tsx`);
const BORRADOR = leer(`${C}TallerDeBorrador.tsx`);
const REVISION = leer(`${C}TallerDeRevision.tsx`);
const VISOR = leer(`${C}VisorDelOriginal.tsx`);
const LECTURA = leer(`${C}LecturaDelDocumentoRecibido.tsx`);
const PUENTE = leer(`${C}PuenteAlAtaque.tsx`);
const DIALOGO = leer(`${C}RevisarEscritoDialog.tsx`);
const BANDA = leer(`${C}ComprobacionAutomatica.tsx`);
const INFORME = leer(`${C}InformeDelEscritoPropio.tsx`);
const AMPLIA = leer(`${C}LecturaAmpliaDelInforme.tsx`);
const API = readFileSync(join(SRC, 'modules/workspace/services/review.api.ts'), 'utf8');

const PANTALLAS: Record<string, string> = {
  'TallerDeEscrito.tsx': TALLER,
  'TallerDeBorrador.tsx': BORRADOR,
  'TallerDeRevision.tsx': REVISION,
  'VisorDelOriginal.tsx': VISOR,
  'LecturaDelDocumentoRecibido.tsx': LECTURA,
  'PuenteAlAtaque.tsx': PUENTE,
  'RevisarEscritoDialog.tsx': DIALOGO,
  'ComprobacionAutomatica.tsx': BANDA,
  'InformeDelEscritoPropio.tsx': INFORME,
  'LecturaAmpliaDelInforme.tsx': AMPLIA
};

/* ─── 1. LAS RAÍCES LLEVAN LA CARA NUEVA ────────────────────────────────── */
check('el taller abre el alcance en su raíz (se monta fuera de toda pantalla rediseñada)', TALLER.includes('className={`cara-nueva cn-tal '));
check('el informe del taller es un contenedor con ancla de salto', TALLER.includes('className="cn-inf" data-informe'));
check('el formulario del diálogo lleva la cara nueva', DIALOGO.includes('className="cara-nueva cn-inf-form"'));
check('el informe del diálogo lleva la cara nueva y el ancla de salto', DIALOGO.includes('className="cara-nueva cn-inf" data-informe'));
check('la pregunta de guardado lleva la cara nueva', DIALOGO.includes('className="cara-nueva cn-inf-dialogo-texto"'));
check('la confirmación del taller de revisión, montada fuera del taller, abre su propio alcance', REVISION.includes('className="cara-nueva cn-inf-dialogo-texto"'));
check('el visor del original viste su barra y su mesa', VISOR.includes('className="cn-tal-herramientas"') && VISOR.includes('cn-tal-mesa'));
check('el puente al ataque viste su bloque', PUENTE.includes('className="cn-inf-puente'));
check('la lectura del documento recibido viste sus cargas y flancos', LECTURA.includes('cn-inf-carga') && LECTURA.includes('cn-inf-flanco'));
check('las pantallas no tocan los tres diálogos de la próxima unidad', !/(GuiaEligeActuacionDialog|ActuacionPropiaDialog|EscritoSinNombreDialog)\.tsx/.test(Object.values(PANTALLAS).join('\n')));

/* ─── 2. LO QUE LA MAQUETA PROMETE Y EL PRODUCTO NO HACE ───────────────── */
const PROHIBIDAS: [string, RegExp, string][] = [
  ['«se retiran cuando se corrija»', /se retiran cuando se corrija/i, 'nada retira una advertencia'],
  ['una marca «no se pudo dar por comprobada»', /no se pudo dar por comprobada/i, 'lo no comprobado se cuenta en la banda, no se marca'],
  ['«Buscar en el escrito»', /Buscar en el escrito/i, 'ese botón no existe'],
  ['los significados de los colores', /\b(Importante|Por comprobar|Confirmado|Discutible)\b/, 'el resaltador no tiene significados'],
  ['un motivo de versión inventado', /reemplazos aplicados/i, 'las versiones muestran su motivo real'],
  ['páginas del escrito', /\b\d+\s+p[aá]ginas\b|\bp[aá]gina\s+\d/i, 'el informe no conoce páginas'],
  ['contadores de requisitos', /requisitos que s[ií] est[aá]n|que no se pudieron comprobar/i, 'los tres grupos navegables del README están retirados'],
  ['el cruce con pasajes escrito a mano', /Se cruz[oó] con/, 'lo dice `lineaDePasajes` y solo con pasajes > 0'],
  ['precios escritos a mano', /\$\s?\d/, 'los precios salen de `pesos()` y $2.000 es un piso'],
  ['ejemplos jurídicos verosímiles', /C\. Restrepo|J\. [ÁA]vila|Sincelejo|tres \(3\) d[ií]as|REQUI[ÉE]RASE|Juramento estimatorio|diez d[ií]as|art\. 384|Joel Ay[úu]s|Sanitas|2026-00345|Mosquera/, 'README-app §3: moldes a la vista']
];
for (const [nombre, codigo] of Object.entries(PANTALLAS)) {
  for (const [que, re, por] of PROHIBIDAS) {
    const m = codigo.match(re);
    check(`${nombre} no pinta ${que}`, !m, m ? `«${m[0]}» — ${por}` : '');
  }
}

/* ─── 3. LO NO COMPROBADO SOLO SE CUENTA ────────────────────────────────── */
{
  const base = (clase: 'DEROGADA' | 'NO_COMPROBADA', donde: ComprobacionesDelInforme['articulos'][number]['dondeAparece']) => ({
    codigo: 'NORMA',
    norma: 'Norma 0',
    articulo: 0,
    vigencia: { estado: clase === 'DEROGADA' ? ('DEROGADO' as const) : ('NO_VERIFICABLE' as const), detalle: '', fuentes: [], consultadoEn: '' },
    glosa: null,
    glosas: [],
    clases: [clase],
    mensajes: [{ clase, texto: 'mensaje' }],
    dondeAparece: donde
  });
  const c: ComprobacionesDelInforme = {
    articulos: [
      base('NO_COMPROBADA', [{ seccion: 'debilidades', indice: 0 }]),
      base('DEROGADA', []),
      base('DEROGADA', [{ seccion: 'erroresDeAplicacion', indice: 1, campo: 'problema' }])
    ],
    cuenta: { derogada: 2, modulada: 0, fuentesEnDesacuerdo: 0, noLoDiceElArticulo: 0, noComprobada: 1 },
    avisos: [],
    vigenciaComprobada: true,
    glosaComprobada: true
  };
  check('un artículo no comprobado CON lugar no marca el hallazgo', marcasDelHallazgo(c, 'debilidades', 0).length === 0);
  check('y su fila de la banda no ofrece «Ir al punto»', primerLugarMarcado(c, 'NO_COMPROBADA') === null);
  const lugar = primerLugarMarcado(c, 'DEROGADA');
  check(
    '«Ir al punto» salta al primer hallazgo donde la clase tiene marca, saltándose el artículo sin lugar',
    lugar?.seccion === 'erroresDeAplicacion' && lugar.indice === 1,
    JSON.stringify(lugar)
  );
  check('sin comprobaciones no hay punto', primerLugarMarcado(null, 'DEROGADA') === null);
}
check(
  '«Ir al punto» solo se pinta cuando hay lugar',
  /\{lugar && \(\s*<button[\s\S]{0,200}?\)\}>\s*Ir al punto\s*<\/button>/.test(BANDA) && cuenta(Object.values(PANTALLAS).join('\n'), 'Ir al punto') === 1
);
check(
  'cada hallazgo lleva el ancla que busca el salto',
  cuenta(INFORME, 'data-hallazgo={anclaDelHallazgo(') >= 4 && BANDA.includes('data-hallazgo={anclaDelHallazgo(seccion, i)}') && BANDA.includes("closest('[data-informe]')")
);

/* ─── 4. LOS DOS ESTRATOS, ROTULADOS UNA VEZ Y EN SU ORDEN ─────────────── */
{
  const orden = [
    'Resumen',
    'Lo que exige la norma',
    'Secciones que la norma exige y faltan',
    'Errores de aplicación',
    'Correcciones textuales',
    'Criterio del revisor',
    'titulo="Debilidades"',
    'titulo="Fortalezas"',
    'titulo="Recomendaciones"'
  ];
  const posiciones = orden.map((t) => INFORME.indexOf(t));
  check(
    'resumen arriba; norma: faltantes → errores → correcciones; criterio: debilidades → fortalezas → recomendaciones',
    posiciones.every((p, i) => p !== -1 && (i === 0 || p > posiciones[i - 1])),
    posiciones.join(' ')
  );
  check('cada estrato se rotula una sola vez', cuenta(INFORME, 'Lo que exige la norma') === 1 && cuenta(INFORME, 'Criterio del revisor') === 1);
  for (const [nombre, codigo] of [
    ['TallerDeEscrito.tsx', TALLER],
    ['RevisarEscritoDialog.tsx', DIALOGO]
  ]) {
    check(`${nombre} usa la pieza compartida y no rotula los estratos por su cuenta`, codigo.includes('<InformeDelEscritoPropio') && !/Lo que exige la norma|Criterio del revisor/.test(codigo));
  }
  check('el diálogo lee las correcciones completas y el taller solo las que traen advertencia', DIALOGO.includes('correcciones="completas"') && TALLER.includes('correcciones="solo-con-advertencia"'));
  check('la cita del abogado no lleva marca: la marca va después del problema', INFORME.indexOf('«{co.cita}»') < INFORME.indexOf('seccion="correccionesTextuales" indice={k}'));
  check(
    'secciones vacías: la norma dice «Sin hallazgos en esta sección»; el criterio no se pinta',
    BANDA.includes("if (items.length === 0 && estrato === 'criterio') return null;") && cuenta(INFORME, 'Sin hallazgos en esta sección') === 2 && cuenta(BANDA, 'Sin hallazgos en esta sección') === 1
  );
  check('un informe viejo sin correcciones no dice «sin hallazgos» de lo que nunca se pidió', INFORME.includes('i.correccionesTextuales !== undefined'));
}

/* ─── 5. LOS COLORES DEL RESALTADOR SON LOS DE SIEMPRE ─────────────────── */
{
  check('el tipo de la anotación conserva sus seis identificadores', API.includes("color: 'amarillo' | 'verde' | 'azul' | 'rosa' | 'tachado' | 'comentario';"));
  const ids = [...TALLER.matchAll(/\{ id: '([a-z]+)'/g)].map((m) => m[1]);
  check('el resaltador ofrece los mismos cinco, en su orden', ids.join(',') === 'amarillo,verde,azul,rosa,tachado', ids.join(','));
  for (const id of ['amarillo', 'verde', 'azul', 'rosa', 'tachado']) {
    check(`«${id}» se pinta con su clase`, TALLER.includes(`clase: 'cn-tal-capa--${id}'`));
  }
  check('el rótulo accesible dice el color, no un significado', ['Resaltar en amarillo', 'Resaltar en verde', 'Resaltar en azul', 'Resaltar en rosa'].every((t) => TALLER.includes(t)));
}

/* ─── 6. LO QUE LA PIEL NO PUEDE TUMBAR ─────────────────────────────────── */
check(
  'el taller conserva todas sus acciones',
  [
    "'Con marcas'",
    "'Editar'",
    "'Original'",
    '<ControlDeLetra',
    'Guardar versión',
    'Limpiar',
    'Word',
    'PDF',
    'Llevar a Redacción',
    'Pantalla completa',
    'Volver',
    /* El rótulo, sin la cifra pegada: el precio va aparte porque la talla del teléfono lo pinta en su propio renglón. Que la cifra siga ahí lo vigila la sección 11. */
    'Volver a revisar',
    'Restaurar esta versión',
    'Volver al actual',
    'Aplicar reemplazo',
    'Comentar',
    'Preguntar a la guía',
    'Resolver',
    "'Escrito' : 'Guía'",
    '<VisorDelOriginal',
    '<ConfirmarDialog'
  ].every((t) => TALLER.includes(t))
);
check('lo que se pega pasa por el limpiador, en el reemplazo y en las ediciones de la guía', cuenta(TALLER, 'reemplazoParaPegar(') === 2);
check(
  'la letra del papel sigue llegando de la firma y del control de letra',
  TALLER.includes('estiloDelLienzo(formato)') && TALLER.includes("useTamanoDeLetra('taller')") && cuenta(TALLER, 'style={estiloDelPapel}') === 3
);
check('«Volver a revisar» sigue sin ofrecerse sobre un documento recibido', REVISION.includes('onRerevisar={datos.revisionId && !datos.informeRecibido ?'));
check(
  'el diálogo conserva los dos modos, la pregunta de guardado y sus dos respuestas',
  ["'ESCRITO_PROPIO'", "'DOCUMENTO_RECIBIDO'", 'setPreguntaDeGuardado(true)', 'Solo el informe', 'Sí, conservar', '<SelectorDeExpediente', 'onElegir={(exactName, branch)'].every((t) => DIALOGO.includes(t))
);
check(
  'el selector de rama del puente es el de la cara nueva, en línea, y no el Combobox viejo',
  PUENTE.includes('<SelectorEnCascada') && PUENTE.includes('enLinea') && !PUENTE.includes('<Combobox') && !PUENTE.includes("from './Combobox'")
);
/*
 * LOS SELECTORES DEL DIÁLOGO «REVISAR UN DOCUMENTO». En producción (14/09/2026)
 * seguía la interfaz vieja: el `<select>` del sistema con su lista azul para el
 * caso y la posición, el `Combobox` viejo para la rama y la actuación, rótulos
 * en mayúsculas mono y «Cuesta $2.000» en mono. En escritorio va
 * `SelectorEnCascada` en línea; el `<select>` nativo solo existe en la rama de
 * teléfono de `SelectorDelFormulario`, vestido con `cn-red-select`.
 */
{
  const FORMULARIO = leer(`${C}SelectorDelFormulario.tsx`);
  const DE_EXPEDIENTE = leer('modules/expedientes/components/SelectorDeExpediente.tsx');
  const inicioNueva = DE_EXPEDIENTE.indexOf("if (cara === 'nueva')");
  const caraNueva = inicioNueva === -1 ? '' : DE_EXPEDIENTE.slice(inicioNueva, DE_EXPEDIENTE.indexOf('\n  return (', inicioNueva));
  /* La rama de escritorio: desde `if (ancha)` hasta donde empieza la del teléfono. */
  const desdeAncha = FORMULARIO.indexOf('if (ancha)');
  const hastaTelefono = FORMULARIO.indexOf('const bloques');
  const antesDelTelefono = desdeAncha !== -1 && hastaTelefono > desdeAncha ? FORMULARIO.slice(desdeAncha, hastaTelefono) : '';
  check('el diálogo de revisión no pinta ningún <select> nativo propio', !/<select\b/.test(DIALOGO));
  check('el diálogo de revisión no usa el Combobox viejo', !DIALOGO.includes('<Combobox') && !DIALOGO.includes("from './Combobox'"));
  check(
    'rama, actuación y posición del diálogo van por el selector del formulario; el caso, con la cara nueva',
    cuenta(DIALOGO, '<SelectorDelFormulario') === 3 && DIALOGO.includes('cara="nueva"') && DIALOGO.includes('conBusqueda={false}') && DIALOGO.includes('ordenarParaLaLista(')
  );
  check(
    'en escritorio el selector del formulario es SelectorEnCascada en línea, y el nativo del teléfono lleva cn-red-select',
    FORMULARIO.includes('useVentanaAncha()') && /if \(ancha\)[\s\S]*<SelectorEnCascada[\s\S]*enLinea/.test(antesDelTelefono) && !/<select\b/.test(antesDelTelefono) && FORMULARIO.includes('className="cn-red-select"')
  );
  check(
    'la cara nueva del caso usa el selector del formulario, sin rótulo en mayúsculas mono ni «— sin expediente —»',
    caraNueva.includes('<SelectorDelFormulario') && !/uppercase|font-mono|<select\b|— sin expediente —/.test(caraNueva)
  );
  check('ningún rótulo del diálogo va en mayúsculas mono', !/uppercase|font-mono/.test(DIALOGO) && !/uppercase|font-mono/.test(FORMULARIO));
  check('el pie del diálogo dice «Desde» el piso, sin mono', DIALOGO.includes('Desde <span className="cn-inf-costo-cifra">{pesos(precioCop)}</span> de su saldo') && !DIALOGO.includes('Cuesta ${pesos('));
}
check(
  'el puente conserva la casilla «No sé la rama» y su advertencia de costo',
  PUENTE.includes('No sé la rama: buscar en todo el catálogo.') && PUENTE.includes('{LO_QUE_CUESTA_BUSCAR_EN_TODO}')
);
check('el puente conserva la guía y la rama de la candidata',PUENTE.includes('<GuiaEligeActuacionDialog') && PUENTE.includes('onElegir={(exactName, branch)') && PUENTE.includes('branch || rama'));
check(
  'la lectura conserva la atribución de cada carga y el plazo ausente',
  ['Esta carga no es suya.', ': le corresponde a usted.', 'El documento no anuncia plazo para esta carga.', 'Qué le exige y para cuándo', 'Qué exige el documento y para cuándo'].every((t) => LECTURA.includes(t))
);
check('el ejemplo del cliente es un molde a la vista', DIALOGO.includes('placeholder="Nombre del cliente · asunto · rad. 00000-00-00-000-0000-00000-00"'));

/* ─── 6b. EL INFORME, LEÍDO FUERA DE LA COLUMNA ─────────────────────────── */
{
  /* La barra y el panel del informe, como texto: el botón tiene que vivir ahí y no en otra pestaña. */
  const desde = TALLER.indexOf('const BarraDelInforme');
  const hasta = TALLER.indexOf('const ComentariosPanel');
  const panelDelInforme = desde !== -1 && hasta > desde ? TALLER.slice(desde, hasta) : '';
  check('«Leer en grande» vive en la barra del panel del informe, y una sola vez', panelDelInforme.includes('Leer en grande') && cuenta(TALLER, 'Leer en grande') === 1);
  check('el panel del informe monta la barra', /const InformePanel = \(\) => \([\s\S]{0,120}\{BarraDelInforme\(\)\}/.test(TALLER));
  check(
    'el mismo panel es el de la pestaña «Informe» del teléfono (no hay una segunda vista del informe)',
    /vistaMovil === 'revisor' \? 'flex' : 'hidden'[\s\S]{0,1600}panel === 'informe' \? InformePanel\(\)/.test(TALLER) && cuenta(TALLER, 'InformePanel()') === 1
  );
  check(
    'la lectura amplia pinta el MISMO contenido: una función, dos llamadas, y cada pieza del informe una sola vez',
    cuenta(TALLER, '{ContenidoDelInforme()}') === 2 && cuenta(TALLER, '<InformeDelEscritoPropio') === 1 && cuenta(TALLER, '<LecturaDelDocumentoRecibido') === 1 && TALLER.includes('<LecturaAmpliaDelInforme')
  );
  check('el diálogo amplio no copia marcado del informe', !/InformeDelEscritoPropio|LecturaDelDocumentoRecibido|cn-inf-h2|cn-inf-estrato|Lo que exige la norma/.test(AMPLIA));
  check('es un diálogo modal rotulado por su título', AMPLIA.includes('role="dialog" aria-modal="true" aria-labelledby={idDelTitulo}') && AMPLIA.includes('id={idDelTitulo}'));
  check('Esc cierra, y solo cuando no hay otro diálogo encima', AMPLIA.includes("e.key === 'Escape'") && AMPLIA.includes('hayOtroDialogoEncima('));
  check('bloquea el desplazamiento del fondo y devuelve el foco a quien lo abrió', AMPLIA.includes("document.body.style.overflow = 'hidden'") && AMPLIA.includes('invocador?.focus'));
  check('se monta en el cuerpo del documento con su propio alcance de la cara nueva', AMPLIA.includes('createPortal(') && AMPLIA.includes('className="cara-nueva cn-inf-amplio"'));
  check(
    '«Ir al punto» queda dentro del diálogo: el cuerpo es su propio ancla de informe',
    AMPLIA.includes('className="cn-inf cn-inf--amplio" data-informe') && BANDA.includes("closest('[data-informe]')")
  );
  check('ningún diálogo nativo', !/window\.(confirm|alert|prompt)\(/.test(AMPLIA + TALLER));
  /* La trampa del tabulador, como función pura. */
  check('Tab desde el último vuelve al primero', destinoDelTabulador(5, 4, false) === 0);
  check('Mayús+Tab desde el primero va al último', destinoDelTabulador(5, 0, true) === 4);
  check('con el foco fuera de lo enfocable, Tab entra al primero y Mayús+Tab al último', destinoDelTabulador(3, -1, false) === 0 && destinoDelTabulador(3, -1, true) === 2);
  check('en medio se deja al navegador', destinoDelTabulador(5, 2, false) === -1 && destinoDelTabulador(5, 2, true) === -1);
  check('sin nada enfocable no se mueve nada', destinoDelTabulador(0, -1, false) === -1);
}

/* ─── 7. LA ESCALA EMPIEZA EN 14 ────────────────────────────────────────── */
for (const [nombre, codigo] of Object.entries(PANTALLAS)) {
  const m = codigo.match(/text-\[(?:\d|1[0-3])(?:\.\d+)?px\]|\btext-(?:meta|label|ui)\b|\bbtn-sm\b|\bnotice-unverified\b/);
  check(`${nombre}: nada por debajo de 14 px ni piezas de la cara vieja`, !m, m?.[0] ?? '');
}

/* ─── 8. EL BLOQUE DE CSS NO SE SALE DE `.cara-nueva` ───────────────────── */
const CSS = readFileSync(join(SRC, 'design', 'cara-nueva.css'), 'utf8');
const MARCA = '/* ─── Taller e informe ─── */';
const inicio = CSS.indexOf(MARCA);
check('cara-nueva.css tiene el bloque del taller y el informe', inicio !== -1);
const siguiente = CSS.indexOf('/* ─── ', inicio + MARCA.length);
const bloque = CSS.slice(inicio, siguiente === -1 ? undefined : siguiente).replace(/\/\*[\s\S]*?\*\//g, ' ');
const sueltos: string[] = [];
const ajenos: string[] = [];
const guiones: string[] = [];
const papel: string[] = [];
const rojos: string[] = [];
for (const m of bloque.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const cabeza = m[1].replace(/@media[^{]*\{/g, '').trim();
  const cuerpo = m[2];
  for (const sel of cabeza.split(',').map((s) => s.trim()).filter(Boolean)) {
    const bien =
      sel.startsWith('.cara-nueva') ||
      sel.startsWith(":root:not([data-theme='light']) .cara-nueva") ||
      sel.startsWith(":root[data-theme='dark'] .cara-nueva");
    if (!bien) sueltos.push(sel);
    if (!/\.cn-(tal|inf)(-|\b)/.test(sel)) ajenos.push(sel);
    /* El guion es solo de «sin verificar»: sin ficha, no comprobada, sin plazo anunciado. */
    if (/dashed/.test(cuerpo) && !/cn-inf-sello--sin|cn-inf-banda-fila--no-comprobada|cn-inf-sin-plazo/.test(sel)) guiones.push(sel);
    /* La letra del papel no la toca la piel. */
    if (/cn-tal-hoja(?![\w-])|cn-tal-capa/.test(sel) && /font-(?:family|size)|line-height/.test(cuerpo)) papel.push(sel);
    /* El rojo es de lo destructivo: solo borrar una revisión. */
    if (/var\(--danger\)/.test(cuerpo) && !/cn-inf-borrar:hover/.test(sel)) rojos.push(sel);
  }
}
check('todo selector del bloque vive bajo .cara-nueva', sueltos.length === 0, sueltos.join(' · '));
check('todo selector del bloque es de cn-tal o cn-inf', ajenos.length === 0, ajenos.join(' · '));
check('el borde discontinuo solo aparece en lo que no está verificado', guiones.length === 0, guiones.join(' · '));
check('ninguna regla cambia la letra del papel', papel.length === 0, papel.join(' · '));
check('el rojo de peligro solo aparece en lo destructivo', rojos.length === 0, rojos.join(' · '));
const chicos = [...bloque.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1])).filter((n) => n < 14);
check('ningún tamaño del bloque baja de 14 px', chicos.length === 0, chicos.join(', '));
check(
  'el bloque trae su modo oscuro por los dos caminos',
  bloque.includes(":root:not([data-theme='light']) .cara-nueva") && bloque.includes(":root[data-theme='dark'] .cara-nueva")
);
check(
  'la lectura en grande vive en este bloque: hoja completa en el teléfono, diálogo centrado desde 768 px, prosa a 16 px',
  bloque.includes('.cara-nueva.cn-inf-amplio {') && bloque.includes('height: 100dvh;') && /@media \(min-width: 768px\)[\s\S]{0,400}max-width: 920px;/.test(bloque) && /\.cara-nueva \.cn-inf--amplio \{[^}]*font-size: 16px;/.test(bloque)
);
for (const id of ['amarillo', 'verde', 'azul', 'rosa', 'tachado']) {
  check(`el bloque pinta «${id}»`, bloque.includes(`.cara-nueva .cn-tal-capa--${id} {`));
}

/* ─── 9. EL DOCUMENTO CARGADO SE VE EN EL TELÉFONO ──────────────────────── */
/*
 * EL DEFECTO QUE ESTO VIGILA, MEDIDO. En 375×812, con la pestaña «Original»
 * abierta, las dos barras del taller —la de los modos y la del visor— se
 * envolvían en cuatro y dos renglones: 231 px y 123 px de los 430 px que la
 * columna del escrito tiene en ese teléfono. Al documento le quedaban 77 px
 * pegados al borde inferior. El PDF se pintaba; simplemente no había dónde
 * verlo, y se reportó como «el visor no se ve en móvil».
 *
 * Se vigila la CAUSA, no el síntoma: que en el teléfono la barra sea una sola
 * fila que se desliza y que ninguna de sus piezas encoja. Y se vigila que el
 * arreglo no se cuele al computador, donde envolver está bien y donde la barra
 * nunca ha tenido desplazamiento propio.
 */
const MOVIL = /@media \(max-width: 639px\) \{([\s\S]*?)\n\}/.exec(bloque)?.[1] ?? '';
check('el bloque del taller trae su regla de teléfono', MOVIL !== '');
check(
  'en el teléfono la barra del taller es una sola fila que se desliza, no cuatro renglones apilados',
  /\.cara-nueva \.cn-tal-herramientas \{[^}]*flex-wrap: nowrap;[^}]*overflow-x: auto;/.test(MOVIL)
);
check(
  'ninguna pieza de esa barra encoge: lo que no cabe se alcanza deslizando',
  /\.cara-nueva \.cn-tal-herramientas > \* \{[^}]*flex: none;/.test(MOVIL)
);
check(
  'el nombre del archivo se recorta en vez de empujar las páginas y el zoom fuera de la pantalla',
  /\.cara-nueva \.cn-tal-visor-nombre \{[^}]*max-width: 42vw;/.test(MOVIL)
);
check(
  'el computador conserva sus barras envueltas y sin desplazamiento propio',
  !/\.cara-nueva \.cn-tal-herramientas \{[^}]*overflow-x/.test(bloque.replace(MOVIL, ' '))
);
/*
 * Y LO QUE NO SE PUEDE PINTAR SE DICE, CON LAS DOS SALIDAS QUE EL TELÉFONO SÍ
 * TIENE. Un `.doc` de Word 97 no se abre en ningún navegador; dejar el área en
 * blanco enseña que el visor está roto.
 */
check(
  'el archivo sin visor lo dice y ofrece abrirlo en otra pestaña y descargarlo, nunca un área en blanco',
  VISOR.includes('Este archivo no se puede mostrar aquí.') && VISOR.includes('Abrir en otra pestaña') && VISOR.includes('Descargar el archivo')
);

/* ─── 10. LA CINTA DEL GUARDADO CEDE ALTURA, PERO NUNCA ESCONDE MALAS NOTICIAS ─ */
/*
 * EL DEFECTO QUE ESTO VIGILA, MEDIDO. En 375×812 la cinta que dice dónde queda
 * el texto ocupaba 83 px encima del documento, y en la pestaña «Original» esos
 * 83 px salen del visor. El titular decidió el 16 de septiembre de 2026
 * devolvérselos al documento en el teléfono, porque el taller guarda solo y
 * repetir en cada renglón que guarda no le dice nada nuevo al abogado.
 *
 * La regla no es «esconder la cinta en el teléfono»: es esconderla SOLO cuando
 * lo que dice es tranquilizador y cierto. En cuanto el estado cambia lo que el
 * abogado puede dar por sentado —«solo en esta sesión», «no se pudo guardar»,
 * «las versiones nuevas ya no caben»— o cuando la cinta trae un botón, la cinta
 * se queda. Esconder ahí no sería ahorrar altura: sería ocultar la mala
 * noticia.
 *
 * Por eso se vigila la FUNCIÓN PURA que decide, estado por estado, y no el
 * dibujo: una regla de CSS que tapara `.cn-tal-cinta` en el teléfono pasaría
 * cualquier inspección visual y escondería el «no se pudo guardar».
 */
const CINTA_SEGURA = { activo: true, versionesNoCaben: false, hayAccion: false } as const;
for (const estado of ['quieto', 'guardando', 'guardado'] as const) {
  check(`en el teléfono la cinta cede su altura cuando el texto sí se guarda («${estado}»)`, cintaSeEscondeEnElTelefono({ ...CINTA_SEGURA, estado }) === true);
}
check('la cinta se queda cuando no se pudo guardar el último cambio', cintaSeEscondeEnElTelefono({ ...CINTA_SEGURA, estado: 'fallo' }) === false);
check('la cinta se queda cuando las versiones nuevas ya no caben', cintaSeEscondeEnElTelefono({ ...CINTA_SEGURA, versionesNoCaben: true, estado: 'guardado' }) === false);
check('la cinta se queda cuando el texto vive solo en esta sesión', cintaSeEscondeEnElTelefono({ ...CINTA_SEGURA, activo: false, estado: 'quieto' }) === false);
check('la cinta se queda cuando trae un botón que solo vive en ella', cintaSeEscondeEnElTelefono({ ...CINTA_SEGURA, hayAccion: true, estado: 'guardado' }) === false);
/* El estado manda: el componente pinta la clase desde la función, no desde el ancho. */
check('el taller decide con esa función y no con una regla que tape la cinta entera', TALLER.includes('cintaSeEscondeEnElTelefono({') && TALLER.includes('cn-tal-cinta--oculta'));
check(
  'la información queda a un toque: un botón en la barra del escrito vuelve a mostrar la cinta',
  TALLER.includes('Dónde queda el texto') && TALLER.includes('aria-expanded={cintaALaVista}')
);
check('en el teléfono solo se tapa la cinta marcada, nunca todas', /\.cara-nueva \.cn-tal-cinta--oculta \{[^}]*display: none;/.test(MOVIL));
check(
  'ninguna regla tapa la cinta por el ancho solo',
  !/\.cara-nueva \.cn-tal-cinta \{[^}]*display: none;/.test(bloque)
);

/* ─── 11. «VOLVER A REVISAR» CEDE ANCHO Y ALTO, PERO NUNCA EL PRECIO ────── */
/*
 * EL DEFECTO QUE ESTO VIGILA, MEDIDO. En 375×812 el botón medía 217 px en un
 * solo renglón y no cabía en la cabecera junto a «Volver» y al título: la
 * cabecera se partía en dos filas y la segunda —44 px de botón más 8 px de
 * separación— salía del documento. El titular pidió el 16 de septiembre de 2026
 * devolvérselos, como se le devolvieron los 83 px de la cinta. Medido ese día:
 * `.cn-tal-mesa` pasó de 323 px a 375 px en 375×812, y de 175 px a 227 px en
 * 390×664; la cabecera, de 118 px a 66 px.
 *
 * Los 52 px salen de MUDAR el botón, no de encogerlo donde estaba: en el
 * teléfono se va a la fila de «Escrito / Guía», que ya existía, que se ve en
 * las DOS vistas del teléfono —la barra del escrito desaparece al pasar a
 * «Guía»— y que no crece por acogerlo. Ahí se pinta en dos renglones.
 *
 * LO QUE NO SE PUEDE PERDER POR GANAR ALTURA ES EL PRECIO. En el teléfono este
 * botón es el único sitio donde el abogado ve lo que va a costar antes de
 * autorizar el cobro. Por eso se vigila que la cifra siga saliendo del precio
 * que llega por props —nunca escrita a mano—, que se diga como la dicen el
 * diálogo y el manual («desde», porque $2.000 es el piso), y que llegue al
 * NOMBRE ACCESIBLE y no solo al dibujo: un lector de pantalla no ve renglones.
 */
{
  check(
    'el botón de revisar se arma una sola vez y se pide en dos tallas',
    TALLER.includes('const BotonDeRerevisar = (compacto: boolean)') && cuenta(TALLER, 'BotonDeRerevisar(') === 2
  );
  check(
    'en el teléfono va la talla compacta, en la fila de «Escrito / Guía»; desde 640 px, la de siempre en la cabecera',
    TALLER.includes('<span className="cn-tal-vistas-accion sm:hidden">{BotonDeRerevisar(true)}</span>') &&
      TALLER.includes('<span className="hidden sm:inline-flex">{BotonDeRerevisar(false)}</span>')
  );
  check(
    'la talla compacta apila qué hace y cuánto cuesta: ninguno de los dos renglones se cae',
    TALLER.includes('<span className="cn-tal-rerevisar-que">{rotuloDeRerevisar}</span>') &&
      TALLER.includes('<span className="cn-tal-rerevisar-costo">desde {pesos(precioRevisionCop)}</span>')
  );
  check(
    'la cifra sale del precio que llega por props, nunca escrita a mano en el botón',
    !/\$\s?2[.,]000/.test(TALLER) && cuenta(TALLER, 'pesos(precioRevisionCop)') >= 4
  );
  check(
    'el nombre accesible dice qué hace y cuánto cuesta, en las dos tallas',
    TALLER.includes("aria-label={ocupado === 'revision' ? 'Revisando el escrito' : `${rotuloDeRerevisar}, desde ${pesos(precioRevisionCop)} de su saldo`}")
  );
  check(
    'la talla compacta no baja de 14 px en ninguno de sus dos renglones',
    /\.cara-nueva \.cn-tal-rerevisar-que \{[^}]*font-size: 14px;/.test(bloque) && /\.cara-nueva \.cn-tal-rerevisar-costo \{[^}]*font-size: 14px;/.test(bloque)
  );
  const renglones = [...bloque.matchAll(/\.cara-nueva \.cn-tal-rerevisar-(?:que|costo) \{[^}]*line-height: (\d+)px;/g)].map((m) => Number(m[1]));
  check(
    'los dos renglones caben en los 44 px que la regla del pulgar le da al botón',
    renglones.length === 2 && renglones.reduce((a, b) => a + b, 0) <= 44 && /@media \(pointer: coarse\) \{\s*\.cara-nueva \.cn-tal-boton,/.test(bloque),
    renglones.join('+')
  );
  check(
    'en el teléfono la cabecera vuelve a ser una sola fila y los textos ceden lo que les sobra',
    /\.cara-nueva \.cn-tal-cabeza \{[^}]*flex-wrap: nowrap;/.test(MOVIL) && /\.cara-nueva \.cn-tal-cabeza-textos \{[^}]*flex: 1 1 auto;/.test(MOVIL)
  );
  check(
    'en el teléfono la fila de «Escrito / Guía» acoge el botón sin crecer',
    /\.cara-nueva \.cn-tal-vistas \{[^}]*display: flex;/.test(MOVIL) && /\.cara-nueva \.cn-tal-vistas-accion \{[^}]*display: contents;/.test(MOVIL)
  );
  /* Y NADA DE ESTO SE CUELA AL COMPUTADOR, donde la cabecera envuelve y la fila de vistas ni siquiera existe desde 1024 px. */
  const SIN_MOVIL = bloque.replace(MOVIL, ' ');
  check(
    'el computador conserva su cabecera envuelta, su fila de vistas en bloque y sin envoltorio que borrar',
    !/\.cara-nueva \.cn-tal-cabeza \{[^}]*nowrap/.test(SIN_MOVIL) &&
      !/\.cara-nueva \.cn-tal-vistas \{[^}]*display: flex/.test(SIN_MOVIL) &&
      !SIN_MOVIL.includes('cn-tal-vistas-accion')
  );
}

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
