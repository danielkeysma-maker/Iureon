import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SIN_CON_QUE,
  interrogatoriosMasNuevoPrimero,
  lineaDeConQue,
  type PreguntaParaAlguien
} from '../types';

/**
 * LOS INTERROGATORIOS GUARDADOS, EN LA PANTALLA.
 *
 * Run with: npm run check:interrogatorios-cara
 *
 * Pura: sin React, sin red. Vigila las cuatro cosas que decidirían si el
 * abogado vuelve a pagar por lo que ya compró:
 *
 *   1. LA LISTA SIEMPRE EN EL MISMO ORDEN, la más nueva primero, también
 *      cuando la tanda recién hecha se añade sin recargar. Una lista que se
 *      reordena sola al recargar hace dudar de si se guardó.
 *   2. ABRIR NO COBRA. Ni un POST, ni una llamada a `preguntas(` en el camino
 *      de abrir: es un GET de lo que ya se pagó.
 *   3. «El expediente no tiene con qué contradecirlo» SOLO cuando hubo
 *      pasajes que mirar. Sin material sería un hallazgo inventado.
 *   4. LO EXPORTADO LLEVA LO ANTICIPADO. A la audiencia se entra con la hoja
 *      impresa: una hoja sin la respuesta probable y sin el «con qué» deja al
 *      colega sin la mitad que preparó.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const leer = (rel: string): string => readFileSync(join(SRC, rel), 'utf8');

const sinComentarios = (fuente: string): string =>
  fuente.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ').replace(/\/\/.*$/gm, ' ');

/* ─── 1. EL ORDEN DE LA LISTA ───────────────────────────────────────────── */

const tanda = (id: string, creadoEl: string) => ({ id, creadoEl });
const mezclada = [
  tanda('b', '2026-09-14T10:00:00.000Z'),
  tanda('a', '2026-09-16T08:30:00.000Z'),
  tanda('c', '2026-09-15T23:59:00.000Z')
];
check(
  'la más nueva va primero',
  interrogatoriosMasNuevoPrimero(mezclada).map((x) => x.id).join('') === 'acb',
  interrogatoriosMasNuevoPrimero(mezclada).map((x) => x.id).join('')
);
check(
  'dos del mismo día se ordenan por la hora, no por el orden en que llegaron',
  interrogatoriosMasNuevoPrimero([
    tanda('tarde', '2026-09-16T18:00:00.000Z'),
    tanda('manana', '2026-09-16T08:00:00.000Z')
  ])
    .map((x) => x.id)
    .join('') === 'tardemanana'
);
check(
  'ordenar no muta la lista que recibe: la pantalla la comparte con el estado',
  (() => {
    const original = [...mezclada];
    interrogatoriosMasNuevoPrimero(mezclada);
    return mezclada.every((x, i) => x === original[i]);
  })()
);
check('una lista vacía se ordena sin quejarse', interrogatoriosMasNuevoPrimero([]).length === 0);

/* ─── 2. LO QUE SE DICE DEL «CON QUÉ» ───────────────────────────────────── */

const conCita: PreguntaParaAlguien = {
  pregunta: '¿Recibió el inmueble el quince de marzo?',
  paraQue: 'Fijar la fecha.',
  conQue: { documento: 'Acta de entrega.pdf', cita: 'entregado el quince de marzo' }
};
const sinCita: PreguntaParaAlguien = { pregunta: '¿Y después?', paraQue: 'Seguir el relato.' };

check(
  'con cita comprobada se nombra el documento y se entrecomilla el fragmento',
  lineaDeConQue(conCita, true) === 'Con qué: Acta de entrega.pdf — «entregado el quince de marzo»',
  String(lineaDeConQue(conCita, true))
);
check(
  'sin cita pero con material del caso, se afirma que no hay con qué',
  lineaDeConQue(sinCita, true) === SIN_CON_QUE
);
check(
  'sin material del caso NO se afirma nada: no se leyó ningún documento',
  lineaDeConQue(sinCita, false) === null && lineaDeConQue(sinCita, undefined) === null
);
check(
  'y una tanda vieja, sin el campo, tampoco inventa el hallazgo',
  lineaDeConQue(sinCita, undefined) === null
);
check(
  'la cita manda sobre el material: si está comprobada, se publica aunque el campo falte',
  lineaDeConQue(conCita, undefined)?.includes('Acta de entrega.pdf') === true
);

/* ─── 3. LA PANTALLA ────────────────────────────────────────────────────── */

const PANEL = leer('modules/expedientes/components/PreguntasDelExpedientePanel.tsx');
const PANEL_CODIGO = sinComentarios(PANEL);

check(
  'la lista de guardados se lee al abrir el caso, sin pulsar nada',
  /expedientesApi\s*\.interrogatorios\(expediente\.id\)/.test(PANEL_CODIGO) &&
    PANEL_CODIGO.includes('}, [expediente.id]);')
);
check('y se ordena con el ayudante probado aquí', PANEL_CODIGO.includes('interrogatoriosMasNuevoPrimero('));
check(
  'abrir una tanda guardada NO pasa por el camino que cobra',
  (() => {
    const abrir = PANEL_CODIGO.slice(
      PANEL_CODIGO.indexOf('const abrir = async'),
      PANEL_CODIGO.indexOf('const confirmacionDeBorrado')
    );
    return abrir.includes('expedientesApi.abrirInterrogatorio(') && !abrir.includes('expedientesApi.preguntas(');
  })()
);
check('y la pantalla lo dice, para que nadie dude antes de pulsar', PANEL.includes('no consume saldo'));
check(
  'un fallo al leer la lista no se pinta como «no hay ninguno»',
  PANEL_CODIGO.includes('setErrorLista(')
);
check(
  'una tanda que se cobró y no se pudo guardar se dice, no se calla',
  PANEL_CODIGO.includes('setNoSeGuardo(true)') && PANEL.includes('no se pudo guardar en el expediente')
);
check('eliminar pasa por el diálogo de confirmación compartido', PANEL_CODIGO.includes('<ConfirmarDialog'));
check(
  'y avisa de que volver a tenerlo cuesta saldo',
  PANEL.includes('consume saldo de la firma') && PANEL.includes('Esto no se deshace')
);
check(
  'el encabezado de la hoja sale de la tanda abierta, no de lo que haya en el formulario',
  PANEL_CODIGO.includes('abierto?.queSeQueriaProbar.trim()') && PANEL_CODIGO.includes('abierto?.audiencia.trim()')
);
check(
  'la frase de «sin con qué» solo se pinta con material del caso',
  PANEL_CODIGO.includes('conMaterial && (') && PANEL_CODIGO.includes('{SIN_CON_QUE}')
);
check('la cita va en mono, que es lo citable', PANEL_CODIGO.includes('cn-exp-mono'));
check(
  'el documento solo se vuelve botón cuando se pudo identificar de verdad',
  PANEL_CODIGO.includes('documentosPorTitulo?.get(p.conQue.documento)') && PANEL_CODIGO.includes('documentId ? (')
);
for (const campo of ['respuestaProbable', 'repregunta']) {
  check(`la pregunta pinta "${campo}"`, PANEL_CODIGO.includes(`p.${campo}`));
}

/* ─── 4. LO EXPORTADO ───────────────────────────────────────────────────── */

const EXPORT = sinComentarios(leer('modules/expedientes/services/preguntasExport.service.ts'));
check('el texto para copiar lleva la respuesta probable', EXPORT.includes('lineas.push(`   Probablemente conteste: ${q.respuestaProbable}`)'));
check('y la repregunta', EXPORT.includes('lineas.push(`   Si contesta eso: ${q.repregunta}`)'));
check(
  'los tres formatos escriben el «con qué» por el MISMO ayudante, para que no digan cosas distintas',
  (EXPORT.match(/lineaDeConQue\(q, g\.conMaterial\)/g) ?? []).length === 3,
  `${(EXPORT.match(/lineaDeConQue\(/g) ?? []).length} usos`
);
check(
  'Word lleva los dos campos nuevos',
  EXPORT.includes('Probablemente conteste: ${q.respuestaProbable}`, { size: base - 2') &&
    EXPORT.includes('Si contesta eso: ${q.repregunta}`, { size: base - 2')
);
check(
  'y el PDF también',
  EXPORT.includes("escribir(`Probablemente conteste: ${q.respuestaProbable}`") &&
    EXPORT.includes("escribir(`Si contesta eso: ${q.repregunta}`")
);

/* ─── 5. LA AUDITORÍA NOMBRA LA ACCIÓN NUEVA ────────────────────────────── */

const REGISTRO = leer('modules/audit/registro.ts');
check('la acción nueva tiene nombre en español', REGISTRO.includes("EXPEDIENTE_INTERROGATORIO: 'Preparó un interrogatorio'"));
check(
  'y entra en la vista de audiencias, junto con su borrado',
  REGISTRO.includes("'EXPEDIENTE_INTERROGATORIO', 'EXPEDIENTE_INTERROGATORIO_DELETED'] }")
);
check(
  'eliminar un interrogatorio también tiene nombre en español: es material pagado y sin papelera',
  REGISTRO.includes("EXPEDIENTE_INTERROGATORIO_DELETED: 'Eliminó un interrogatorio preparado'")
);

console.log('');
if (fallos === 0) {
  console.log('ALL CHECKS PASSED');
} else {
  console.log(`${fallos} FALLA(S)`);
  process.exitCode = 1;
}
