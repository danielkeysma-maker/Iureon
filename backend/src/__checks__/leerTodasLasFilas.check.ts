/**
 * GUARDA: LO QUE SE CUENTA EN MEMORIA SE LEE ENTERO.
 *
 * Run with: npm run check:leer-filas
 *
 * PostgREST corta un `select` en 1.000 filas sin error — medido en esta base:
 * 7.922 filas reales, 1.000 devueltas. La consola del operador contaba
 * transcritos, consumo y catálogo curado con `select` sin rango, así que pasadas
 * las mil cada cifra salía por debajo de la real. Ver `config/leerTodasLasFilas.ts`.
 *
 * Dos mitades:
 *   1. El helper recorre de verdad — se prueba con una consulta postiza, no
 *      leyendo su texto.
 *   2. Las tres consultas de `firmVolumes` lo usan, Y ORDENAN: pedir por rangos
 *      sin un orden fijo puede repetir o saltarse filas entre partes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FILAS_POR_PARTE, leerTodasLasFilas } from '../config/leerTodasLasFilas';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

/** Una tabla de `total` filas servida como PostgREST: nunca más de 1.000 por pedido. */
const tablaPostiza = (total: number, fallarDesde?: number) => {
  const pedidos: Array<[number, number]> = [];
  const pedirParte = async (desde: number, hasta: number) => {
    pedidos.push([desde, hasta]);
    if (desde === fallarDesde) return { data: null, error: { message: 'la base no respondió' } };
    const fin = Math.min(hasta, total - 1, desde + FILAS_POR_PARTE - 1);
    const data = fin < desde ? [] : Array.from({ length: fin - desde + 1 }, (_, i) => ({ id: desde + i }));
    return { data, error: null };
  };
  return { pedidos, pedirParte };
};

/* ─── 2. LAS TRES CONSULTAS DE LA CONSOLA ────────────────────────────────── */

const servicio = readFileSync(join(process.cwd(), 'src', 'modules', 'admin', 'admin.service.ts'), 'utf8');
const inicio = servicio.indexOf('const firmVolumes');
const fin = servicio.indexOf('return volumes;', inicio);
const cuerpo = inicio === -1 || fin === -1 ? '' : servicio.slice(inicio, fin);

check('firmVolumes existe y se puede leer', cuerpo.length > 0);

for (const tabla of ['transcriptions', 'credit_movements', 'catalog_verifications']) {
  const i = cuerpo.indexOf(`from('${tabla}')`);
  /* La consulta entera, desde su `leerTodasLasFilas(` hasta el cierre del pedido. */
  const antes = i === -1 ? '' : cuerpo.slice(Math.max(0, i - 200), i);
  const despues = i === -1 ? '' : cuerpo.slice(i, i + 400);
  check(
    `firmVolumes lee ${tabla} entera, por partes`,
    i !== -1 && /leerTodasLasFilas/.test(antes) && /\.range\(desde, hasta\)/.test(despues),
    'un select sin rango se corta en 1.000 filas sin error'
  );
  check(
    `y ordena ${tabla} antes de partir`,
    i !== -1 && /\.order\(/.test(despues),
    'sin un orden fijo, una fila puede salir en dos partes o en ninguna'
  );
}

void (async () => {
  /* ─── 1. EL HELPER RECORRE DE VERDAD ─────────────────────────────────── */
  const grande = tablaPostiza(7922);
  const todas = await leerTodasLasFilas(grande.pedirParte);
  check(
    'lee las 7.922 filas medidas en esta base, no las primeras mil',
    todas.filas.length === 7922 && todas.falla === null,
    `leyó ${todas.filas.length} en ${grande.pedidos.length} parte(s)`
  );
  check(
    'sin repetir ni saltarse ninguna',
    new Set(todas.filas.map((f) => f.id)).size === 7922 && todas.filas[7921]?.id === 7921
  );

  const exacta = tablaPostiza(FILAS_POR_PARTE * 2);
  const justas = await leerTodasLasFilas(exacta.pedirParte);
  check(
    'con un múltiplo exacto de mil no se queda corto',
    justas.filas.length === FILAS_POR_PARTE * 2 && justas.falla === null && exacta.pedidos.length === 3,
    `pidió ${exacta.pedidos.length} parte(s)`
  );

  const vacia = await leerTodasLasFilas(tablaPostiza(0).pedirParte);
  check('una tabla vacía da cero filas y ninguna falla', vacia.filas.length === 0 && vacia.falla === null);

  const rota = tablaPostiza(7922, 2000);
  const incompleta = await leerTodasLasFilas(rota.pedirParte);
  check(
    'si una parte falla, la falla VIENE en el resultado',
    incompleta.falla !== null && incompleta.falla.includes('la base no respondió'),
    String(incompleta.falla)
  );
  check(
    'y lo leído hasta ahí no se presenta como completo',
    incompleta.filas.length === 2000,
    'nunca «cero» ni «todo»'
  );

  const lanza = await leerTodasLasFilas(async () => {
    throw new Error('timeout');
  });
  check('una excepción de la consulta también se devuelve como falla', lanza.falla?.includes('timeout') === true);

  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  process.exitCode = fallos === 0 ? 0 : 1;
})();
