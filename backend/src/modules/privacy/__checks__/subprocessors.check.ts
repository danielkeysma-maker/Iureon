/**
 * Guards the register of subencargados.
 *
 * Run with: npm run check:subprocessors
 *
 * Una lista de subencargados que no corresponde a lo que la aplicación ejecuta
 * es PEOR que no tenerla: se lee como diligencia mientras describe un sistema
 * que no existe, y una firma la usaría para responderle a su propio cliente.
 *
 * Por eso lo que se comprueba no es el formato: es que la lista siga a la
 * configuración y al código, y que no omita la capa que un aviso genérico
 * omite — las empresas de modelos detrás del enrutador.
 */
import { config } from '../../../config/env.config';
import { ENGINE } from '../../agent/openrouter.client';
import { disclosure, subprocessors } from '../subprocessors.service';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const lista = subprocessors();
const nombres = lista.map((s) => s.nombre);

check('el registro no está vacío', lista.length > 0, `${lista.length} subencargados`);

// ─── Nadie sin propósito, sin datos y sin sitio ─────────────────────────────
const incompletos = lista.filter(
  (s) => !s.nombre.trim() || !s.proposito.trim() || s.datos.length === 0 || !/^https?:\/\//.test(s.sitio)
);
check(
  'cada subencargado dice quién es, qué hace, qué recibe y dónde está su política',
  incompletos.length === 0,
  incompletos.map((s) => s.nombre).join(', ')
);

/*
 * ─── LA CAPA QUE UN AVISO GENÉRICO OMITE ───────────────────────────────────
 *
 * OpenRouter es un enrutador: los hechos del caso NO se detienen ahí. Nombrar
 * solo al enrutador sería cierto e inútil, y es exactamente la forma en que un
 * aviso de privacidad puede ser literalmente correcto y dejar a la firma sin
 * saber a quién llegan los datos de su cliente.
 */
const modelos = Object.values(ENGINE);
const faltantes = modelos.filter((id) => !lista.some((s) => s.proposito.includes(id)));

check(
  `los ${modelos.length} modelos que el pipeline invoca están declarados con su empresa`,
  faltantes.length === 0,
  faltantes.join(', ')
);

const detras = lista.filter((s) => s.atravesDe === 'OpenRouter, Inc.');
check(
  'las empresas de modelos se declaran DETRÁS del enrutador, no como proveedores directos',
  detras.length === modelos.length,
  `${detras.length} de ${modelos.length}`
);

/*
 * ─── LA LISTA SIGUE A LA CONFIGURACIÓN, NO A UN DOCUMENTO ──────────────────
 *
 * Un proveedor apagado que aparezca en la lista es una afirmación falsa sobre
 * quién tiene los datos de la firma. Uno encendido que no aparezca es peor.
 */
const declara = (nombre: string): boolean => nombres.some((n) => n.includes(nombre));

check(
  'Deepgram aparece si y solo si la transcripción está configurada',
  declara('Deepgram') === config.deepgram.enabled,
  `configurado=${config.deepgram.enabled} declarado=${declara('Deepgram')}`
);
check(
  'Wompi aparece si y solo si la pasarela está configurada',
  declara('Wompi') === config.wompi.enabled,
  `configurado=${config.wompi.enabled} declarado=${declara('Wompi')}`
);
check(
  'Supabase aparece si y solo si la base de datos está configurada',
  declara('Supabase') === config.supabase.enabled,
  `configurado=${config.supabase.enabled} declarado=${declara('Supabase')}`
);
check(
  'Backblaze aparece si y solo si el almacenamiento está configurado',
  declara('Backblaze') === config.backblaze.enabled,
  `configurado=${config.backblaze.enabled} declarado=${declara('Backblaze')}`
);

// El proveedor de vectores declarado tiene que ser el que corre, no los dos.
check(
  'solo se declara el proveedor de embeddings realmente seleccionado',
  declara('Cloudflare') === (config.cloudflare.enabled && config.embeddings.provider === 'cloudflare'),
  `provider=${config.embeddings.provider}`
);

/*
 * ─── LO QUE LA FIRMA NECESITA PARA USAR LA LISTA ───────────────────────────
 *
 * Saber quién procesa no basta. Una firma que le responde a su cliente, o que
 * radica ante la SIC, necesita saber su propia posición — y no es la que la
 * mayoría supone: la responsable es ELLA, no Iureon.
 */
const d = disclosure();
check('se declara la ley aplicable', /1581/.test(d.marcoLegal), d.marcoLegal);
check('se dice que la RESPONSABLE es la firma', /RESPONSABLE/.test(d.posicionDeLaFirma));
check('se dice que Iureon es ENCARGADO', /ENCARGADO/.test(d.posicionDeIureon));
check(
  'se dice que estos terceros son SUBENCARGADOS DE LA FIRMA',
  /SUBENCARGADOS de la firma/.test(d.posicionDeEstosTerceros)
);
check('se declara qué NO se hace con los datos', d.loQueNoHacemos.length >= 3);

/*
 * El audio es el caso más sensible del producto y la respuesta tiene que ser
 * inequívoca: no se guarda. Si algún día se guardara, esta línea tendría que
 * cambiar en el mismo commit que lo cambie.
 */
check(
  'se declara expresamente que el audio de una audiencia no se guarda',
  d.loQueNoHacemos.some((linea) => /audio/i.test(linea) && /no se guarda/i.test(linea))
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exit(fallos === 0 ? 0 : 1);
