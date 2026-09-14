import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  TANDA_DE_IDS,
  datosDeBusquedaPorExpediente,
  leerEnTandas,
  type FilaDeActorDeLaLista,
  type FilaDeClienteDeLaLista
} from '../busquedaDeLaLista';
import { armarMisCasos } from '../terminosDelExpediente';
import type { Expediente } from '../types';

/**
 * GUARDA DE LOS DATOS CON LOS QUE SE BUSCA UN CASO EN LA LISTA.
 *
 * Run with: npm run check:busqueda-lista
 *
 * El 14 de septiembre el dueño pidió encontrar un caso por la cédula o el NIT,
 * por el nombre de cualquier persona del caso o por el radicado. Para eso la
 * lista trae, de cada caso, el documento del cliente y las personas
 * registradas. Sin base y sin red; lo que se vigila es lo que no lanza error:
 *  · una persona de otra firma colándose en la lista de ésta;
 *  · una lectura fallida presentada como «este caso no tiene personas»;
 *  · una lectura cortada en mil filas, o una URL con mil ids;
 *  · campos de más en la respuesta (notas, «sobre qué»), que son contenido.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const FIRMA = 'firma-1';
const OTRA = 'firma-2';

const expediente = (over: Partial<Expediente> = {}): Expediente => ({
  id: 'e1',
  caratula: 'Caso 00',
  radicado: null,
  despacho: null,
  rama: null,
  clienteId: null,
  clienteNombre: null,
  contraparte: null,
  estado: 'ACTIVO',
  notas: null,
  createdBy: 'u',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...over
});

const cliente = (over: Partial<FilaDeClienteDeLaLista> = {}): FilaDeClienteDeLaLista => ({
  id: 'c1',
  firm_id: FIRMA,
  full_name: 'Cliente 00',
  document_id: '0000000000',
  ...over
});

const actor = (over: Partial<FilaDeActorDeLaLista> = {}): FilaDeActorDeLaLista => ({
  id: 'a1',
  expediente_id: 'e1',
  nombre: 'Persona 00',
  identificacion: null,
  papel: 'PARTE',
  lado: 'CONTRARIO',
  ...over
});

/* ─── 1. LO QUE CADA CASO TRAE ───────────────────────────────────────────── */

{
  const r = datosDeBusquedaPorExpediente({
    firmId: FIRMA,
    expedientes: [expediente({ clienteId: 'c1' }), expediente({ id: 'e2' })],
    clientes: { filas: [cliente()], falla: null },
    actores: {
      filas: [
        actor(),
        actor({ id: 'a2', nombre: 'Testigo 00', identificacion: '00.000.000', papel: 'TESTIGO', lado: 'PROPIO' }),
        actor({ id: 'a3', expediente_id: 'e2', nombre: 'Perito 00', papel: 'PERITO', lado: 'NEUTRAL' })
      ],
      falla: null
    }
  });
  const e1 = r.porExpediente.get('e1');
  const e2 = r.porExpediente.get('e2');
  check('el caso con cliente trae el documento de la ficha', e1?.clienteDocumento === '0000000000', String(e1?.clienteDocumento));
  check('y el nombre del cliente sigue resolviéndose aquí', e1?.clienteNombre === 'Cliente 00');
  check('el caso sin cliente trae documento null', e2?.clienteDocumento === null);
  check('cada caso trae sus personas y solo las suyas', e1?.personas?.length === 2 && e2?.personas?.length === 1);
  check(
    'la persona trae exactamente nombre, identificación, papel y lado',
    JSON.stringify(Object.keys(e1?.personas?.[1] ?? {}).sort()) === JSON.stringify(['identificacion', 'lado', 'nombre', 'papel']),
    JSON.stringify(e1?.personas?.[1])
  );
  check('la identificación se entrega tal como se guardó', e1?.personas?.[1].identificacion === '00.000.000');
  check('la cuenta de actores sale de la misma lectura', e1?.actores === 2 && e2?.actores === 1);
  check('sin fallas no hay aviso', r.aviso === null);
}

/* ─── 2. LO DE OTRA FIRMA NO ENTRA ───────────────────────────────────────── */

{
  const r = datosDeBusquedaPorExpediente({
    firmId: FIRMA,
    expedientes: [expediente({ clienteId: 'c9' })],
    clientes: { filas: [cliente({ id: 'c9', firm_id: OTRA, document_id: '9999999999' })], falla: null },
    actores: { filas: [actor({ expediente_id: 'e-de-otra-firma' })], falla: null }
  });
  const e1 = r.porExpediente.get('e1');
  check('un cliente de otra firma no presta su documento', e1?.clienteDocumento === null && e1?.clienteNombre === null);
  check('un actor de un expediente que no es de esta lista no se asigna a nadie', e1?.personas?.length === 0);
}

/* ─── 3. «NO SE LEYÓ» NO ES «NO HAY» ─────────────────────────────────────── */

{
  const r = datosDeBusquedaPorExpediente({
    firmId: FIRMA,
    expedientes: [expediente({ clienteId: 'c1' })],
    clientes: { filas: [cliente()], falla: null },
    actores: { filas: [actor()], falla: 'filas 1000-1999: timeout' }
  });
  const e1 = r.porExpediente.get('e1');
  check('si los actores no se leyeron, las personas son null y no una lista vacía', e1?.personas === null);
  check('ni una cuenta de cero actores', e1?.actores === undefined);
  check('y la lista lo avisa', typeof r.aviso === 'string' && /personas/.test(r.aviso ?? ''), String(r.aviso));
}

{
  const r = datosDeBusquedaPorExpediente({
    firmId: FIRMA,
    expedientes: [expediente({ clienteId: 'c1' })],
    clientes: { filas: [], falla: 'filas 0-999: timeout' },
    actores: { filas: [], falla: null }
  });
  const e1 = r.porExpediente.get('e1');
  check('si los clientes no se leyeron, el documento no se inventa', e1?.clienteDocumento === null);
  check('las personas, leídas bien, sí son una lista vacía sabida', Array.isArray(e1?.personas) && e1?.personas?.length === 0);
  check('y la lista avisa de los documentos de los clientes', /clientes/.test(r.aviso ?? ''), String(r.aviso));
}

/* ─── 4. ARMAR «MIS CASOS» CON LOS DATOS DE BÚSQUEDA ─────────────────────── */

{
  const lista = armarMisCasos({
    firmId: FIRMA,
    hoy: '2026-09-14',
    expedientes: [expediente({ clienteId: 'c1' })],
    terminos: { filas: [], falla: null },
    fragmentos: { filas: [], falla: null },
    clientes: { filas: [cliente()], falla: null },
    actores: { filas: [actor()], falla: null }
  });
  const e1 = lista.expedientes[0];
  check('la lista trae clienteDocumento y personas en cada caso', e1.clienteDocumento === '0000000000' && e1.personas?.length === 1);
  check('la fecha de registro sigue viajando como createdAt', e1.createdAt === '2026-01-01T00:00:00Z');
  check('sin fallas, avisoBusqueda es null', lista.avisoBusqueda === null);
}

{
  const lista = armarMisCasos({
    firmId: FIRMA,
    hoy: '2026-09-14',
    expedientes: [expediente()],
    terminos: { filas: [], falla: null },
    fragmentos: { filas: [], falla: null }
  });
  check('quien no pasa las lecturas de búsqueda no recibe «no hay personas»', lista.expedientes[0].personas === null);
  check('y recibe el aviso', typeof lista.avisoBusqueda === 'string');
}

/* ─── 5. LAS LECTURAS POR TANDAS ─────────────────────────────────────────── */

void (async () => {
  const ids = Array.from({ length: TANDA_DE_IDS * 2 + 5 }, (_, i) => `id-${i}`);
  const pedidas: number[] = [];
  const r = await leerEnTandas(ids, async (tanda) => {
    pedidas.push(tanda.length);
    return { filas: tanda.map((id) => ({ id })), falla: null };
  });
  check('mil ids no viajan en una sola URL: se parten en tandas', pedidas.length === 3 && pedidas.every((n) => n <= TANDA_DE_IDS), JSON.stringify(pedidas));
  check('y se juntan todas las filas', r.filas.length === ids.length && r.falla === null);

  const vacia = await leerEnTandas([], async () => {
    throw new Error('no debía llamarse');
  });
  check('sin ids no se consulta nada', vacia.filas.length === 0 && vacia.falla === null);

  let n = 0;
  const conFalla = await leerEnTandas(ids, async (tanda) => {
    n++;
    return n === 2 ? { filas: [], falla: 'filas 0-999: timeout' } : { filas: tanda.map((id) => ({ id })), falla: null };
  });
  check('una tanda fallida hace fallida la lectura entera', conFalla.falla !== null, String(conFalla.falla));

  const lanza = await leerEnTandas(ids, async () => {
    throw new Error('red caída');
  });
  check('una tanda que lanza también es falla, no una lista vacía', lanza.falla !== null && /red caída/.test(lanza.falla ?? ''));

  /* ─── 6. EL SERVICIO: POR FIRMA, EN LOTE, SIN CONTENIDO DE MÁS ─────────── */
  const sinComentarios = (fuente: string): string => fuente.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');
  const servicio = sinComentarios(
    readFileSync(join(process.cwd(), 'src', 'modules', 'expedientes', 'expedientes.service.ts'), 'utf8')
  );
  const i = servicio.indexOf('export const listarExpedientes');
  const lista = servicio.slice(i, servicio.indexOf('export const resumenDelExpediente'));
  check(
    'los clientes de la lista se leen filtrados por firma, con su documento',
    /\.from\('clients'\)[\s\S]{0,200}\.select\('id, firm_id, full_name, document_id'\)[\s\S]{0,200}\.eq\('firm_id', firmId\)/.test(lista)
  );
  check(
    'los actores de la lista se leen con cuatro campos y nada de contenido',
    /\.from\('expediente_actores'\)[\s\S]{0,120}\.select\('id, expediente_id, nombre, identificacion, papel, lado'\)/.test(lista) &&
      !/sobre_que|notas/.test(lista.slice(lista.indexOf("from('expediente_actores')"), lista.indexOf("from('expediente_actores')") + 400))
  );
  check('las dos lecturas van por tandas y sin tope de mil', (lista.match(/leerEnTandas\(/g) ?? []).length === 2 && (lista.match(/leerTodasLasFilas/g) ?? []).length === 2);
  check('y ordenadas por id, que es único', (lista.match(/\.order\('id'\)/g) ?? []).length >= 2);
  check('ninguna consulta por caso dentro de un map', !/filas\.map\(\s*async/.test(lista));
  check('la lista las pasa a armarMisCasos', /armarMisCasos\(\{[\s\S]*clientes[\s\S]*actores[\s\S]*\}\)/.test(lista));

  if (fallos > 0) {
    console.log(`\n${fallos} fallo(s).`);
    process.exitCode = 1;
  } else {
    console.log('\nTodo en orden.');
  }
})();
