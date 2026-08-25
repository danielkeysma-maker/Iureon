/**
 * Guards the client file, which holds the most private material in the product.
 *
 * Run with: npm run check:clients
 *
 * A client's cédula, telephone and the account of what they told their lawyer
 * are not ordinary tenant data — they are a third party's, held by the firm
 * under professional secrecy, with Iureon as the encargado. So the isolation is
 * tested from both directions: a firm sees its own and never another's, and no
 * operation reaches across by naming an id it happens to know.
 */
import { supabase } from '../../../config/supabase.config';
import { clavePrueba, crearFirmaConSesion } from '../../auth/__checks__/helpers';
import {
  ClientError,
  deleteClient,
  interviewSegments,
  linkTranscription,
  listClients,
  registerClient,
  updateClient
} from '../clients.service';
import { suggestForInterview } from '../interviewInsights.service';
import type { TranscriptSegment } from '../../transcription/types';

const m = Date.now();
let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

(async () => {
  const c = supabase!;

  const A = await crearFirmaConSesion({
    firmName: `Clientes A ${m}`,
    nit: `990${m}`,
    email: `ca${m}@iureon.test`,
    password: clavePrueba()
  });
  const B = await crearFirmaConSesion({
    firmName: `Clientes B ${m}`,
    nit: `991${m}`,
    email: `cb${m}@iureon.test`,
    password: clavePrueba()
  });

  // ─── Registro ─────────────────────────────────────────────────────────────
  const cliente = await registerClient(A.user.firmId, A.user.email, {
    fullName: 'Osiris García Wilches',
    // Con puntos a propósito: así lo escribe una persona.
    documentId: '1.102.811.692',
    email: 'osiris@ejemplo.co',
    phone: '3001234567'
  });

  check('la cédula se guarda sin puntos', cliente.documentId === '1102811692', cliente.documentId);

  let duplicado = '';
  try {
    // El mismo documento escrito distinto NO puede crear una segunda ficha.
    await registerClient(A.user.firmId, A.user.email, {
      fullName: 'Osiris García',
      documentId: '1102811692'
    });
  } catch (err) {
    duplicado = err instanceof ClientError ? err.code : 'otro error';
  }
  check('el mismo documento no crea dos fichas', duplicado === 'CLIENT_EXISTS', duplicado);

  let sinDatos = '';
  try {
    await registerClient(A.user.firmId, A.user.email, { fullName: '', documentId: '' });
  } catch (err) {
    sinDatos = err instanceof ClientError ? err.code : 'otro error';
  }
  check('un cliente sin nombre ni documento se rechaza', sinDatos === 'INVALID_CLIENT', sinDatos);

  // La MISMA cédula en OTRA firma sí puede existir: dos despachos atienden al
  // mismo ciudadano y ninguno debe enterarse del otro.
  const mismoEnB = await registerClient(B.user.firmId, B.user.email, {
    fullName: 'Osiris García Wilches',
    documentId: '1102811692'
  });
  check('otra firma puede tener al mismo ciudadano', Boolean(mismoEnB.id));

  // ─── Aislamiento ──────────────────────────────────────────────────────────
  const deA = await listClients(A.user.firmId);
  check(
    'cada firma ve solo sus propios clientes',
    deA.length === 1 && deA[0].id === cliente.id,
    `${deA.length} clientes`
  );

  let ajeno = '';
  try {
    await updateClient(A.user.firmId, mismoEnB.id, { phone: '3009999999' });
  } catch (err) {
    ajeno = err instanceof ClientError ? err.code : 'otro error';
  }
  check('no se puede editar el cliente de otra firma', ajeno === 'NOT_FOUND', ajeno);

  check('ni borrarlo', (await deleteClient(A.user.firmId, mismoEnB.id)) === false);

  // ─── Entrevista vinculada ─────────────────────────────────────────────────
  const { data: entrevista } = await c
    .from('transcriptions')
    .insert({
      firm_id: A.user.firmId,
      user_email: A.user.email,
      kind: 'ENTREVISTA',
      title: 'Entrevista inicial',
      source_file_name: 'e.mp3',
      full_text: 't',
      segments: [
        {
          speakerLabel: 'speaker_0',
          role: 'ABOGADO',
          text: 'Cuénteme qué ocurrió con el vehículo.',
          startSeconds: 0,
          endSeconds: 5
        },
        {
          speakerLabel: 'speaker_1',
          role: 'CLIENTE',
          text:
            'Me embargaron el vehículo dentro de un proceso ejecutivo y el juzgado no ha resuelto ' +
            'la solicitud de desembargo que presenté hace más de seis meses, pese a que ya pagué la obligación.',
          startSeconds: 6,
          endSeconds: 40
        }
      ],
      speaker_labels: ['speaker_0', 'speaker_1'],
      model: 'x',
      transcribed_at: new Date().toISOString()
    })
    .select('id')
    .single();

  const entrevistaId = (entrevista as { id: string }).id;

  check('la entrevista se vincula al cliente', await linkTranscription(A.user.firmId, entrevistaId, cliente.id));

  const conCuenta = await listClients(A.user.firmId);
  check('el cliente muestra cuántas entrevistas tiene', conCuenta[0].interviews === 1, String(conCuenta[0].interviews));

  let cruzado = '';
  try {
    // Vincular la entrevista de A a un cliente de B: ambos ids son adivinables.
    await linkTranscription(A.user.firmId, entrevistaId, mismoEnB.id);
  } catch (err) {
    cruzado = err instanceof ClientError ? err.code : 'otro error';
  }
  check('no se puede vincular a un cliente de otra firma', cruzado === 'NOT_FOUND', cruzado);

  check(
    'otra firma no puede leer los segmentos de esa entrevista',
    (await interviewSegments(B.user.firmId, entrevistaId)) === null
  );

  // ─── Sugerencias ──────────────────────────────────────────────────────────
  const segmentos = (await interviewSegments(A.user.firmId, entrevistaId)) as TranscriptSegment[];
  check('la firma sí lee los suyos', segmentos?.length === 2, String(segmentos?.length));

  const soloAbogado = await suggestForInterview([
    { speakerLabel: 'speaker_0', role: 'ABOGADO', text: 'Buenos días, cuénteme.', startSeconds: 0, endSeconds: 3 }
  ]);
  check(
    'sin intervenciones del cliente no inventa sugerencias',
    soloAbogado.suggestions.length === 0 && Boolean(soloAbogado.reason),
    soloAbogado.reason
  );

  const conCliente = await suggestForInterview(segmentos);
  check(
    'con el cliente identificado devuelve algo o dice por qué no',
    conCliente.suggestions.length > 0 || Boolean(conCliente.reason),
    conCliente.suggestions.length > 0
      ? `${conCliente.suggestions.length} sugerencias · la primera de «${conCliente.suggestions[0].fromClient.slice(0, 40)}…»`
      : conCliente.reason
  );
  check(
    'cada sugerencia dice qué palabras del cliente la produjeron',
    conCliente.suggestions.every((s) => s.fromClient.length > 0)
  );

  // ─── Borrar la ficha no borra lo que se dijo ──────────────────────────────
  check('la ficha del cliente se borra', await deleteClient(A.user.firmId, cliente.id));

  const { data: sobrevive } = await c
    .from('transcriptions')
    .select('id, client_id')
    .eq('id', entrevistaId)
    .maybeSingle();
  check(
    'y la entrevista sobrevive, sin cliente',
    Boolean(sobrevive) && (sobrevive as { client_id: string | null }).client_id === null,
    JSON.stringify(sobrevive)
  );

  // ─── Limpieza ─────────────────────────────────────────────────────────────
  const ids = [A.user.firmId, B.user.firmId];
  await c.from('transcriptions').delete().in('firm_id', ids);
  await c.from('clients').delete().in('firm_id', ids);
  const { data: usuarios } = await c.auth.admin.listUsers();
  for (const u of usuarios.users) {
    if (u.email?.includes(String(m))) await c.auth.admin.deleteUser(u.id);
  }
  await c.from('firms').delete().in('firm_id', ids);

  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  process.exit(fallos === 0 ? 0 : 1);
})();
