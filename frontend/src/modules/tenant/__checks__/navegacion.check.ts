import { NAV_GROUPS, NAV_MODULES, VISTA_POR_MODULO, modulosSinGrupo } from '../navigation';
import { PUERTAS_DE_INICIO } from '../../inicio/puertas';
import { PASOS_DE_VISITA } from '../../inicio/visitaGuiada/pasos';
import { MANUAL } from '../../help/content/manual';
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

/* ─── 5. LAS PUERTAS DE INICIO LLEVAN A ALGUN SITIO ─────────────────────── */
/*
 * «Por donde empiezo» es lo primero que ve quien no sabe usar la aplicacion.
 * Una tarjeta cuyo destino no existe no falla: abre una vista en blanco, que
 * para un recien llegado es indistinguible de que el producto no sirve.
 */
const puertasAlVacio = PUERTAS_DE_INICIO.filter((p) => !declarados.has(p.destino));
check(
  'cada puerta de Inicio lleva a un modulo que existe',
  puertasAlVacio.length === 0,
  puertasAlVacio.length > 0
    ? `AL VACIO: ${puertasAlVacio.map((p) => p.destino).join(', ')}`
    : `${PUERTAS_DE_INICIO.length} puertas`
);

const destinos = PUERTAS_DE_INICIO.map((p) => p.destino);
check(
  'ninguna puerta se repite',
  new Set(destinos).size === destinos.length,
  'dos tarjetas al mismo sitio obligan a leer las dos para descubrir que daba igual'
);

/*
 * ORIENTACION Y EXPEDIENTES SON LOS DOS QUE NADIE ENCUENTRA SOLO, y por eso se
 * fijan aqui con su razon escrita. Orientacion existe justamente para quien NO
 * sabe como se llama lo suyo: dejarla fuera de la puerta de entrada obliga a
 * saber su nombre para llegar a la pantalla que existe porque no lo sabe.
 * Expedientes es el mas nuevo y no estaba en ninguna parte de Inicio.
 */
check(
  'Orientacion tiene puerta: es la pantalla para quien no sabe el nombre',
  destinos.includes('orientacion')
);
check('Expedientes tiene puerta: es el modulo mas nuevo', destinos.includes('expedientes'));

/* ─── 6. Y LA VISITA GUIADA NO DEJA MODULOS FUERA EN SILENCIO ───────────── */
/*
 * Expedientes se anadio a la barra y NO a la visita, asi que quien entraba por
 * primera vez recorria las paradas sin enterarse de que el modulo existia. No
 * lanza error y no se ve: es la misma forma de defecto que `modulosSinGrupo`
 * caza un escalon mas arriba.
 *
 * Se exceptua «Administrar» a proposito: seguridad, privacidad y ajustes no
 * son trabajo diario y la visita ya es larga.
 */
const administrar = new Set<string>(NAV_GROUPS.find((g) => g.titulo === 'Administrar')?.modulos ?? []);
const conParada = new Set(PASOS_DE_VISITA.map((p) => p.vista).filter(Boolean));
const sinParada = NAV_MODULES.map((m) => m.id).filter(
  (id) => !administrar.has(id) && !conParada.has(id)
);
check(
  'la visita guiada pasa por todo modulo de trabajo diario',
  sinParada.length === 0,
  sinParada.length > 0
    ? `SIN PARADA: ${sinParada.join(', ')} — existe, funciona, y el recien llegado no se entera`
    : `${PASOS_DE_VISITA.length} paradas`
);

/* ─── 7. Y NINGUN MODULO DE TRABAJO DIARIO SE QUEDA SIN MANUAL ──────────── */
/*
 * Expedientes llevaba dias en la barra con una sola mencion en el manual —la
 * del interrogatorio— y el expediente en si sin documentar. Y «Buscador» no
 * aparecia en NINGUNA ruta de ningun articulo: cobertura cero, sin que nada
 * lo dijera.
 *
 * Se mide por la ruta («ruta») y no por el texto, porque la ruta es lo que el
 * articulo promete: «este articulo pasa por aqui». Que una prosa nombre un
 * modulo de pasada no lo documenta.
 *
 * LIMITE DECLARADO: esto caza la cobertura CERO, no la parcial. Expedientes
 * habria pasado este check el mes pasado con solo el articulo del
 * interrogatorio. Decirlo aqui vale mas que fingir que el check hace mas.
 */
const enRutas = new Set<string>();
for (const grupo of MANUAL) {
  for (const articulo of grupo.articulos) {
    for (const b of articulo.bloques) {
      if (b.kind === 'ruta') for (const chip of b.camino) enRutas.add(chip);
    }
  }
}

/* El manual se documenta a si mismo, y al estrado no se le escribe un articulo. */
const SIN_ARTICULO_PROPIO = new Set<MainView>(['manual']);
const sinManual = NAV_MODULES.filter(
  (m) => !administrar.has(m.id) && !SIN_ARTICULO_PROPIO.has(m.id) && !enRutas.has(m.label)
);
check(
  'todo modulo de trabajo diario aparece en la ruta de algun articulo del manual',
  sinManual.length === 0,
  sinManual.length > 0
    ? `SIN MANUAL: ${sinManual.map((m) => m.label).join(', ')}`
    : `${enRutas.size} destinos nombrados en las rutas`
);

console.log('');
console.log(fallos === 0 ? 'ALL CHECKS PASSED' : `${fallos} CHECKS FAILED`);
process.exit(fallos === 0 ? 0 : 1);
