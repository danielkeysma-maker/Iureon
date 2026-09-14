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
  'InformeDelEscritoPropio.tsx': INFORME
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
    'Volver a revisar · ',
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
check('el puente conserva la guía y la rama de la candidata', PUENTE.includes('<GuiaEligeActuacionDialog') && PUENTE.includes('onElegir={(exactName, branch)') && PUENTE.includes('branch || rama'));
check(
  'la lectura conserva la atribución de cada carga y el plazo ausente',
  ['Esta carga no es suya.', ': le corresponde a usted.', 'El documento no anuncia plazo para esta carga.', 'Qué le exige y para cuándo', 'Qué exige el documento y para cuándo'].every((t) => LECTURA.includes(t))
);
check('el ejemplo del cliente es un molde a la vista', DIALOGO.includes('placeholder="Nombre del cliente · asunto · rad. 00000-00-00-000-0000-00000-00"'));

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
for (const id of ['amarillo', 'verde', 'azul', 'rosa', 'tachado']) {
  check(`el bloque pinta «${id}»`, bloque.includes(`.cara-nueva .cn-tal-capa--${id} {`));
}

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
