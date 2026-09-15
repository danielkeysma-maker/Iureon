import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * TODO DIÁLOGO, HOJA Y PANEL MODAL VA A 20 PX DE RADIO.
 *
 * Run with: npm run check:esquinas-dialogos
 *
 * ─── POR QUÉ ESTE ARCHIVO EXISTE ───────────────────────────────────────────
 *
 * El 14 de septiembre de 2026 el dueño fijó la regla: diálogos, confirmaciones,
 * hojas inferiores y paneles modales llevan esquinas de 20 px (en el teléfono,
 * la hoja inferior: 20 arriba y 0 abajo). Ese mismo día se cambió el marco
 * compartido `design/Dialog.tsx` y, aun así, aparecieron superficies con 6, 10,
 * 14 y 16 px: módulos que se construyen su propio modal o que pisan el marco
 * desde el CSS. Un radio se desalinea en silencio —nada falla, solo se ve
 * distinto—, y por eso lo vigila un check y no la memoria de nadie.
 *
 * ─── QUÉ MIRA Y QUÉ NO ─────────────────────────────────────────────────────
 *
 *  · En `cara-nueva.css`: las reglas de una LISTA MANTENIDA de selectores de
 *    superficies modales, y toda regla `[role='dialog'] > div:last-child` (el
 *    patrón con que un módulo —Audiencias, Herramientas— pisa el panel del
 *    marco compartido). Sin excepciones: el bloque de Herramientas, que estuvo
 *    excluido mientras otro trabajo lo editaba, ya se vigila como los demás.
 *  · En los componentes que arman su modal con clases de Tailwind: las clases
 *    de radio del elemento raíz del panel.
 *  · NO mira menús desplegables, tarjetas, campos, botones ni chips: no son
 *    superficies modales y conservan su propio radio.
 *
 * Una clase de la lista que desaparezca del CSS también falla: si alguien la
 * renombra, la superficie se saldría de la vigilancia sin que nadie lo note.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const leer = (ruta: string): string => readFileSync(join(SRC, ruta), 'utf8');

const MINIMO = 20;

/* ─── La lista mantenida ────────────────────────────────────────────────── */

/**
 * Clases de superficies modales que se pintan desde `cara-nueva.css`, con el
 * componente que las usa. Al crear un modal nuevo con CSS propio, se añade aquí.
 */
const SELECTORES_MODALES: ReadonlyArray<{ clase: string; componente: string }> = [
  { clase: 'cn-sal-panel', componente: 'modules/tenant/components/ActionConfirmationModal.tsx' },
  { clase: 'cn-man-dialogo-panel', componente: 'modules/help/components/DialogoDeAyuda.tsx' },
  { clase: 'cn-inf-amplio-panel', componente: 'modules/workspace/components/LecturaAmpliaDelInforme.tsx' },
  { clase: 'cn-hoja', componente: 'modules/tenant/components/MobileHeader.tsx' },
  { clase: 'cn-exp-menu--flotante', componente: 'modules/expedientes/components/MenuDeAcciones.tsx' },
  { clase: 'cn-vis-globo', componente: 'modules/inicio/visitaGuiada/VisitaGuiada.tsx' },
  { clase: 'cn-vis-hoja', componente: 'modules/inicio/visitaGuiada/VisitaGuiada.tsx' },
  { clase: 'cn-vis-hoja--arriba', componente: 'modules/inicio/visitaGuiada/VisitaGuiada.tsx' },
  { clase: 'cn-tal-hoja-comentario', componente: 'modules/workspace/components/TallerDeEscrito.tsx' },
  { clase: 'cn-bus-ficha-panel', componente: 'modules/search/components/SearchView.tsx' },
  { clase: 'cn-bus-hoja', componente: 'modules/search/components/SearchMobileView.tsx' },
  { clase: 'cn-cat-ficha-panel', componente: 'modules/catalog/components/CatalogCurationView.tsx' },
  /* Desde el 14 de septiembre de 2026 la hoja se monta en `document.body` desde su propio componente. */
  { clase: 'cn-cat-hoja', componente: 'modules/catalog/components/HojaSobreElTeclado.tsx' }
];

/**
 * Los envoltorios que pisan el panel del marco compartido con
 * `[role='dialog'] > div:last-child`. Deben existir en el CSS: si uno se
 * renombra, su override deja de estar a la vista de este check.
 */
const OVERRIDES_DEL_MARCO = ['cn-aud-dialogos', 'cn-her-dialogos', 'cn-adm-dialogos', 'cn-aju-dialogos', 'cn-plan-dialogos', 'cn-ope-dialogos', 'cn-est-dialogos', 'cn-cat-dialogos'];

/**
 * Modales armados con Tailwind: `ancla` es un trozo único del `className` del
 * panel raíz, para encontrarlo sin montar React.
 */
const COMPONENTES_MODALES: ReadonlyArray<{ ruta: string; ancla: string; que: string }> = [
  { ruta: 'design/Dialog.tsx', ancla: 'max-h-[76vh]', que: 'marco compartido de diálogos' },
  { ruta: 'modules/subscriptions/components/ModuloBloqueado.tsx', ancla: 'max-w-sm flex-col items-center', que: 'aviso de módulo bloqueado' },
  { ruta: 'modules/tenant/components/MobileMoreSheet.tsx', ancla: 'max-h-[75vh] overflow-y-auto', que: 'hoja «Todo lo demás»' }
  /*
   * La hoja de filtros del Buscador y la de verificación del Catálogo salieron de
   * aquí el 14 de septiembre de 2026: con la cara nueva se pintan desde el CSS
   * (`cn-bus-hoja`, `cn-cat-hoja`) y las vigila la lista de arriba.
   */
];

/* ─── Reglas, puras ─────────────────────────────────────────────────────── */

/** Radios en px de una declaración; `null` si trae algo que no se sabe medir. */
const radiosEnPx = (valor: string): number[] | null => {
  const partes = valor.split(/[\s/]+/).filter(Boolean);
  const px: number[] = [];
  for (const p of partes) {
    if (p === '0') px.push(0);
    else if (/^[\d.]+px$/.test(p)) px.push(Number(p.slice(0, -2)));
    else return null;
  }
  return px;
};

/** Un radio es válido si cada esquina es 0 (el borde que toca la pantalla) o al menos 20. */
const radioValido = (px: number[]): boolean => px.some((n) => n >= MINIMO) && px.every((n) => n === 0 || n >= MINIMO);

const esSelectorModal = (selector: string): boolean =>
  /\[role=['"]dialog['"]\]\s*>\s*div:last-child$/.test(selector) ||
  SELECTORES_MODALES.some(({ clase }) => new RegExp(`\\.${clase.replace(/-/g, '\\-')}$`).test(selector));

interface Resultado {
  problemas: string[];
  encontradas: Set<string>;
}

/** Recorre el CSS: comentarios en blanco (conservando posiciones) y regla por regla. */
const revisarCss = (css: string): Resultado => {
  const limpio = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  const problemas: string[] = [];
  const encontradas = new Set<string>();

  for (const m of limpio.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectores = m[1].split(',').map((s) => s.trim()).filter(Boolean);
    const modales = selectores.filter(esSelectorModal);
    if (modales.length === 0) continue;
    const declaracion = /border-radius:\s*([^;]+);/.exec(m[2]);
    if (!declaracion) continue;

    const linea = css.slice(0, m.index ?? 0).split('\n').length + m[1].split('\n').length - 1;
    const px = radiosEnPx(declaracion[1].trim());
    const valido = px !== null && radioValido(px);

    for (const s of modales) {
      for (const { clase } of SELECTORES_MODALES) if (s.endsWith(`.${clase}`)) encontradas.add(clase);
      if (!valido) problemas.push(`línea ${linea}: ${s} { border-radius: ${declaracion[1].trim()} }`);
    }
  }
  return { problemas, encontradas };
};

const TAMANOS_CON_NOMBRE: Record<string, number> = {
  none: 0, sm: 2, '': 4, md: 6, lg: 8, xl: 12, '2xl': 16, '3xl': 24, card: 6, control: 4
};

/** Clases de radio de un `className`; devuelve las que quedan por debajo de 20 px. */
const radiosCortosEnClases = (clases: string): string[] => {
  const cortas: string[] = [];
  for (const clase of clases.split(/\s+/)) {
    const m = /^(?:[a-z0-9]+:)*rounded(?:-(t|b|l|r|tl|tr|bl|br|s|e))?(?:-(.+))?$/.exec(clase);
    if (!m) continue;
    const lado = m[1] ?? '';
    const tamano = m[2] ?? '';
    if (tamano === 'full') continue;
    const arbitrario = /^\[([\d.]+)px\]$/.exec(tamano);
    const px = arbitrario ? Number(arbitrario[1]) : TAMANOS_CON_NOMBRE[tamano];
    /* Un lado inferior en 0 es el borde de la hoja apoyada en la pantalla. */
    if (px === 0 && ['b', 'bl', 'br'].includes(lado)) continue;
    if (px === undefined || px < MINIMO) cortas.push(clase);
  }
  return cortas;
};

const classNameConAncla = (fuente: string, ancla: string): string | null => {
  for (const m of fuente.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
    const clases = m[1] ?? m[2] ?? '';
    if (clases.includes(ancla)) return clases;
  }
  return null;
};

/* ─── 1. El CSS ─────────────────────────────────────────────────────────── */

const css = leer('design/cara-nueva.css');
const resultado = revisarCss(css);
check('las superficies modales del CSS van a 20 px (Herramientas incluida)', resultado.problemas.length === 0, resultado.problemas.join('; '));

const perdidas = SELECTORES_MODALES.filter(({ clase }) => !resultado.encontradas.has(clase)).map(({ clase }) => clase);
check('cada clase de la lista sigue teniendo su radio en el CSS', perdidas.length === 0, perdidas.join(', '));

const sinUso = SELECTORES_MODALES.filter(({ clase, componente }) => !leer(componente).includes(clase)).map(
  ({ clase, componente }) => `${clase} en ${componente}`
);
check('cada clase de la lista la usa su componente', sinUso.length === 0, sinUso.join('; '));

const overridesPerdidos = OVERRIDES_DEL_MARCO.filter((clase) => !css.includes(`.${clase} [role='dialog'] > div:last-child`));
check('los overrides del marco siguen donde el check los ve', overridesPerdidos.length === 0, overridesPerdidos.join(', '));

/* ─── 2. Los componentes con Tailwind ───────────────────────────────────── */

for (const { ruta, ancla, que } of COMPONENTES_MODALES) {
  const clases = classNameConAncla(leer(ruta), ancla);
  if (clases === null) {
    check(`${que} (${ruta})`, false, `no se encuentra el panel por su ancla «${ancla}»`);
    continue;
  }
  const cortas = radiosCortosEnClases(clases);
  const tieneRadio = /(?:^|\s)(?:[a-z0-9]+:)*rounded/.test(clases);
  check(`${que} va a 20 px`, tieneRadio && cortas.length === 0, tieneRadio ? cortas.join(', ') : 'el panel no declara radio');
}

/* ─── 2b. El alto: todo diálogo cabe en la ventana ──────────────────────── */

/*
 * DEFECTO QUE VIGILA (14 sep 2026): el marco llevaba `sm:max-h-none`, que en
 * escritorio anulaba el alto máximo de cada tamaño. Un diálogo largo crecía con
 * su contenido —1.357 px en una pantalla de 768— y el título y los botones
 * quedaban fuera. Un envoltorio lo tapaba para un solo diálogo; los demás
 * seguían expuestos. Se exige el tope en el marco, y que ningún override del
 * CSS lo quite.
 */
const TOPE_DE_ESCRITORIO = 'sm:max-h-[calc(100dvh-48px)]';

/** Clases de alto del panel que dejan crecer el diálogo más que la ventana. */
const altoSinTope = (clases: string): string[] => {
  const problemas: string[] = [];
  if (!clases.split(/\s+/).includes(TOPE_DE_ESCRITORIO)) problemas.push(`falta ${TOPE_DE_ESCRITORIO}`);
  for (const c of clases.split(/\s+/)) if (/^(?:[a-z0-9]+:)*max-h-(?:none|screen)$/.test(c)) problemas.push(c);
  return problemas;
};

/** Reglas del CSS que le quitan el tope al panel del marco. */
const overridesSinTope = (hoja: string): string[] => {
  const limpio = hoja.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  const salida: string[] = [];
  for (const m of limpio.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/\[role=['"]dialog['"]\][^,]*>\s*div:last-child\s*$/m.test(m[1].trim())) continue;
    const alto = /max-height:\s*(none|unset|initial|auto)\s*;/.exec(m[2]);
    if (alto) salida.push(`${m[1].trim()} { max-height: ${alto[1]} }`);
  }
  return salida;
};

const clasesDelMarco = classNameConAncla(leer('design/Dialog.tsx'), 'max-h-[76vh]') ?? '';
const sinTope = altoSinTope(clasesDelMarco);
check('el marco compartido acota el alto a la ventana en escritorio (cabecera y pie a la vista)', clasesDelMarco !== '' && sinTope.length === 0, sinTope.join(', '));
const cssSinTope = overridesSinTope(css);
check('ningún override del CSS le quita el tope al panel', cssSinTope.length === 0, cssSinTope.join('; '));
check('muerde: el marco con sm:max-h-none', altoSinTope('max-h-[76vh] sm:max-h-none rounded-t-[20px]').length > 0);
check('muerde: un override con max-height: none', overridesSinTope(".cara-nueva .cn-x-dialogos [role='dialog'] > div:last-child {\n  max-height: none;\n}").length === 1);

/* ─── 3. Que muerda ─────────────────────────────────────────────────────── */

const muerde = (nombre: string, dejaPasar: boolean): void => check(`muerde: ${nombre}`, !dejaPasar);

muerde('un panel de confirmación a 16 px', revisarCss('.cara-nueva .cn-sal-panel {\n  border-radius: 16px;\n}').problemas.length === 0);
muerde(
  'el override de Herramientas de vuelta a 16 px',
  revisarCss(
    "/* ─── Herramientas ─── */\n@media (min-width: 640px) {\n  .cara-nueva .cn-her-dialogos [role='dialog'] > div:last-child {\n    border-radius: 16px;\n  }\n}\n/* ─── fin Herramientas ─── */"
  ).problemas.length === 0
);
muerde('una hoja con 16 arriba', revisarCss('.cara-nueva .cn-hoja {\n  border-radius: 16px 16px 0 0;\n}').problemas.length === 0);
muerde('un radio con variable que no se puede medir', revisarCss('.cara-nueva .cn-vis-globo {\n  border-radius: var(--r);\n}').problemas.length === 0);
muerde('una hoja con rounded-t-card', radiosCortosEnClases('max-h-[75vh] rounded-t-card bg-surface').length === 0);
muerde('un marco con sm:rounded-[16px]', radiosCortosEnClases('rounded-t-[20px] sm:rounded-[16px]').length === 0);
muerde('un aviso con rounded-xl', radiosCortosEnClases('flex rounded-xl border').length === 0);
check(
  'deja pasar la hoja correcta (20 arriba, 0 abajo) y el globo de arriba (0 0 20 20)',
  revisarCss('.cara-nueva .cn-hoja {\n  border-radius: 20px 20px 0 0;\n}\n.cara-nueva .cn-vis-hoja--arriba {\n  border-radius: 0 0 20px 20px;\n}').problemas.length === 0 &&
    radiosCortosEnClases('rounded-t-[20px] sm:rounded-[20px]').length === 0
);

console.log('');
if (fallos > 0) {
  console.log(`${fallos} comprobación(es) fallaron.`);
  process.exitCode = 1;
} else {
  console.log('Diálogos y hojas: esquinas de 20 px.');
}
