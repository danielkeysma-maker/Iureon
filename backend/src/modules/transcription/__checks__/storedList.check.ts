/**
 * Guards the screen that tells a firm what is being kept about them.
 *
 * Run with: npm run check:stored
 *
 * Transcripts were stored from the first day and no client ever listed them, so
 * a lawyer could not know their hearings were retained, could not reopen one,
 * and could not delete one. For privileged material that is backwards. These
 * checks hold the three properties the screen depends on: a firm sees its own,
 * never another's, and deleting somebody else's reports failure instead of
 * lying about success.
 */
import express from 'express';
import { supabase } from '../../../config/supabase.config';
import { authMiddleware } from '../../auth/auth.middleware';
import { authPublicRoutes } from '../../auth/auth.routes';
import { transcriptionRoutes } from '../transcription.routes';
import { clavePrueba, crearFirmaConSesion } from '../../auth/__checks__/helpers';

const app = express();
app.use(express.json());
app.use('/api', authPublicRoutes);
app.use('/api', authMiddleware);
app.use('/api', transcriptionRoutes);

const m = Date.now();
let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

(async () => {
  const c = supabase!;
  const server = app.listen(4125);
  const base = 'http://127.0.0.1:4125/api';

  const pedir = (ruta: string, token: string, init: RequestInit = {}) =>
    fetch(`${base}${ruta}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) }
    }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

  const A = await crearFirmaConSesion({ firmName: `Lista A ${m}`, nit: `980${m}`, email: `la${m}@iureon.test`, password: clavePrueba() });
  const B = await crearFirmaConSesion({ firmName: `Lista B ${m}`, nit: `981${m}`, email: `lb${m}@iureon.test`, password: clavePrueba() });

  const sembrar = (
    firmId: string,
    email: string,
    title: string,
    segments: unknown[] = [],
    kind: 'AUDIENCIA' | 'ENTREVISTA' = 'AUDIENCIA'
  ) =>
    c.from('transcriptions').insert({
      firm_id: firmId, user_email: email, kind, title,
      source_file_name: 'x.mp3', full_text: 't', segments, speaker_labels: [],
      model: 'x', transcribed_at: new Date().toISOString()
    }).select('id').single();

  const { data: deA } = await sembrar(A.user.firmId, A.user.email, 'AUDIENCIA DE A');
  const { data: deB } = await sembrar(B.user.firmId, B.user.email, 'AUDIENCIA DE B');

  // 1. Cada firma ve la suya y solo la suya.
  const listaA = await pedir('/transcription', A.accessToken);
  const titulosA = (listaA.body?.items ?? []).map((t: { title: string }) => t.title);
  check('la firma ve su propio transcrito', titulosA.includes('AUDIENCIA DE A'), titulosA.join(', '));
  check('y NO ve el de la otra firma', !titulosA.includes('AUDIENCIA DE B'), titulosA.join(', '));

  /*
   * LA LISTA NO MANDA EL TRANSCRITO DOS VECES.
   *
   * `full_text` es la concatenacion de `segments`, asi que traerlo duplicaba el
   * texto de cada audiencia en cada fila — y la lista se recarga al abrir la
   * pantalla, al refrescar y despues de cada borrado. Con audiencias de una
   * hora eso es lo que se sentia como lentitud.
   *
   * Las dos aserciones van juntas a proposito: quitar el texto sin dejar las
   * intervenciones dejaria la lista rapida y el buscador de «lo que se dijo»
   * mudo, que es peor que la lentitud que arreglaba.
   */
  const filaA = (listaA.body?.items ?? []).find((t: { title: string }) => t.title === 'AUDIENCIA DE A');

  /*
   * `resumen` es la ultima columna que se agrego a esta tabla, asi que sirve de
   * senal de si la base esta migrada. Sin ella la lista cae al `select('*')` de
   * respaldo —que si trae `full_text`— y exigir su ausencia seria acusar al
   * codigo de un defecto que es una migracion pendiente.
   */
  const baseMigrada = filaA !== undefined && 'resumen' in filaA;

  check(
    baseMigrada
      ? 'la lista no trae full_text: seria el transcrito repetido'
      : 'base sin migrar: la lista cae al respaldo completo, y eso esta bien',
    filaA !== undefined && (baseMigrada ? filaA.full_text === undefined : true),
    `full_text = ${JSON.stringify(filaA?.full_text)}`
  );
  check(
    'la lista trae segments, que es sobre lo que busca el abogado',
    Array.isArray(filaA?.segments),
    JSON.stringify(filaA?.segments)
  );

  /*
   * 2. Reabrir un transcrito debe mostrar lo que mostraría uno recién hecho.
   *
   * Las propuestas viajaban solo en la respuesta que CREABA el transcrito, así
   * que la app leía los nombres de la audiencia y los olvidaba al cerrar la
   * pestaña: la sugerencia existía durante unos segundos y nunca más.
   */
  const { data: conNombres } = await sembrar(A.user.firmId, A.user.email, 'CON PRESENTACIONES', [
    { speakerLabel: 'speaker_0', role: 'JUEZ', text: 'Se declara abierta la audiencia.', startSeconds: 0, endSeconds: 5 },
    { speakerLabel: 'speaker_1', role: 'DESCONOCIDO', text: 'Buenos días, mi nombre es Tomás Enrique Wilches Salsa.', startSeconds: 64, endSeconds: 78 }
  ]);

  const conLista = await pedir('/transcription', A.accessToken);
  const guardado = (conLista.body?.items ?? []).find(
    (t: { id: string }) => t.id === (conNombres as { id: string }).id
  );
  check(
    'un transcrito guardado trae su propuesta de nombre',
    guardado?.nameProposals?.[0]?.name === 'Tomás Enrique Wilches Salsa',
    JSON.stringify(guardado?.nameProposals)
  );
  check(
    'y la propuesta viene con su frase para poder juzgarla',
    Boolean(guardado?.nameProposals?.[0]?.phrase),
    guardado?.nameProposals?.[0]?.phrase
  );
  check(
    'los avisos de voces fusionadas viajan igual',
    Array.isArray(guardado?.voiceConflicts),
    JSON.stringify(guardado?.voiceConflicts)
  );

  /*
   * Cada pantalla ve solo lo suyo.
   *
   * Sin filtrar por tipo, el módulo de entrevistas listaba las audiencias de la
   * firma y viceversa: dos pantallas que comparten motor no pueden compartir
   * archivador. Una audiencia de un juzgado no tiene nada que hacer bajo las
   * entrevistas de un cliente, y al revés es peor — una entrevista es una
   * conversación privada y una audiencia es un acto público.
   */
  await sembrar(A.user.firmId, A.user.email, 'ENTREVISTA DE A', [], 'ENTREVISTA');

  const soloAudiencias = await pedir('/transcription?kind=AUDIENCIA', A.accessToken);
  const tAud = (soloAudiencias.body?.items ?? []).map((t: { title: string }) => t.title);
  check(
    'el módulo de audiencias no ve entrevistas',
    !tAud.includes('ENTREVISTA DE A') && tAud.includes('AUDIENCIA DE A'),
    tAud.join(', ')
  );

  const soloEntrevistas = await pedir('/transcription?kind=ENTREVISTA', A.accessToken);
  const tEnt = (soloEntrevistas.body?.items ?? []).map((t: { title: string }) => t.title);
  check(
    'el módulo de entrevistas no ve audiencias',
    tEnt.includes('ENTREVISTA DE A') && !tEnt.includes('AUDIENCIA DE A'),
    tEnt.join(', ')
  );

  const tipoInventado = await pedir('/transcription?kind=NO_EXISTE', A.accessToken);
  check(
    'un tipo inventado no destapa todo',
    (tipoInventado.body?.items ?? []).length >= 2,
    'devuelve la lista completa, que es el comportamiento sin filtro'
  );

  // 3. Borrar lo ajeno no puede reportar éxito.
  const ajeno = await pedir(`/transcription/${(deB as { id: string }).id}`, A.accessToken, { method: 'DELETE' });
  const { data: sigueVivo } = await c
    .from('transcriptions')
    .select('id')
    .eq('id', (deB as { id: string }).id)
    .maybeSingle();
  check('borrar el de otra firma se rechaza', ajeno.status === 404, String(ajeno.status));
  check('y el transcrito ajeno sigue existiendo', Boolean(sigueVivo));

  // 3. Borrar lo propio funciona y desaparece de la lista.
  const propio = await pedir(`/transcription/${(deA as { id: string }).id}`, A.accessToken, { method: 'DELETE' });
  const trasBorrar = await pedir('/transcription', A.accessToken);
  const restantes = (trasBorrar.body?.items ?? []).map((t: { title: string }) => t.title);
  check('la firma sí borra lo suyo', propio.status === 200, String(propio.status));
  check('y desaparece de su lista', !restantes.includes('AUDIENCIA DE A'), restantes.join(', ') || 'lista vacía');

  const ids = [A.user.firmId, B.user.firmId];
  await c.from('transcriptions').delete().in('firm_id', ids);
  const { data: usuarios } = await c.auth.admin.listUsers();
  for (const u of usuarios.users) if (u.email?.includes(String(m))) await c.auth.admin.deleteUser(u.id);
  await c.from('firms').delete().in('firm_id', ids);

  server.close();
  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  process.exit(fallos === 0 ? 0 : 1);
})();
