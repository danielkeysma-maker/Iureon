import { NAV_GROUPS, NAV_MODULES, VISTA_POR_MODULO, modulosSinGrupo } from '../navigation';
import type { MainView } from '../types';

/**
 * QUE NINGÚN MÓDULO EXISTA SIN QUE SE PUEDA LLEGAR A ÉL.
 *
 * Run with: npm run check:navegacion
 *
 * ─── POR QUÉ ESTE ARCHIVO EXISTE ───────────────────────────────────────────
 *
 * `navigation.ts` YA TENÍA la función que caza este defecto —`modulosSinGrupo`,
 * escrita con su comentario: «un módulo que se agregue a NAV_MODULES y no a un
 * grupo desaparece de la barra: existe, funciona, y nadie lo encuentra. Es
 * exactamente la clase de defecto que no lanza error — por eso se comprueba
 * aquí y no se confía».
 *
 * NADIE LA LLAMABA. Se comprobó al añadir Expedientes el 10 de septiembre de
 * 2026: la función estaba exportada y ningún archivo de la aplicación, ningún
 * check y ningún script la usaba. Una guarda que nadie ejecuta es un
 * comentario largo.
 *
 * Es la misma forma de defecto que ese mismo día apareció en el backend:
 * `verificarVigencia.ts` y `verificarGlosa.ts` VIVÍAN en la carpeta `review/`
 * y nadie de esa carpeta los importaba. Un módulo escrito no es un módulo
 * conectado, y desde fuera se ven igual.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

/* ─── 1. LA GUARDA QUE YA EXISTÍA, POR FIN CORRIENDO ─────────────────────── */

const huerfanos = modulosSinGrupo();
check(
  'todo módulo de la barra está en un grupo: ninguno existe sin que se pueda llegar a él',
  huerfanos.length === 0,
  huerfanos.length > 0
    ? `SIN GRUPO: ${huerfanos.join(', ')} — añádelo a un NAV_GROUP o nadie lo encontrará`
    : `${NAV_MODULES.length} módulos, ${NAV_GROUPS.length} grupos`
);

/* ─── 2. Y AL REVÉS: NINGÚN GRUPO NOMBRA UN MÓDULO QUE NO EXISTE ─────────── */

/*
 * El defecto simétrico, que la función original no cubría. Un id mal escrito
 * en un grupo no rompe nada: simplemente no pinta nada, y el módulo real se
 * queda fuera de la barra por partida doble —no está en su grupo y su nombre
 * está ocupado por un fantasma—.
 */
const declarados = new Set(NAV_MODULES.map((m) => m.id));
const fantasmas = NAV_GROUPS.flatMap((g) => g.modulos).filter((id) => !declarados.has(id));
check(
  'y ningún grupo nombra un módulo que no existe',
  fantasmas.length === 0,
  fantasmas.length > 0 ? `NO EXISTEN: ${fantasmas.join(', ')}` : 'sin fantasmas'
);

/* ─── 3. NINGÚN MÓDULO APARECE DOS VECES ─────────────────────────────────── */

const enGrupos = NAV_GROUPS.flatMap((g) => g.modulos);
const repetidos = enGrupos.filter((id, i) => enGrupos.indexOf(id) !== i);
check(
  'ningún módulo está en dos grupos a la vez',
  repetidos.length === 0,
  repetidos.length > 0 ? `REPETIDOS: ${[...new Set(repetidos)].join(', ')}` : 'sin repeticiones'
);

/* ─── 4. EL INTERRUPTOR POR FIRMA APUNTA A UNA VISTA QUE EXISTE ──────────── */

/*
 * `VISTA_POR_MODULO` traduce el nombre del módulo del servidor a una vista de
 * la barra, y es lo que permite al operador apagarle un módulo a una firma. Si
 * apunta a una vista que no está declarada, apagar el módulo no esconde nada:
 * la puerta sigue abierta y detrás hay un 403.
 */
const vistas = new Set<MainView>(NAV_MODULES.map((m) => m.id));
const apuntanAlVacio = Object.entries(VISTA_POR_MODULO).filter(
  ([, vista]) => vista !== undefined && !vistas.has(vista)
);
check(
  'cada módulo del servidor apunta a una vista que existe en la barra',
  apuntanAlVacio.length === 0,
  apuntanAlVacio.length > 0
    ? `APUNTAN AL VACÍO: ${apuntanAlVacio.map(([m, v]) => `${m}→${v}`).join(', ')}`
    : `${Object.keys(VISTA_POR_MODULO).length} módulos mapeados`
);

/* ─── 5. LOS MÓDULOS NUEVOS, POR SU NOMBRE ──────────────────────────────── */

/*
 * El barrido de arriba caza un módulo suelto. Este caza que alguien QUITE
 * Expedientes de la barra sin quitar el módulo, que es un cambio de una línea
 * y no movería ninguno de los conteos.
 */
check(
  'Expedientes está en la barra y en el grupo «Registrar»',
  declarados.has('expedientes') &&
    NAV_GROUPS.some((g) => g.titulo === 'Registrar' && g.modulos.includes('expedientes')),
  'el asunto se registra; producir es lo que viene después'
);
check(
  'y el operador puede apagárselo a una firma',
  VISTA_POR_MODULO.EXPEDIENTES === 'expedientes',
  'sin esto, apagar el módulo dejaría la puerta abierta a un 403'
);

console.log('');
console.log(fallos === 0 ? 'ALL CHECKS PASSED' : `${fallos} CHECKS FAILED`);
process.exit(fallos === 0 ? 0 : 1);
