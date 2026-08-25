import { supabase } from '../config/supabase.config';

/**
 * Adopts data that belongs to a firm which never had a registry row.
 *
 * WHY THIS IS NEEDED ONCE. Before real authentication, a firm existed only as a
 * string in a browser's localStorage: the registration form invented an id, the
 * client sent it as `x-firm-id`, and the server believed it. The `firms` table
 * stayed empty the whole time, so every hearing transcribed in that period is
 * filed under a tenant that no session can ever belong to. The rows are intact
 * and unreachable, which is the worst combination — the work exists and the
 * lawyer cannot open it.
 *
 * WHAT IT DOES. Moves those rows to a firm that DOES exist, and stamps them
 * with that firm's administrator so they show up in their own list. The
 * transcript text, segments, roles and timestamps are untouched: this changes
 * who owns the record, never what it says.
 *
 * WHY IT ASKS FOR A NIT. Because a firm id is not something to type from
 * memory, and the NIT is on the registration form. The destination must already
 * exist — this tool cannot create a tenant, only hand data to one.
 *
 *   npm run adopt -- <NIT de la firma destino>
 *   npm run adopt -- <NIT> --apply     (sin esto solo informa)
 */

const nit = process.argv[2];
const aplicar = process.argv.includes('--apply');

const salir: (mensaje: string) => never = (mensaje) => {
  console.error(mensaje);
  process.exit(1);
};

(async () => {
  if (!nit) salir('Uso: npm run adopt -- <NIT de la firma destino> [--apply]');

  const client = supabase;
  if (!client) salir('Supabase no está configurado.');

  const { data: destino } = await client
    .from('firms')
    .select('firm_id, name')
    .eq('nit', nit)
    .maybeSingle();

  if (!destino) {
    salir(
      `No hay ninguna firma registrada con el NIT ${nit}.\n` +
        'Regístrala primero desde la aplicación: la adopción entrega datos a un inquilino que ya existe, no lo crea.'
    );
  }

  const firmaDestino = (destino as { firm_id: string; name: string }).firm_id;
  const nombreDestino = (destino as { firm_id: string; name: string }).name;

  // El administrador de la firma, para que los transcritos aparezcan en su lista.
  const { data: usuarios } = await client.auth.admin.listUsers();
  const admin = usuarios.users.find(
    (u) => (u.app_metadata as Record<string, unknown>)?.firm_id === firmaDestino
  );

  if (!admin?.email) {
    salir(`La firma ${nombreDestino} no tiene ninguna cuenta asociada todavía.`);
  }

  const correo = admin!.email as string;

  const { data: firmas } = await client.from('firms').select('firm_id');
  const registradas = new Set((firmas ?? []).map((f) => (f as { firm_id: string }).firm_id));

  const { data: transcritos } = await client.from('transcriptions').select('id, firm_id, title');
  const huerfanos = ((transcritos ?? []) as { id: string; firm_id: string; title: string }[]).filter(
    (t) => !registradas.has(t.firm_id)
  );

  if (huerfanos.length === 0) {
    console.log('No hay transcritos huérfanos. Nada que adoptar.');
    return;
  }

  const porFirma = new Map<string, number>();
  for (const t of huerfanos) porFirma.set(t.firm_id, (porFirma.get(t.firm_id) ?? 0) + 1);

  console.log(`Destino: ${nombreDestino} (${firmaDestino}), cuenta ${correo}`);
  console.log(`Transcritos huérfanos: ${huerfanos.length}`);
  for (const [firma, cuantos] of porFirma) console.log(`  · ${firma} — ${cuantos}`);

  if (!aplicar) {
    console.log('\nEsto es solo un informe. Repite con --apply para adoptarlos.');
    return;
  }

  const { error } = await client
    .from('transcriptions')
    .update({ firm_id: firmaDestino, user_email: correo, updated_at: new Date().toISOString() })
    .in(
      'id',
      huerfanos.map((t) => t.id)
    );

  if (error) salir(`No se pudieron adoptar: ${error.message}`);

  console.log(`\nAdoptados ${huerfanos.length} transcritos por ${nombreDestino}.`);
})();
