/**
 * Los dos estados que ordenan las listas: revision de audiencias y decision de
 * entrevistas. String.includes, nunca regex en strings: una regex con
 * backslashes colapsados no falla — deja de encontrar y pasa en verde.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const STORE = readFileSync(join(__dirname, '..', 'transcriptionStore.service.ts'), 'utf8');
const SQL = readFileSync(
  join(__dirname, '..', '..', '..', '..', '..', 'supabase', 'migration-transcripciones-estados.sql'),
  'utf8'
);

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' - ' + d : ''}`);
  if (!ok) fallos += 1;
};

/*
 * --- ACTA LISTA SOLO LO DA UNA PERSONA -------------------------------------
 * El estado nace POR_REVISAR y ningun proceso automatico lo cambia: el unico
 * camino es marcarRevision, que registra quien y cuando.
 */
check(
  'el estado de revision nace POR_REVISAR en la base',
  SQL.includes("DEFAULT 'POR_REVISAR'"),
  ''
);

check(
  'marcar acta lista registra quien y cuando',
  STORE.includes('revisada_por: por') && STORE.includes('revisada_el: new Date().toISOString()'),
  ''
);

check(
  'volver a revisar borra la firma anterior',
  STORE.includes('revisada_por: null') && STORE.includes('revisada_el: null'),
  ''
);

/*
 * --- DECLINAR EXIGE MOTIVO, EN DOS CAPAS -----------------------------------
 * El servicio lanza con mensaje en espanol; la base lo impone con CHECK por si
 * alguien escribe directo. Ninguna capa confia en la otra.
 */
check(
  'el servicio rechaza declinar sin motivo',
  STORE.includes("decision === 'DECLINADO' && !motivo") && STORE.includes('throw new Error'),
  ''
);

check(
  'la base tambien lo impone, sin confiar en la pantalla',
  SQL.includes("decision <> 'DECLINADO' OR decision_motivo IS NOT NULL"),
  ''
);

check(
  'reabrir una decision limpia quien y cuando',
  STORE.includes("decidido_por: decision === 'SIN_DECIDIR' ? null : por"),
  ''
);

/*
 * --- LA LISTA ES DE LA FIRMA -----------------------------------------------
 * Filtraba por user_email y escondia el trabajo de la firma de si misma — el
 * mismo defecto ya corregido en borradores. Si el filtro vuelve, esto falla.
 */
const bloqueList = STORE.split('async list(')[1]?.split('async ')[0] ?? '';
check(
  'la lista de transcripciones es de la firma, no de la persona',
  !bloqueList.includes("eq('user_email'"),
  ''
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
