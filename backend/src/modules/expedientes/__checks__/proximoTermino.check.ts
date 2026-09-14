import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hoyEnColombia } from '../../agenda/avisos';
import {
  DIAS_DE_ESTA_SEMANA,
  armarMisCasos,
  clasificarEnPestanas,
  documentosPorExpediente,
  terminosPorExpediente,
  type FilaDeFragmento,
  type FilaDeTerminoPendiente
} from '../terminosDelExpediente';
import type { Expediente, ExpedienteEnLista } from '../types';

/**
 * GUARDA DEL PRÓXIMO TÉRMINO DE CADA CASO Y DE LAS TRES PESTAÑAS DE «MIS CASOS».
 *
 * Run with: npm run check:proximo-termino
 *
 * Sin base de datos y sin red: todo lo que aquí se decide es una función pura
 * sobre filas falsas. Lo que se vigila son los defectos que no lanzan error:
 *  · un término cumplido que sigue apareciendo como «lo que vence»;
 *  · un término vencido que desaparece de la lista, que es el peor de todos;
 *  · un día de Bogotá leído como día UTC, que corre el plazo en uno;
 *  · una agenda que no se pudo leer presentada como «no vence nada»;
 *  · una fila de otra firma colándose en el caso de ésta.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const FIRMA = 'firma-1';
const OTRA = 'firma-2';
const HOY = '2026-09-14';

const termino = (over: Partial<FilaDeTerminoPendiente> = {}): FilaDeTerminoPendiente => ({
  id: 'a1',
  firm_id: FIRMA,
  expediente_id: 'e1',
  actuacion_nombre: 'Contestación de la demanda',
  fecha_limite: '2026-09-17',
  estado: 'PENDIENTE',
  termino_verificado: true,
  ...over
});

const expediente = (over: Partial<Expediente> = {}): Expediente => ({
  id: 'e1',
  caratula: 'Mosquera vs. ACME',
  radicado: null,
  despacho: null,
  rama: null,
  clienteId: null,
  clienteNombre: null,
  contraparte: null,
  estado: 'ACTIVO',
  notas: null,
  createdBy: 'abogada@firma.co',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
  ...over
});

/* ─── 1. EL MÁS PRÓXIMO PENDIENTE GANA ────────────────────────────────────── */

{
  const m = terminosPorExpediente(
    [
      termino({ id: 'tarde', fecha_limite: '2026-09-30' }),
      termino({ id: 'pronto', fecha_limite: '2026-09-17' }),
      termino({ id: 'medio', fecha_limite: '2026-09-20' })
    ],
    FIRMA,
    HOY
  );
  const e1 = m.get('e1');
  check('gana el pendiente con la fecha límite más cercana', e1?.proximo?.agendaId === 'pronto', String(e1?.proximo?.agendaId));
  check('los días restantes salen de la fecha guardada: del 14 al 17 son 3', e1?.proximo?.diasRestantes === 3);
  check('«qué» es la actuación tal como se guardó en la agenda', e1?.proximo?.que === 'Contestación de la demanda');
  check('se cuentan los tres pendientes', e1?.pendientes === 3);
}

{
  const m = terminosPorExpediente(
    [termino({ id: 'b', fecha_limite: '2026-09-17' }), termino({ id: 'a', fecha_limite: '2026-09-17' })],
    FIRMA,
    HOY
  );
  check('a igual fecha desempata el id, para que dos lecturas digan lo mismo', m.get('e1')?.proximo?.agendaId === 'a');
}

/* ─── 2. LO CUMPLIDO Y LO ARCHIVADO NO VENCE ─────────────────────────────── */

{
  const m = terminosPorExpediente(
    [
      termino({ id: 'cumplida', fecha_limite: '2026-09-15', estado: 'CUMPLIDA' }),
      termino({ id: 'archivada', fecha_limite: '2026-09-10', estado: 'ARCHIVADA' }),
      termino({ id: 'pendiente', fecha_limite: '2026-09-25' })
    ],
    FIRMA,
    HOY
  );
  const e1 = m.get('e1');
  check('una entrada CUMPLIDA más cercana no es el próximo término', e1?.proximo?.agendaId === 'pendiente');
  check('una ARCHIVADA vencida no aparece como vencida', e1?.vencido === null);
  check('ni cuenta como pendiente', e1?.pendientes === 1);
}

/* ─── 3. LO VENCIDO NO DESAPARECE ────────────────────────────────────────── */

{
  const m = terminosPorExpediente(
    [
      termino({ id: 'vieja', fecha_limite: '2026-09-01' }),
      termino({ id: 'ayer', fecha_limite: '2026-09-13' }),
      termino({ id: 'futura', fecha_limite: '2026-09-20' })
    ],
    FIRMA,
    HOY
  );
  const e1 = m.get('e1');
  check('el próximo término sigue siendo el de fecha ≥ hoy', e1?.proximo?.agendaId === 'futura');
  check('el vencido pendiente se conserva aparte', e1?.vencido?.agendaId === 'vieja', String(e1?.vencido?.agendaId));
  check('va marcado como vencido y con días negativos', e1?.vencido?.vencido === true && e1.vencido.diasRestantes === -13);
  check('el próximo no va marcado como vencido', e1?.proximo?.vencido === false);
  check('los vencidos cuentan como pendientes', e1?.pendientes === 3);
}

{
  const m = terminosPorExpediente([termino({ id: 'solo-vencido', fecha_limite: '2026-09-13' })], FIRMA, HOY);
  check('un caso con solo un vencido no queda como «sin términos»', m.get('e1')?.vencido?.agendaId === 'solo-vencido' && m.get('e1')?.proximo === null);
}

/* ─── 4. EL DÍA ES EL DE BOGOTÁ ──────────────────────────────────────────── */

{
  // 23:00 del 14 en Bogotá (UTC−5) son las 04:00 del 15 en UTC.
  const once = new Date('2026-09-15T04:00:00Z');
  const hoy = hoyEnColombia(once);
  check('a las 23:00 del 14 en Bogotá, «hoy» sigue siendo el 14', hoy === '2026-09-14', hoy);
  check('y no el día UTC, que ya es 15', once.toISOString().slice(0, 10) === '2026-09-15');

  const e1 = terminosPorExpediente([termino({ fecha_limite: '2026-09-14' })], FIRMA, hoy).get('e1');
  check('lo que vence el 14 a esa hora es «hoy» (0) y no vencido', e1?.proximo?.diasRestantes === 0 && e1.vencido === null);

  const medianoche = hoyEnColombia(new Date('2026-09-15T05:00:00Z'));
  const e1b = terminosPorExpediente([termino({ fecha_limite: '2026-09-14' })], FIRMA, medianoche).get('e1');
  check('una hora después, en Bogotá ya es 15 y el término venció ayer', e1b?.vencido?.diasRestantes === -1 && e1b.proximo === null);

  const manana = terminosPorExpediente([termino({ fecha_limite: '2026-09-15' })], FIRMA, HOY).get('e1');
  check('mañana es 1', manana?.proximo?.diasRestantes === 1);
}

/* ─── 5. LA MARCA DE VERIFICACIÓN VIAJA CON EL TÉRMINO ───────────────────── */

{
  const m = terminosPorExpediente(
    [
      termino({ id: 'v', expediente_id: 'e1', termino_verificado: true }),
      termino({ id: 'nv', expediente_id: 'e2', termino_verificado: false }),
      termino({ id: 'nulo', expediente_id: 'e3', termino_verificado: null })
    ],
    FIRMA,
    HOY
  );
  check('verificado cuando la entrada lo dice', m.get('e1')?.proximo?.verificado === true);
  check('sin verificar cuando la entrada dice false', m.get('e2')?.proximo?.verificado === false);
  check('un null no se lee como verificado', m.get('e3')?.proximo?.verificado === false);
}

/* ─── 6. LO SUELTO Y LO AJENO NO ENTRA ───────────────────────────────────── */

{
  const m = terminosPorExpediente(
    [
      termino({ id: 'ajena', firm_id: OTRA, fecha_limite: '2026-09-15' }),
      termino({ id: 'suelta', expediente_id: null, fecha_limite: '2026-09-15' }),
      termino({ id: 'propia', fecha_limite: '2026-09-22' })
    ],
    FIRMA,
    HOY
  );
  check('una fila de otra firma con el mismo expediente_id no se cuela', m.get('e1')?.proximo?.agendaId === 'propia');
  check('ni suma pendientes', m.get('e1')?.pendientes === 1);
  check('una entrada sin expediente no crea un caso fantasma', m.size === 1);
}

/* ─── 7. DOCUMENTOS: LOS BUSCABLES, CONTADOS POR DOCUMENTO ───────────────── */

{
  const frag = (over: Partial<FilaDeFragmento>): FilaDeFragmento => ({
    firm_id: FIRMA,
    expediente_id: 'e1',
    document_id: 'd1',
    ...over
  });
  const m = documentosPorExpediente(
    [
      frag({}),
      frag({}),
      frag({ document_id: 'd2' }),
      frag({ document_id: null }),
      frag({ firm_id: OTRA, document_id: 'd9' }),
      frag({ expediente_id: 'e2', document_id: 'd3' })
    ],
    FIRMA
  );
  check('dos fragmentos del mismo documento cuentan uno', m.get('e1') === 2, String(m.get('e1')));
  check('los fragmentos de otra firma no suman', m.get('e1') === 2);
  check('cada caso lleva lo suyo', m.get('e2') === 1);
}

/* ─── 8. «NO SÉ» NO ES «CERO» ────────────────────────────────────────────── */

{
  const lista = armarMisCasos({
    firmId: FIRMA,
    hoy: HOY,
    expedientes: [expediente()],
    terminos: { filas: [], falla: 'filas 0-999: timeout' },
    fragmentos: { filas: [], falla: null }
  });
  const e1 = lista.expedientes[0];
  check('si la agenda no se leyó, el caso lo dice', e1.terminosLeidos === false);
  check('y no dice «cero pendientes»', e1.terminosPendientes === null);
  check('la lista trae el aviso', typeof lista.avisoTerminos === 'string' && lista.avisoTerminos.length > 0);
  check('«Esta semana» no se puede calcular y no se finge vacía', lista.pestanas.estaSemana === null);
  check('«Activos» y «Cerrados» sí, porque dependen del estado', lista.pestanas.activos.length === 1);
  check('los documentos, leídos bien, sí salen', e1.documentos === 0);
}

{
  const lista = armarMisCasos({
    firmId: FIRMA,
    hoy: HOY,
    expedientes: [expediente()],
    // Una lectura PARCIAL: la primera parte llegó, la segunda falló.
    terminos: { filas: [termino({ fecha_limite: '2026-09-20' })], falla: 'filas 1000-1999: timeout' },
    fragmentos: { filas: [], falla: 'filas 0-999: timeout' }
  });
  const e1 = lista.expedientes[0];
  check('una lectura parcial tampoco se usa: el más próximo pudo estar en la parte perdida', e1.terminosLeidos === false && e1.proximoTermino === null);
  check('documentos no leídos son null, no 0', e1.documentos === null);
  check('y la lista lo avisa', typeof lista.avisoDocumentos === 'string');
}

{
  const lista = armarMisCasos({
    firmId: FIRMA,
    hoy: HOY,
    expedientes: [expediente()],
    terminos: { filas: [], falla: null },
    fragmentos: { filas: [], falla: null }
  });
  const e1 = lista.expedientes[0];
  check('un caso sin entradas, leído bien, no tiene próximo término', e1.terminosLeidos === true && e1.proximoTermino === null);
  check('y tiene cero pendientes, que aquí sí es un cero sabido', e1.terminosPendientes === 0);
  check('sin avisos', lista.avisoTerminos === null && lista.avisoDocumentos === null);
}

/* ─── 9. LAS TRES PESTAÑAS ───────────────────────────────────────────────── */

{
  const lista = armarMisCasos({
    firmId: FIRMA,
    hoy: HOY,
    expedientes: [
      expediente({ id: 'en6', updatedAt: '2026-09-10T00:00:00Z' }),
      expediente({ id: 'en3', updatedAt: '2026-09-02T00:00:00Z' }),
      expediente({ id: 'vencido', updatedAt: '2026-08-01T00:00:00Z' }),
      expediente({ id: 'en7', estado: 'SUSPENDIDO', updatedAt: '2026-09-01T00:00:00Z' }),
      expediente({ id: 'en8', updatedAt: '2026-09-11T00:00:00Z' }),
      expediente({ id: 'sinFechaViejo', updatedAt: '2026-07-01T00:00:00Z' }),
      expediente({ id: 'sinFechaNuevo', updatedAt: '2026-09-12T00:00:00Z' }),
      expediente({ id: 'terminadoConVencido', estado: 'TERMINADO', updatedAt: '2026-09-05T00:00:00Z' }),
      expediente({ id: 'archivado', estado: 'ARCHIVADO', updatedAt: '2026-09-09T00:00:00Z' })
    ],
    terminos: {
      filas: [
        termino({ id: 't6', expediente_id: 'en6', fecha_limite: '2026-09-20' }),
        termino({ id: 't3', expediente_id: 'en3', fecha_limite: '2026-09-17' }),
        termino({ id: 'tv', expediente_id: 'vencido', fecha_limite: '2026-09-10' }),
        termino({ id: 'tv2', expediente_id: 'vencido', fecha_limite: '2026-10-30' }),
        termino({ id: 't7', expediente_id: 'en7', fecha_limite: '2026-09-21' }),
        termino({ id: 't8', expediente_id: 'en8', fecha_limite: '2026-09-22' }),
        termino({ id: 'tt', expediente_id: 'terminadoConVencido', fecha_limite: '2026-09-01' })
      ],
      falla: null
    },
    fragmentos: { filas: [], falla: null }
  });

  const { estaSemana, activos, cerrados } = lista.pestanas;
  check('la ventana de «Esta semana» son 7 días de calendario', DIAS_DE_ESTA_SEMANA === 7);
  check(
    '«Esta semana»: el vencido primero, luego por fecha límite; el día 7 entra y el 8 no',
    JSON.stringify(estaSemana) === JSON.stringify(['vencido', 'en3', 'en6', 'en7']),
    JSON.stringify(estaSemana)
  );
  check(
    '«Activos» son ACTIVO + SUSPENDIDO, por urgencia y después lo tocado más reciente',
    JSON.stringify(activos) ===
      JSON.stringify(['vencido', 'en3', 'en6', 'en7', 'en8', 'sinFechaNuevo', 'sinFechaViejo']),
    JSON.stringify(activos)
  );
  check(
    '«Cerrados» son TERMINADO + ARCHIVADO, por lo tocado más reciente',
    JSON.stringify(cerrados) === JSON.stringify(['archivado', 'terminadoConVencido']),
    JSON.stringify(cerrados)
  );
  const terminado = lista.expedientes.find((e) => e.id === 'terminadoConVencido');
  check('un caso cerrado conserva su vencido a la vista en su tarjeta', terminado?.terminoVencido?.agendaId === 'tt');
}

{
  // Sin términos leídos, «Activos» cae al orden por lo tocado más reciente.
  const casos: ExpedienteEnLista[] = [
    { ...expediente({ id: 'viejo', updatedAt: '2026-01-01T00:00:00Z' }), terminosLeidos: false, proximoTermino: null, terminoVencido: null, terminosPendientes: null, documentos: null, clienteDocumento: null, personas: null },
    { ...expediente({ id: 'nuevo', updatedAt: '2026-09-01T00:00:00Z' }), terminosLeidos: false, proximoTermino: null, terminoVencido: null, terminosPendientes: null, documentos: null, clienteDocumento: null, personas: null }
  ];
  const p = clasificarEnPestanas(casos, false);
  check('sin agenda, «Activos» ordena por lo tocado más reciente', JSON.stringify(p.activos) === JSON.stringify(['nuevo', 'viejo']));
}

/* ─── 10. EL SERVICIO LEE POR FIRMA, EN LOTE Y SIN TOPE DE MIL ───────────── */

/*
 * Estas son de forma, sobre el código sin comentarios: la lista no puede
 * consultar la agenda caso por caso, y PostgREST corta en mil filas sin avisar.
 */
const sinComentarios = (fuente: string): string =>
  fuente.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');
const servicio = sinComentarios(
  readFileSync(join(process.cwd(), 'src', 'modules', 'expedientes', 'expedientes.service.ts'), 'utf8')
);

check(
  'la agenda se lee con leerTodasLasFilas, filtrada por firma y ordenada por id',
  /leerTodasLasFilas[\s\S]{0,300}\.from\('agenda_terminos'\)[\s\S]{0,300}\.eq\('firm_id', firmId\)[\s\S]{0,300}\.order\('id'\)/.test(servicio)
);
check(
  'los fragmentos se leen con leerTodasLasFilas, filtrados por firma y ordenados por id',
  /leerTodasLasFilas[\s\S]{0,300}\.from\('document_embeddings'\)[\s\S]{0,300}\.eq\('firm_id', firmId\)[\s\S]{0,300}\.order\('id'\)/.test(servicio)
);
check(
  'la lista arma los casos con la función pura, no con una consulta por caso',
  /armarMisCasos\(/.test(servicio) && !/\.map\([^)]*=>[^;]*resumenDelExpediente/.test(servicio)
);

if (fallos > 0) {
  console.log(`\n${fallos} fallo(s).`);
  process.exitCode = 1;
} else {
  console.log('\nTodo en orden.');
}
