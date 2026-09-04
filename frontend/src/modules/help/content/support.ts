import type { SupportChannel } from '../types';

/**
 * The support channels, and what each one honestly is today.
 *
 * ─── WHY THE NUMBER COMES FROM CONFIGURATION ────────────────────────────────
 *
 * A support line is an operational fact, not a design decision: it changes when
 * the team changes, and writing it into a component would make a phone number a
 * deploy. It is read from `VITE_SUPPORT_WHATSAPP`, and while nothing is
 * configured the card says the channel is not open yet instead of drawing a
 * button that opens a chat with nobody.
 *
 * ─── WHAT THE 9b ARTBOARD ASKS FOR, AND WHAT OF IT EXISTS TODAY ─────────────
 *
 * · The in-app chat EXISTS: conversations and messages stored per firm
 *   (`support_conversations`, `support_messages`), written by any lawyer of the
 *   firm and answered by the platform operator from the operator console. It
 *   is a polled inbox refreshed every 30 s, not a live socket. No attachments:
 *   the same rule as WhatsApp applies — client data and case documents do not
 *   travel through it — and an upload box would invite exactly that.
 * · "Sus conversaciones" (open / closed threads) EXISTS, as the list inside
 *   the chat card. Closing is the operator's act; a firm that writes again
 *   reopens the thread.
 * · NOT promised, still: "≈ 4 min" / "≈ 12 min" first-response times and the
 *   "En línea" badge. Nobody measures response time and nobody tracks
 *   presence, so both would be numbers invented to look reassuring on the
 *   screen a reader reaches when something already went wrong.
 * · NOT promised: the attention schedule as a commitment. The card says
 *   "horario laboral" as a description of who answers, not as an SLA.
 * · NOT promised: "Urgencias de término: esas conversaciones se atienden
 *   primero." There is no priority queue. What survives is the part that is
 *   advice and costs nothing to keep: say the deadline in the first line.
 */

/** Digits only, as wa.me expects. Empty means the channel is not configured. */
const NUMERO_WHATSAPP: string = (import.meta.env.VITE_SUPPORT_WHATSAPP ?? '')
  .toString()
  .replace(/\D/g, '');

export const WHATSAPP_CONFIGURADO = NUMERO_WHATSAPP.length > 0;

/** "+57 320 000 0000" from the raw digits, for reading rather than dialling. */
export const whatsappLegible = (): string => {
  if (!WHATSAPP_CONFIGURADO) return '';
  const m = /^(\d{1,3})(\d{3})(\d{3})(\d{4})$/.exec(NUMERO_WHATSAPP);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : `+${NUMERO_WHATSAPP}`;
};

/**
 * The pre-filled message: who is writing and from which firm, nothing else.
 *
 * It carries no draft, no client and no case, because this conversation leaves
 * the processing agreement — the card says so a few lines above the button, and
 * the link must not contradict it.
 */
export const enlaceWhatsapp = (firma: string, correo: string): string => {
  const saludo = [
    'Buen día. Escribo por Iureon.',
    firma ? `Firma: ${firma}.` : '',
    correo ? `Correo de mi cuenta: ${correo}.` : ''
  ]
    .filter(Boolean)
    .join(' ');

  return `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(saludo)}`;
};

export const CANALES: readonly SupportChannel[] = [
  {
    id: 'whatsapp',
    nombre: 'WhatsApp',
    paraQue: 'Para cuando está en el juzgado o sin computador',
    disponible: WHATSAPP_CONFIGURADO,
    razon: WHATSAPP_CONFIGURADO
      ? ''
      : 'El número de soporte todavía no está configurado en esta instalación. Cuando lo esté, el botón abre la conversación con su firma y su correo ya escritos.',
    puntos: [
      {
        tono: 'hecho',
        texto: 'Se abre con el nombre de su firma y el correo de su cuenta ya escritos en el mensaje.'
      },
      {
        tono: 'advertencia',
        texto:
          'No envíe por aquí datos de sus clientes ni documentos del caso. WhatsApp queda fuera de nuestro acuerdo de tratamiento de datos.'
      },
      {
        tono: 'advertencia',
        texto:
          'Desde WhatsApp nadie puede entrar a su cuenta. Cualquier acceso se autoriza dentro de la aplicación.'
      }
    ]
  },
  {
    id: 'chat',
    nombre: 'Chat dentro de la aplicación',
    paraQue: 'Para dudas sobre un escrito o una ficha, sin salir de la pantalla',
    disponible: true,
    razon: '',
    puntos: [
      {
        tono: 'hecho',
        texto:
          'La conversación queda registrada en su cuenta y en su auditoría, no en un canal externo. La ve cualquier abogado de su firma.'
      },
      {
        tono: 'hecho',
        texto:
          'Responde el operador de la plataforma en horario laboral. No hay tiempo de respuesta garantizado ni cola de prioridad: si tiene un término encima, dígalo en la primera línea.'
      },
      {
        tono: 'advertencia',
        texto:
          'No pegue aquí datos de sus clientes ni documentos del caso. Soporte no ve su material por escribirle; si hace falta verlo, se pide por el acceso de soporte, que autoriza un socio.'
      }
    ]
  }
];

/** What to put in the message. Advice, not a service-level promise. */
export const QUE_INCLUIR: readonly string[] = [
  'Si tiene un término que vence hoy o mañana, dígalo en la primera línea.',
  'La pantalla en la que está y qué esperaba que pasara.',
  'El sello de versión que aparece al pie de la barra lateral: dice con qué código está corriendo su pestaña.',
  'Una captura, si el problema se ve. Tape los datos de su cliente antes de enviarla.'
];

/** The three articles that answer most of what people write in about. */
export const ANTES_DE_ESCRIBIR: readonly { id: string; pregunta: string }[] = [
  { id: 'tres-estados', pregunta: '¿Por qué un dato sale sin verificar?' },
  { id: 'formato', pregunta: 'El documento no salió con mi membrete' },
  { id: 'roles-saldo', pregunta: 'Se agotó el saldo a mitad del día' }
];
