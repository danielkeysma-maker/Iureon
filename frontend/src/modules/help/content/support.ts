/**
 * Soporte: el canal de WhatsApp configurado y los atajos «Antes de escribir».
 *
 * ─── POR QUÉ EL NÚMERO SALE DE LA CONFIGURACIÓN ────────────────────────────
 *
 * Una línea de soporte es un dato de operación, no una decisión de diseño:
 * cambia cuando cambia el equipo, y escribirla en un componente convertiría un
 * número de teléfono en un despliegue. Se lee de `VITE_SUPPORT_WHATSAPP`, y
 * mientras no haya nada configurado la pantalla dice que el canal no está
 * abierto en vez de pintar un botón que abre un chat con nadie.
 *
 * ─── LO QUE SE RETIRÓ EL 14 DE SEPTIEMBRE DE 2026 ──────────────────────────
 *
 * `CANALES` (las dos tarjetas de la pantalla vieja, WhatsApp y chat) y
 * `QUE_INCLUIR` ya no se pintaban en ninguna parte. El segundo recomendaba
 * enviar «una captura», y el chat no recibe adjuntos: una recomendación que la
 * pantalla no deja cumplir es peor que ninguna. Lo que el chat sí promete
 * —horario laboral, sin tiempo garantizado, sin adjuntos— vive en
 * `ChatDeSoporte.tsx` y en el artículo `soporte` del manual.
 */

/** Solo dígitos, como los espera wa.me. Vacío significa canal sin configurar. */
const NUMERO_WHATSAPP: string = (import.meta.env.VITE_SUPPORT_WHATSAPP ?? '')
  .toString()
  .replace(/\D/g, '');

export const WHATSAPP_CONFIGURADO = NUMERO_WHATSAPP.length > 0;

/** «+57 320 000 0000» a partir de los dígitos, para leerlo y no para marcarlo. */
export const whatsappLegible = (): string => {
  if (!WHATSAPP_CONFIGURADO) return '';
  const m = /^(\d{1,3})(\d{3})(\d{3})(\d{4})$/.exec(NUMERO_WHATSAPP);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : `+${NUMERO_WHATSAPP}`;
};

/**
 * El mensaje prellenado: quién escribe y desde qué firma, nada más.
 *
 * No lleva borrador, cliente ni caso, porque esta conversación sale del acuerdo
 * de tratamiento de datos: la pantalla lo advierte junto al botón, y el enlace
 * no puede contradecirla.
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

/** Los artículos que resuelven la mayoría de lo que se escribe a soporte. */
export const ANTES_DE_ESCRIBIR: readonly { id: string; pregunta: string }[] = [
  { id: 'tres-estados', pregunta: '¿Por qué un dato sale sin verificar?' },
  { id: 'formato', pregunta: 'El documento no salió con mi membrete' },
  { id: 'roles-saldo', pregunta: 'Se agotó el saldo a mitad del día' }
];
