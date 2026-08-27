import { config } from '../../config/env.config';
import { ENGINE } from '../agent/openrouter.client';

/**
 * Who touches a firm's data, for what, and under whose contract.
 *
 * WHY THIS EXISTS AS A PRODUCT FEATURE AND NOT AS A PDF. Under Ley 1581 de 2012
 * the firm is the *responsable* of its clients' data and Iureon is its
 * *encargado*. Everything below is therefore a SUBENCARGADO of the firm — not
 * of Iureon — and the firm has a right to know who they are. A lawyer's files
 * are covered by professional secrecy, so "somebody processes this" is not an
 * answer they can give their own client.
 *
 * IT IS DERIVED, NOT WRITTEN DOWN. A hand-maintained list drifts the first time
 * a provider is swapped, and a list that names a provider no longer in use is
 * worse than none: it reads as diligence while describing a system that does
 * not exist. So each entry is gated on the same `config` flag the runtime uses.
 * A provider that is not configured does not appear as touching anything,
 * because it does not.
 *
 * THE SECOND LAYER IS THE ONE THAT MATTERS. OpenRouter is a router: the case
 * facts do not stop there, they reach the model vendors behind it. Naming only
 * OpenRouter would be true and useless. The models are read from `ENGINE`, the
 * same constant the pipeline calls, so this cannot disagree with what actually
 * ran.
 */

export type DataClass =
  | 'IDENTIFICACION'
  | 'CONTENIDO_DEL_CASO'
  | 'AUDIO_DE_AUDIENCIA'
  | 'TRANSCRITO'
  | 'DATOS_DE_PAGO'
  | 'METADATOS_DE_USO';

export interface Subprocessor {
  /** Legal name, as it must appear in the firm's own records. */
  nombre: string;
  /** The service, in the firm's words rather than ours. */
  proposito: string;
  /** What actually reaches them. Never a superset. */
  datos: DataClass[];
  /** Where it is processed, when the provider states it. */
  ubicacion: string;
  /** Whether it holds the data or only passes it through. */
  retiene: boolean;
  /** How long, when we control it. */
  retencion: string;
  /** Whose contract they sit under: ours directly, or behind another. */
  atravesDe: string | null;
  sitio: string;
}

const OPENROUTER_VENDORS: Record<string, string> = {
  google: 'Google LLC',
  openai: 'OpenAI, L.L.C.',
  anthropic: 'Anthropic PBC',
  'x-ai': 'xAI Corp.',
  meta: 'Meta Platforms, Inc.',
  mistralai: 'Mistral AI'
};

/**
 * The vendors behind the router, read from the engines the pipeline calls.
 *
 * A model id is `vendor/model`. Deriving the vendor from it means adding an
 * engine cannot silently add an undisclosed processor — the disclosure moves
 * with the code that causes it.
 */
const modelVendors = (): Array<{ empresa: string; modelo: string }> =>
  Object.values(ENGINE).map((id) => {
    const vendor = id.split('/')[0];
    return { empresa: OPENROUTER_VENDORS[vendor] ?? vendor, modelo: id };
  });

export const subprocessors = (): Subprocessor[] => {
  const list: Subprocessor[] = [];

  if (config.supabase.enabled) {
    list.push({
      nombre: 'Supabase, Inc.',
      proposito:
        'Base de datos de la aplicación: la firma, sus usuarios, los clientes, los borradores, los transcritos y el saldo.',
      datos: ['IDENTIFICACION', 'CONTENIDO_DEL_CASO', 'TRANSCRITO', 'METADATOS_DE_USO'],
      ubicacion: 'Estados Unidos',
      retiene: true,
      retencion: 'Mientras la firma mantenga su cuenta. Al borrar un registro se borra de la base.',
      atravesDe: null,
      sitio: 'https://supabase.com/privacy'
    });
  }

  if (config.backblaze.enabled) {
    list.push({
      nombre: 'Backblaze, Inc. (B2)',
      proposito:
        'Almacenamiento temporal del audio de una audiencia mientras el proveedor de transcripción lo lee.',
      datos: ['AUDIO_DE_AUDIENCIA'],
      ubicacion: 'Estados Unidos',
      retiene: false,
      retencion:
        'Minutos. El servidor borra el archivo ANTES de responder la petición, no después: una función serverless se congela al responder y lo que quede detrás no se ejecuta.',
      atravesDe: null,
      sitio: 'https://www.backblaze.com/company/privacy.html'
    });
  }

  if (config.deepgram.enabled) {
    list.push({
      nombre: 'Deepgram, Inc.',
      proposito:
        'Transcripción del audio con separación de interlocutores. Recibe una URL firmada y temporal del archivo, no el archivo por nuestra API.',
      datos: ['AUDIO_DE_AUDIENCIA'],
      ubicacion: 'Estados Unidos',
      retiene: false,
      retencion: 'No conservamos copia del audio. La política de retención del proveedor es la suya.',
      atravesDe: null,
      sitio: 'https://deepgram.com/privacy'
    });
  }

  if (config.cloudflare.enabled && config.embeddings.provider === 'cloudflare') {
    list.push({
      nombre: 'Cloudflare, Inc.',
      proposito:
        'Convierte en vectores el texto de una búsqueda para poder recuperar jurisprudencia. Recibe la consulta, no el expediente.',
      datos: ['CONTENIDO_DEL_CASO'],
      ubicacion: 'Red global',
      retiene: false,
      retencion: 'No almacena el texto; devuelve el vector y termina.',
      atravesDe: null,
      sitio: 'https://www.cloudflare.com/privacypolicy/'
    });
  }

  if (config.openAI.enabled && config.embeddings.provider === 'openai') {
    list.push({
      nombre: 'OpenAI, L.L.C.',
      proposito: 'Proveedor alternativo de vectores para la búsqueda, cuando está seleccionado.',
      datos: ['CONTENIDO_DEL_CASO'],
      ubicacion: 'Estados Unidos',
      retiene: false,
      retencion: 'No almacena el texto para entrenar, según su política para API.',
      atravesDe: null,
      sitio: 'https://openai.com/policies/privacy-policy'
    });
  }

  list.push({
    nombre: 'OpenRouter, Inc.',
    proposito:
      'Encamina la redacción hacia los modelos de lenguaje. Recibe los hechos del caso que el abogado escribe.',
    datos: ['CONTENIDO_DEL_CASO'],
    ubicacion: 'Estados Unidos',
    retiene: false,
    retencion: 'Enruta la petición; no la conserva para entrenamiento.',
    atravesDe: null,
    sitio: 'https://openrouter.ai/privacy'
  });

  // La capa que un aviso genérico omite. Nombrar solo al enrutador sería cierto
  // y no serviría de nada: los hechos del caso llegan a estas empresas.
  modelVendors().forEach(({ empresa, modelo }) => {
    list.push({
      nombre: empresa,
      proposito: `Redacta o analiza el escrito con el modelo ${modelo}.`,
      datos: ['CONTENIDO_DEL_CASO'],
      ubicacion: 'Estados Unidos',
      retiene: false,
      retencion: 'Según la política del proveedor para peticiones de API.',
      atravesDe: 'OpenRouter, Inc.',
      sitio: 'https://openrouter.ai/privacy'
    });
  });

  if (config.wompi.enabled) {
    list.push({
      nombre: 'Wompi S.A.S. (Bancolombia)',
      proposito:
        'Procesa la recarga de saldo. Los datos de la tarjeta se digitan en su sitio y nunca pasan por Iureon.',
      datos: ['IDENTIFICACION', 'DATOS_DE_PAGO'],
      ubicacion: 'Colombia',
      retiene: true,
      retencion: 'La que exija la regulación financiera colombiana.',
      atravesDe: null,
      sitio: 'https://wompi.com/es/co/politica-de-privacidad/'
    });
  }

  list.push({
    nombre: 'Vercel, Inc.',
    proposito: 'Aloja la aplicación y su API. Toda petición pasa por su infraestructura.',
    datos: ['IDENTIFICACION', 'CONTENIDO_DEL_CASO', 'METADATOS_DE_USO'],
    ubicacion: 'Estados Unidos',
    retiene: false,
    retencion: 'Registros de acceso según su política.',
    atravesDe: null,
    sitio: 'https://vercel.com/legal/privacy-policy'
  });

  return list;
};

/**
 * What the firm needs alongside the list to actually use it.
 *
 * The list alone answers "who". A firm answering its own client, or filing with
 * the SIC, also needs to know its own position — and it is not the one most
 * people assume.
 */
export const disclosure = () => ({
  marcoLegal: 'Ley 1581 de 2012 y Decreto 1074 de 2015',
  posicionDeLaFirma: 'RESPONSABLE del tratamiento de los datos de sus clientes.',
  posicionDeIureon: 'ENCARGADO del tratamiento, por cuenta de la firma.',
  posicionDeEstosTerceros:
    'SUBENCARGADOS de la firma. No son proveedores de Iureon frente a los datos de la firma: procesan datos cuyo responsable es ella.',
  loQueNoHacemos: [
    'No se guarda el audio de una audiencia: solo su transcrito. Un audio de dos horas pesa 50 MB y su transcrito 300 KB, y guardar grabaciones acumula material privilegiado sin fecha de caducidad.',
    'Ningún operador de Iureon puede abrir un transcrito, un borrador ni un expediente. La consola de operador gestiona firmas y saldos, y eso es todo lo que puede hacer.',
    'Iureon no usa el contenido de una firma para entrenar ningún modelo.'
  ],
  advertencia:
    'Esta lista se genera desde la configuración que la aplicación está ejecutando, no desde un documento que alguien mantiene a mano. Un proveedor que aparezca aquí está recibiendo datos; uno que no aparezca, no está configurado.'
});
