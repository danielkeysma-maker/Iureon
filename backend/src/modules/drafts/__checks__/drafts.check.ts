/**
 * Guards the saved drafts.
 *
 * Run with: npm run check:drafts
 *
 * Un borrador jurídico no es un archivo que espera: es un PLAZO QUE CORRE, y de
 * ahí salen las tres garantías que se comprueban aquí — que la lista se ordene
 * por término, que lo radicado no se pueda editar, y que la versión signifique
 * lo que dice.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/*
 * `__dirname` y no `import.meta.url`.
 *
 * Este backend compila a CommonJS, y `import.meta` ahí es un error de
 * compilación —no de ejecución—, así que `npm test` lo dejaba pasar (corre con
 * `--transpile-only`) y `npm run build` lo tumbaba. Es decir: verde en local,
 * rojo en el despliegue. El proyecto ya tenía escrito que `tsconfig.check.json`
 * fuerza commonjs; esta es la segunda vez que muerde.
 */
const SERVICIO = readFileSync(join(__dirname, '..', 'drafts.service.ts'), 'utf8');
const SQL = readFileSync(
  join(__dirname, '..', '..', '..', '..', '..', 'supabase', 'migration-borradores.sql'),
  'utf8'
);

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/*
 * ─── EL ORDEN ES POR TÉRMINO ─────────────────────────────────────────────────
 *
 * Un escrito editado hace un mes cuyo término vence pasado mañana importa más
 * que uno tocado esta mañana sin fecha a la vista. Ordenar por última edición
 * los pone exactamente al revés, que es como estaba.
 */
check(
  'la lista se ordena por término que vence, no por última edición',
  /\.order\('vence_el'/.test(SERVICIO),
  ''
);

check(
  'y los que no caducan van al final, no al principio',
  /nullsFirst:\s*false/.test(SERVICIO),
  ''
);

/*
 * ─── LO RADICADO ES COPIA INMUTABLE ──────────────────────────────────────────
 *
 * Lo que está en el expediente no puede diferir de lo que la firma guardó: esa
 * copia es la prueba de qué se presentó. Y la garantía tiene que vivir en la
 * BASE — un `disabled` de pantalla se salta con una petición.
 */
check(
  'la inmutabilidad de lo radicado la impone la base, no la pantalla',
  /CREATE TRIGGER trg_impedir_editar_radicado/.test(SQL),
  ''
);

check(
  'el disparador bloquea el TEXTO y solo el texto',
  /NEW\.legal_text IS DISTINCT FROM OLD\.legal_text/.test(SQL),
  ''
);

// Marcar como radicado o corregir el número de radicación siguen siendo
// posibles: si el disparador bloqueara toda la fila, no se podría ni marcar.
check(
  'pero deja marcar el radicado y corregir su número',
  !/NEW\.\*|NEW IS DISTINCT FROM OLD/.test(SQL),
  ''
);

/*
 * ─── LA VERSIÓN SIGNIFICA REDACCIÓN ──────────────────────────────────────────
 *
 * "v4" tiene que ser la cuarta redacción. Si subiera al corregir el cliente o
 * al marcar un estado, dos abogados no podrían usarla para saber cuál es la
 * buena, que es exactamente para lo que sirve.
 */
check(
  'la versión sube solo cuando cambia el texto',
  /const cambiaElTexto = typeof updates\.legal_text === 'string'/.test(SERVICIO),
  ''
);

/*
 * ─── LA FIRMA SE VE A SÍ MISMA ───────────────────────────────────────────────
 *
 * Filtraba siempre por usuario, así que dos socios del mismo caso no veían los
 * borradores del otro y el escrito que uno dejó a medias era invisible para
 * quien tenía que radicarlo. El defecto no daba error: la lista salía corta.
 */
check(
  'el alcance por defecto es la firma, no la persona',
  /alcance: 'MIOS' \| 'FIRMA' = 'FIRMA'/.test(SERVICIO),
  ''
);

check(
  'y el filtro por usuario solo se aplica si se pide',
  /if \(alcance === 'MIOS'\)/.test(SERVICIO),
  ''
);

/*
 * ─── LA FECHA NO SE CALCULA ──────────────────────────────────────────────────
 *
 * El término del catálogo es TEXTO —«dentro de los diez (10) días siguientes a
 * la presentación»— y de ahí no sale una fecha sin saber cuándo empezó a
 * correr. Solo lo sabe quien lleva el caso. Si algún día aparece aquí un cálculo
 * de vencimiento, esto tiene que fallar: sería inventar un plazo.
 */
check(
  'la fecha de vencimiento se guarda, no se deduce del término',
  !/vence_el\s*[:=][^;]*(?:addDays|setDate|\+\s*\d+\s*\*\s*24)/.test(SERVICIO),
  ''
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
