/**
 * Guards the appearance preferences.
 *
 * Run with: npm run check:prefs
 *
 * Lo que se comprueba es el SANEAMIENTO, porque es donde un valor de fuera
 * entra al sistema. Una preferencia inválida no puede impedirle a nadie usar la
 * aplicación, pero tampoco puede colarse: un `theme` inventado que llegue al
 * atributo del documento deja la app sin tema, blanca sobre blanca, y sin un
 * solo error en consola.
 */
import { POR_DEFECTO, sanear } from '../preferences.service';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* ─── LO VÁLIDO PASA ─────────────────────────────────────────────────────── */
const completo = sanear({ theme: 'dark', uiFont: 'manrope', density: 'compact' });
check(
  'una preferencia completa y válida se conserva entera',
  completo.theme === 'dark' && completo.uiFont === 'manrope' && completo.density === 'compact',
  JSON.stringify(completo)
);

/* ─── LO INVÁLIDO CAE AL DEFECTO, SIN LANZAR ─────────────────────────────── */
// Satoshi (Fontshare, ITF) entro despues de las seis primeras: debe pasar entera.
const satoshi = sanear({ theme: 'light', uiFont: 'satoshi', density: 'normal' });
check('Satoshi es una fuente aceptada', satoshi.uiFont === 'satoshi', String(satoshi.uiFont));

const basura = sanear({ theme: 'neon', uiFont: 'comic-sans', density: 'gigante' });
check(
  'un valor inventado cae al por defecto en vez de colarse',
  basura.theme === POR_DEFECTO.theme &&
    basura.uiFont === POR_DEFECTO.uiFont &&
    basura.density === POR_DEFECTO.density,
  JSON.stringify(basura)
);

const nada = [undefined, null, 'texto', 42, []].map((v) => {
  try {
    return sanear(v);
  } catch {
    return null;
  }
});
check(
  'nada de lo que llegue puede hacerlo lanzar',
  nada.every((p) => p !== null && p.theme === POR_DEFECTO.theme),
  ''
);

// Y lo parcial conserva lo bueno: cambiar solo el tema no debe resetear la
// tipografía a la de por defecto sin que nadie lo haya pedido.
const parcial = sanear({ theme: 'light' });
check(
  'lo parcial conserva lo válido y completa el resto',
  parcial.theme === 'light' && parcial.uiFont === POR_DEFECTO.uiFont,
  JSON.stringify(parcial)
);

/* ─── EL DEFECTO ES SEGUIR AL SISTEMA ────────────────────────────────────── */
check(
  'sin preferencia, el tema sigue al sistema operativo',
  POR_DEFECTO.theme === 'system',
  POR_DEFECTO.theme
);

/*
 * ─── LA MONOESPACIADA NO ES ELEGIBLE ─────────────────────────────────────
 *
 * No hay campo para ella, y no debe haberlo: términos, radicados y saldos van
 * siempre en mono, que es lo que impide confundir un 1 con una l en un radicado
 * de veintitrés dígitos. Si algún día alguien agrega `monoFont`, esto falla.
 */
check(
  'no existe forma de cambiar la monoespaciada',
  !Object.keys(sanear({})).some((k) => /mono|legal|documento/i.test(k)),
  Object.keys(sanear({})).join(', ')
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
