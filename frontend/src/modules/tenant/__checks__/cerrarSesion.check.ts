import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * «CERRAR SESIÓN» PREGUNTA IGUAL EN LAS TRES ENTRADAS, Y LO QUE DICE ES CIERTO.
 *
 * Run with: npm run check:cerrar-sesion
 *
 * ─── POR QUÉ ESTE ARCHIVO EXISTE ───────────────────────────────────────────
 *
 * El 14 de septiembre de 2026 la confirmación seguía con la cara vieja, y al
 * rehacerla apareció lo que no se veía: solo la cabecera de escritorio
 * preguntaba. La hoja del teléfono y Ajustes › Su cuenta cerraban la sesión al
 * primer toque. Además la confirmación prometía «ajustes» guardados en la nube
 * —el tamaño de letra y la barra plegada son de cada navegador— y «retomará
 * donde quedó», cuando la sesión aterriza en Inicio.
 *
 * Todo se comprueba leyendo el código fuente, sin montar React: son hechos
 * sobre dónde vive cada cosa, y así el check corre en cualquier máquina.
 *
 * ─── QUE MUERDA ────────────────────────────────────────────────────────────
 *
 * Cada regla es una función pura sobre texto, y al final se pasa también sobre
 * versiones rotas a propósito (la hoja que salía directo, un diálogo sin
 * `aria-modal`, un `signOut` global, un bloque CSS sin su oscuro). Si alguna
 * regla deja pasar su versión rota, el check falla: una guarda que no puede
 * fallar es un comentario largo.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const leer = (ruta: string): string => readFileSync(join(SRC, ruta), 'utf8');

/* ─── Reglas, puras ─────────────────────────────────────────────────────── */

/** La entrada usa la confirmación única y ningún botón llama a `onLogout` directo. */
const entradaPregunta = (fuente: string): boolean =>
  fuente.includes('<ConfirmarCierreDeSesion') &&
  !fuente.includes('cerrarY(onLogout)') &&
  !fuente.includes('onClick={onLogout}') &&
  !fuente.includes('<ActionConfirmationModal');

const dialogoAccesible = (fuente: string): string[] => {
  const faltan: string[] = [];
  const exigidos = [
    'role="dialog"',
    'aria-modal="true"',
    'aria-labelledby=',
    'aria-describedby=',
    'createPortal(',
    'cara-nueva cn-sal',
    "'Escape'",
    "'Tab'",
    "document.body.style.overflow = 'hidden'",
    'focoAlCerrar'
  ];
  for (const e of exigidos) if (!fuente.includes(e)) faltan.push(e);
  return faltan;
};

/** El foco inicial va al botón seguro: la ref del que cancela es la que recibe `.focus()`. */
const focoSeguro = (fuente: string): boolean =>
  fuente.includes('cancelar.current?.focus()') &&
  fuente.includes('ref={cancelar}') &&
  fuente.indexOf('ref={cancelar}') < fuente.indexOf('onClick={onConfirm}');

/** El cuerpo de `handleLogout` en App.tsx. */
const cuerpoDeHandleLogout = (app: string): string => {
  const inicio = app.indexOf('const handleLogout = () => {');
  if (inicio === -1) return '';
  const fin = app.indexOf('};', inicio);
  return app.slice(inicio, fin);
};

/** «Los demás dispositivos siguen conectados» solo es cierto si salir no revoca nada en el servidor. */
const salirEsLocal = (cuerpo: string): boolean =>
  cuerpo.length > 0 && !cuerpo.includes('signOut') && !cuerpo.includes('authApi') && !cuerpo.includes('httpClient');

/*
 * Solo el objeto de textos, no el archivo entero: el comentario del componente
 * CITA la copia retirada para explicar por qué se retiró, y eso no es lo que
 * lee el abogado.
 */
const soloLosTextos = (fuente: string): string => {
  const inicio = fuente.indexOf('export const TEXTO_CIERRE_DE_SESION');
  const fin = fuente.indexOf('as const', inicio);
  return inicio === -1 || fin === -1 ? '' : fuente.slice(inicio, fin);
};

const copiaHonesta = (fuente: string): string[] => {
  const problemas: string[] = [];
  const copia = soloLosTextos(fuente);
  if (!copia) return ['no está el objeto TEXTO_CIERRE_DE_SESION'];
  if (!fuente.includes('confirmVariant="primary"')) problemas.push('salir se pinta como acción destructiva');
  if (copia.includes('ajustes')) problemas.push('promete «ajustes» en la nube: parte de la apariencia es de cada navegador');
  if (copia.includes('donde quedó')) problemas.push('promete «donde quedó»: la sesión aterriza en Inicio');
  if (!copia.includes('Los demás dispositivos siguen conectados')) problemas.push('no dice que solo cierra este navegador');
  if (!copia.includes("cancelar: 'Seguir trabajando'")) problemas.push('el botón seguro no dice «Seguir trabajando»');
  return problemas;
};

/** El bloque entre marcadores, con cada selector bajo `.cara-nueva`, los dos oscuros y nada ≤ 12 px. */
const bloqueCss = (css: string): string => {
  const inicio = css.indexOf('/* ─── Cerrar sesión ─── */');
  const fin = css.indexOf('/* ─── fin Cerrar sesión ─── */');
  return inicio === -1 || fin === -1 || fin < inicio ? '' : css.slice(inicio, fin);
};

const problemasDelCss = (bloque: string): string[] => {
  const problemas: string[] = [];
  if (!bloque) return ['no está el bloque entre sus marcadores'];
  const sinComentarios = bloque.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const linea of sinComentarios.split('\n')) {
    const t = linea.trim();
    /* Las reglas-@ y los pasos de un `@keyframes` no son selectores. */
    if (!t.endsWith('{') || t.startsWith('@') || t === 'from {' || t === 'to {' || /^[\d.]+%/.test(t)) continue;
    for (const selector of t.slice(0, -1).split(',')) {
      const s = selector.trim();
      if (s && !s.includes('.cara-nueva')) problemas.push(`selector fuera de .cara-nueva: ${s}`);
      if (s && !s.includes('cn-sal')) problemas.push(`selector sin prefijo cn-sal: ${s}`);
    }
  }
  if (!sinComentarios.includes('@media (prefers-color-scheme: dark)')) problemas.push('falta el oscuro del sistema');
  if (!sinComentarios.includes(":root[data-theme='dark']")) problemas.push('falta el oscuro forzado');
  for (const m of sinComentarios.matchAll(/font-size:\s*([\d.]+)px/g)) {
    if (Number(m[1]) <= 12) problemas.push(`letra de ${m[1]} px`);
  }
  if (!sinComentarios.includes('height: 44px')) problemas.push('los botones no miden 44 px');
  if (sinComentarios.includes('--danger') && !sinComentarios.includes('cn-sal-boton--peligro')) problemas.push('rojo fuera de la variante de peligro');
  return problemas;
};

/* ─── 1. Una sola confirmación, tres entradas ───────────────────────────── */

const ENTRADAS = [
  'modules/tenant/components/HeaderTop.tsx',
  'modules/tenant/components/MobileHeader.tsx',
  'modules/settings/components/SeccionesSuyas.tsx'
];
for (const ruta of ENTRADAS) check(`${ruta} pregunta con ConfirmarCierreDeSesion`, entradaPregunta(leer(ruta)));

/* ─── 2. El diálogo ─────────────────────────────────────────────────────── */

const modal = leer('modules/tenant/components/ActionConfirmationModal.tsx');
const faltan = dialogoAccesible(modal);
check('el diálogo es modal, rotulado, descrito, con Esc, trampa de foco y bloqueo de desplazamiento', faltan.length === 0, faltan.join(', '));
check('el foco entra al botón seguro', focoSeguro(modal));
check('el diálogo no usa clases de letra de Tailwind (la cara vieja)', !modal.includes('text-[1') && !modal.includes('rounded-card'));

/* ─── 3. Lo que dice es cierto ──────────────────────────────────────────── */

const copia = leer('modules/tenant/components/ConfirmarCierreDeSesion.tsx');
const problemasDeCopia = copiaHonesta(copia);
check('la copia no promete lo que no ocurre', problemasDeCopia.length === 0, problemasDeCopia.join('; '));
check('salir cierra solo este navegador (handleLogout no llama al servidor)', salirEsLocal(cuerpoDeHandleLogout(leer('App.tsx'))));

/* ─── 4. El CSS ─────────────────────────────────────────────────────────── */

const problemasCss = problemasDelCss(bloqueCss(leer('design/cara-nueva.css')));
check('CSS bajo .cara-nueva, prefijo cn-sal, dos oscuros, nada ≤ 12 px, botones de 44 px', problemasCss.length === 0, problemasCss.join('; '));

/* ─── 4b. El radio de los diálogos ──────────────────────────────────────── */

/*
 * 14 de septiembre de 2026: los diálogos de la cara nueva pasaron a 20 px, en
 * escritorio y en las esquinas de arriba de la hoja del teléfono. Se afirma en
 * los dos marcos: el de esta confirmación y el compartido de `design/Dialog.tsx`
 * (Avisos y los demás). El token `rounded-card` NO se toca: lo usan tarjetas.
 */
const radiosDelBloque = (bloque: string): string[] => {
  const problemas: string[] = [];
  const panelEscritorio = bloque.indexOf('.cara-nueva .cn-sal-panel {');
  const reglaEscritorio = panelEscritorio === -1 ? '' : bloque.slice(panelEscritorio, bloque.indexOf('}', panelEscritorio));
  if (!reglaEscritorio.includes('border-radius: 20px;')) problemas.push('el panel no mide 20 px de radio en escritorio');
  if (!bloque.includes('border-radius: 20px 20px 0 0;')) problemas.push('la hoja del teléfono no lleva 20 px arriba y 0 abajo');
  return problemas;
};

const radiosDelMarcoCompartido = (fuente: string): string[] => {
  const problemas: string[] = [];
  if (!fuente.includes('rounded-t-[20px]')) problemas.push('la hoja del teléfono no lleva rounded-t-[20px]');
  if (!fuente.includes('sm:rounded-[20px]')) problemas.push('el marco de escritorio no lleva sm:rounded-[20px]');
  if (fuente.includes('sm:rounded-card')) problemas.push('el marco sigue en rounded-card (6 px)');
  if (!fuente.includes('overflow-hidden')) problemas.push('sin overflow-hidden la cabecera y el pie se salen de la curva');
  return problemas;
};

const problemasDeRadio = [
  ...radiosDelBloque(bloqueCss(leer('design/cara-nueva.css'))),
  ...radiosDelMarcoCompartido(leer('design/Dialog.tsx'))
];
check('los diálogos van a 20 px (confirmación y marco compartido)', problemasDeRadio.length === 0, problemasDeRadio.join('; '));

/* ─── 5. Que muerda ─────────────────────────────────────────────────────── */

const muerde = (nombre: string, dejaPasar: boolean): void => check(`muerde: ${nombre}`, !dejaPasar);

muerde('la hoja que salía al primer toque', entradaPregunta('<Accion onClick={cerrarY(onLogout)}>Cerrar sesión</Accion>'));
muerde('Ajustes sin confirmación', entradaPregunta('<button type="button" onClick={onLogout}>Cerrar sesión</button>'));
muerde('un diálogo sin aria-modal', dialogoAccesible(modal.replace('aria-modal="true"', '')).length === 0);
muerde('el foco en el botón que confirma', focoSeguro(modal.replace('cancelar.current?.focus()', 'confirmar.current?.focus()')));
muerde('un signOut global al salir', salirEsLocal('const handleLogout = () => { supabase.auth.signOut({ scope: "global" }); clearSession();'));
muerde(
  'la copia vieja',
  copiaHonesta(
    "export const TEXTO_CIERRE_DE_SESION = { mensaje: 'borradores, revisiones, transcritos y ajustes. Al volver a entrar, retomará donde quedó.', detalle: 'Los demás dispositivos siguen conectados.', cancelar: 'Seguir trabajando' } as const; confirmVariant=\"primary\""
  ).length === 0
);
muerde(
  'un bloque sin oscuro, con letra de 12 px y un selector suelto',
  problemasDelCss("/* ─── Cerrar sesión ─── */\n.cn-sal-texto {\n  font-size: 12px;\n}\n").length === 0
);
muerde('el marco compartido en rounded-card', radiosDelMarcoCompartido('overflow-hidden rounded-t-[16px] sm:rounded-card').length === 0);
muerde('el panel a 16 px', radiosDelBloque('.cara-nueva .cn-sal-panel {\n  border-radius: 16px;\n}').length === 0);

console.log('');
if (fallos > 0) {
  console.log(`${fallos} comprobación(es) fallaron.`);
  process.exitCode = 1;
} else {
  console.log('Cerrar sesión: una confirmación, accesible y cierta.');
}
