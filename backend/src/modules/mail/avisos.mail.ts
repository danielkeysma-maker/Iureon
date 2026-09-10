import { EMISOR } from './emisor';
import { enviarCorreo } from './mail.service';
import type { ResultadoDeEnvio } from './mail.service';
import {
  URL_ENTRAR,
  URL_MANUAL,
  botones,
  cita,
  dato,
  documento,
  fechaCorta,
  fechaLarga,
  fechaYHora,
  inventario,
  nota,
  pares,
  pasos,
  pesos,
  titular
} from './plantilla';
import { SIN_CONSUMO, TESIS, loQueIncluye, modulosDe, usuariosDe } from './vocabulario';
import { listFirmUsers } from '../auth/auth.service';
import { PLANES } from '../subscriptions/plan.catalog';
import type { Plan, PlanPeriod } from '../subscriptions/plan.catalog';

/**
 * Los avisos que NO confirman un pago: la bienvenida de una firma que creó el
 * operador, la constancia de un borrado, un plan movido a mano y un plan
 * cancelado.
 *
 * VIVEN APARTE DE `mail.service` A PROPÓSITO. Aquel confirma pagos y su pie lo
 * dice; en una constancia de borrado esa frase sería falsa y sería además lo
 * último que lee quien acaba de perder sus datos. El DIBUJO es el mismo de
 * siempre —`plantilla.ts`, una sola pieza para los seis correos—; lo que cambia
 * es lo que cada uno afirma. La tubería de envío, `enviarCorreo`, no se toca.
 *
 * NINGUNO PUEDE TUMBAR LO QUE LO DISPARA. Los cuatro salen DESPUÉS de que el
 * hecho ya ocurrió y ninguno lanza: `enviarCorreo` devuelve `{ enviado, error }`
 * y aquí se registra con el prefijo `[MAIL]`. Un borrado consumado no se puede
 * deshacer porque el correo no salió, y un plan ya escrito tampoco.
 *
 * NO SE AFIRMA NINGUNA OBLIGACIÓN LEGAL NI SE CITA NINGUNA NORMA. La maqueta
 * del borrado decía que la auditoría «se conserva por obligación legal»; ni la
 * obligación se puede verificar desde aquí ni la auditoría se conserva —la
 * función `borrar_firma_completa` borra `audit_logs` con todo lo demás—. Estos
 * correos dejan constancia de un hecho: qué se borró, cuándo, qué plan quedó,
 * hasta cuándo.
 */

interface Plantilla {
  asunto: string;
  html: string;
  texto: string;
}

/* Reexportadas: eran de este archivo antes de que existiera la pieza común. */
export { fechaLarga, fechaYHora };

/* ══════════════════════ 1. Firma creada por el operador ══════════════════════ */

/**
 * LA TERCERA BIENVENIDA, Y HASTA HOY NO EXISTÍA.
 *
 * `createFirm` daba de alta la firma y su socio administrador desde la consola
 * de operación y NO avisaba a nadie: la persona quedaba con una cuenta que no
 * sabía que tenía. Es exactamente el texto de la maqueta 1 —«el operador de
 * Iureon creó la firma y lo dejó como socio administrador»—, que describía un
 * correo que el sistema nunca mandó.
 *
 * TODO LO QUE AFIRMA SALE DE LO QUE SE ESCRIBIÓ DE VERDAD en la fila de la
 * firma: el plan, el periodo, la fecha de vencimiento, el cupo de cuentas y el
 * saldo inicial se los pasa quien acaba de escribirlos. Aquí no se supone
 * ninguno — la consola puede cambiar la política de alta mañana.
 *
 * LA CONTRASEÑA NO VIAJA EN EL CORREO. La elige el operador y se la entrega por
 * su canal; un secreto en una plantilla es un secreto en cada bandeja, cada
 * copia de seguridad y cada registro del servidor de correo.
 */
export interface DatosDeFirmaCreada {
  para: string;
  /** El nombre del socio administrador, si el operador lo escribió. */
  nombre?: string | null;
  firma: string;
  plan: Plan;
  periodo: PlanPeriod;
  /** ISO completo: hasta cuándo quedó el plan, tal como se escribió en la fila. */
  validoHasta: string;
  /** Los días de vigencia con los que se calculó esa fecha. */
  diasDeVigencia: number;
  /** El cupo de cuentas escrito en la firma. */
  maxUsuarios: number;
  /** Saldo acreditado al crearla, en pesos. Cero es lo normal. */
  saldoInicialCop: number;
}

const NOMBRE_DE_PERIODO: Record<PlanPeriod, string> = {
  MENSUAL: 'mensual',
  ANUAL: 'anual',
  PRUEBA: 'prueba',
  CORTESIA: 'cortesía'
};

export const plantillaDeFirmaCreada = (d: DatosDeFirmaCreada): Plantilla => {
  const def = PLANES[d.plan];
  const vence = fechaLarga(d.validoHasta);
  const cupo = usuariosDe(d.maxUsuarios);
  const asunto = `Su firma ya está creada en Iureon · ${d.firma}`;
  const tratamiento = d.nombre?.trim() ? `${d.nombre.trim()}: el` : 'El';

  /*
   * El dato grande dice lo que de verdad se escribió. Una alta de prueba tiene
   * días contados y esos son el protagonista; una cortesía sin vencimiento no
   * tiene fecha que enseñar, y fingir una sería el defecto que este encargo
   * viene a corregir.
   */
  const protagonista =
    d.periodo === 'PRUEBA' && d.diasDeVigencia > 0
      ? dato('PRUEBA INCLUIDA', `${d.diasDeVigencia} días`, `Plan ${def.nombre} · ${cupo} · hasta el ${vence}`)
      : dato('PLAN VIGENTE HASTA', fechaCorta(d.validoHasta), `Plan ${def.nombre} · ${cupo} · ${NOMBRE_DE_PERIODO[d.periodo]}`);

  const { html, texto } = documento({
    titulo: 'Su firma ya está creada en Iureon',
    numero: '01',
    seccion: 'BIENVENIDA',
    mencionaPrecios: true,
    adelanto: `${d.firma} ya está creada y usted quedó como socio administrador. Entre con este correo.`,
    razonDelPie:
      'Recibe este correo porque la operación de Iureon creó su firma y usted quedó registrado como socio administrador. Si no esperaba esta cuenta, responda a este mensaje.',
    bloques: [
      titular(
        'Su firma ya está creada.',
        `${tratamiento} operador de Iureon creó ${d.firma} y lo dejó como socio administrador. Desde ahora usted invita a sus abogados, cambia el plan y recarga el saldo.`
      ),
      protagonista,
      pares('LA CUENTA', [
        ['Firma', d.firma],
        ...(d.nombre?.trim() ? ([['Socio administrador', d.nombre.trim()]] as ReadonlyArray<readonly [string, string]>) : []),
        ['Correo de acceso', d.para],
        ['Plan', `${def.nombre} · ${NOMBRE_DE_PERIODO[d.periodo]}`],
        ['Cuentas incluidas', cupo],
        ['Vigente hasta', vence],
        ...(d.saldoInicialCop > 0
          ? ([['Saldo inicial acreditado', pesos(d.saldoInicialCop)]] as ReadonlyArray<readonly [string, string]>)
          : [])
      ]),
      botones({ texto: 'Entrar a Iureon', url: URL_ENTRAR }, { texto: 'Ver el manual', url: URL_MANUAL }),
      pasos('PRIMEROS PASOS', [
        {
          titulo: 'Entre y cambie su contraseña.',
          detalle:
            'El acceso es con el correo de este mensaje y la contraseña que le entregó la operación de Iureon; este correo no la trae.'
        },
        {
          titulo: 'Invite a sus abogados.',
          detalle: `Cada uno con su usuario. El plan admite ${d.maxUsuarios} ${d.maxUsuarios === 1 ? 'cuenta' : 'cuentas'} en total y los datos quedan aislados por firma.`
        },
        {
          titulo: 'Empiece por Redacción.',
          detalle: 'Describa los hechos y la plataforma le propone la actuación del catálogo, con su término y su fuente.'
        }
      ]),
      cita(TESIS),
      nota(
        `El plan ${def.nombre} incluye ${cupo} y estos módulos: ${modulosDe(d.plan)}. Nada se radica desde Iureon.`
      ),
      nota(
        `El plan es el derecho a usar la aplicación. El uso de inteligencia artificial se paga aparte, con recargas de saldo desde Saldo › Recargar. ${SIN_CONSUMO}`
      )
    ]
  });

  return { asunto, html, texto };
};

/* ══════════════════════ 2. Constancia de borrado ══════════════════════ */

/**
 * Cómo se llama, en castellano, cada tabla que el borrado vacía.
 *
 * El nombre técnico se conserva como respaldo y NO se oculta cuando falta la
 * traducción: `borrar_firma_completa` puede crecer con una tabla nueva, y una
 * constancia que callara lo que no supo nombrar diría menos de lo que se borró.
 */
const NOMBRE_DE_TABLA: Record<string, string> = {
  document_embeddings: 'Índices de búsqueda de sus documentos',
  legal_documents: 'Documentos cargados',
  saved_drafts: 'Borradores guardados',
  document_reviews: 'Revisiones de documentos',
  transcriptions: 'Transcripciones de audiencias y entrevistas',
  clients: 'Clientes y sus expedientes',
  firm_style_profiles: 'Perfil de estilo de la firma',
  catalog_verifications: 'Verificaciones del catálogo hechas por la firma',
  orientaciones: 'Orientaciones consultadas',
  orientacion_diaria: 'Cupo diario de orientación',
  user_preferences: 'Preferencias de los usuarios',
  manual_reads: 'Lecturas del manual',
  push_subscriptions: 'Suscripciones a avisos en el navegador',
  support_messages: 'Mensajes con soporte',
  support_conversations: 'Conversaciones con soporte',
  support_access_views: 'Registro de accesos de soporte',
  support_access: 'Autorizaciones de acceso de soporte',
  ai_usage: 'Registro de consumo de inteligencia artificial',
  credit_movements: 'Movimientos de saldo',
  payment_intents: 'Intenciones de pago',
  subscription_payments: 'Pagos de suscripción',
  audit_logs: 'Registro de auditoría',
  firms: 'Ficha de la firma'
};

const nombreDeTabla = (tabla: string): string => NOMBRE_DE_TABLA[tabla] ?? tabla;

export type QuienBorro = 'ADMINISTRADOR' | 'OPERADOR';

export interface DatosDeBorrado {
  firma: string;
  /** ISO completo. El instante en que terminó el borrado, no el del correo. */
  fecha: string;
  quien: QuienBorro;
  /** Correo de quien lo pidió: el administrador de la firma o el operador. */
  solicitante: string;
  tablas: ReadonlyArray<{ tabla: string; filas: number }>;
  usuariosEliminados: number;
  /** Lo que NO se pudo completar. Se dice; callarlo haría de la constancia una promesa falsa. */
  advertencias: readonly string[];
}

/**
 * LA MAQUETA DESCRIBÍA UN BORRADO QUE NO EXISTE, y aquí está lo que sí ocurre.
 *
 * Anunciaba una «solicitud», treinta días de plazo, la firma «en solo lectura»,
 * un botón para cancelar y otro para exportar. `borrarFirmaConTodo` borra DE
 * INMEDIATO y sin vuelta, y este correo sale DESPUÉS: cuando llega no queda
 * nada que cancelar ni nada que exportar. Se conserva el aspecto de la maqueta
 * —es bueno— y se cambia entero lo que afirma. NO SE INVENTA UN PLAZO DE
 * GRACIA: prometer treinta días a quien ya los perdió es la peor de las falsas
 * promesas posibles.
 *
 * POR ESO ESTE CORREO NO LLEVA BOTÓN. Un botón en una constancia de borrado
 * solo podría llevar a una pantalla que la firma ya no puede abrir; el canal
 * que sí queda es responder a este mensaje, y eso lo dice el pie.
 */
export const plantillaDeBorrado = (d: DatosDeBorrado): Plantilla => {
  const asunto = 'Constancia de borrado de datos · Iureon';
  const cuando = fechaYHora(d.fecha);
  const porQuien =
    d.quien === 'ADMINISTRADOR'
      ? `a solicitud de su socio administrador (${d.solicitante})`
      : `a solicitud de la firma, ejecutado por la operación de Iureon (${d.solicitante})`;

  // Solo lo que tuvo filas: una lista de veintitrés ceros esconde las tres que importan.
  const conFilas = d.tablas.filter((t) => t.filas > 0);
  const listado = conFilas.length
    ? inventario(
        'QUÉ SE BORRÓ',
        conFilas.map((t) => `${nombreDeTabla(t.tabla)}: ${t.filas.toLocaleString('es-CO')}`)
      )
    : nota('No quedaban registros almacenados en el momento del borrado.');

  const bloques = [
    titular(
      'Sus datos fueron borrados.',
      `Dejamos constancia de que los datos de ${d.firma} se borraron de Iureon ${porQuien}. El borrado se ejecutó al recibirse la solicitud, no se puede deshacer y en Iureon no queda copia de lo borrado.`
    ),
    dato('BORRADO EJECUTADO', fechaCorta(d.fecha), `${cuando} · la operación no se puede deshacer`),
    pares('LA OPERACIÓN', [
      ['Firma', d.firma],
      ['Solicitó', d.solicitante],
      ['Fecha y hora del borrado', cuando],
      ['Cuentas de usuario eliminadas', String(d.usuariosEliminados)]
    ]),
    listado,
    pasos('QUÉ PASA CON SUS DATOS', [
      {
        titulo: 'El borrado ya se ejecutó.',
        detalle: 'No hay plazo, ni periodo de solo lectura, ni forma de cancelarlo: se cumplió en el acto.'
      },
      {
        titulo: 'En Iureon no queda copia.',
        detalle:
          'Documentos, borradores, revisiones, transcripciones, clientes, saldo y el propio registro de auditoría de la firma se borraron con todo lo demás.'
      },
      {
        titulo: 'Lo único que se conserva.',
        detalle:
          'Si la cuenta se abrió desde la página pública, queda anotado que esa dirección de correo abrió una firma, con su fecha. Sostiene el límite de pruebas gratuitas por dirección y no contiene material de sus casos.'
      }
    ]),
    nota(
      'También se eliminaron los archivos que la firma tenía guardados y las cuentas con las que se ingresaba. El audio de las grabaciones no estaba almacenado: se borra en el mismo momento de transcribirse, mucho antes de esta solicitud.'
    ),
    ...(d.advertencias.length ? [inventario('LO QUE QUEDÓ PENDIENTE', d.advertencias)] : []),
    nota('Conserve este mensaje: es el comprobante del borrado.')
  ];

  const { html, texto } = documento({
    titulo: 'Constancia de borrado de datos',
    numero: '04',
    seccion: 'ELIMINACIÓN DE DATOS',
    mencionaPrecios: false,
    adelanto: `Los datos de ${d.firma} se borraron de Iureon. Esta es la constancia.`,
    razonDelPie:
      'Este correo se envía una sola vez, al completarse el borrado de los datos de una firma, y sirve de constancia para las dos partes. Si usted no reconoce esta operación, responda a este mensaje.',
    bloques
  });

  return { asunto, html, texto };
};

/* ══════════════════════ 3. Plan cambiado por el operador ══════════════════════ */

export interface DatosDeCambioDePlan {
  firma: string;
  plan: Plan;
  periodo: PlanPeriod;
  /** ISO completo, o `null` en una cortesía sin fecha. */
  validoHasta: string | null;
  /** ISO completo: el instante en que el operador lo escribió. */
  desde: string;
}

export const plantillaDeCambioDePlan = (d: DatosDeCambioDePlan): Plantilla => {
  const def = PLANES[d.plan];
  const asunto = `Su plan en Iureon fue actualizado · ${def.nombre}`;
  const desde = fechaLarga(d.desde);
  const hasta = d.validoHasta ? fechaLarga(d.validoHasta) : null;
  const vigencia = hasta ? `del ${desde} al ${hasta}` : `desde el ${desde}, sin fecha de vencimiento`;

  const { html, texto } = documento({
    titulo: `Plan ${def.nombre} activo`,
    numero: '02',
    seccion: 'PLAN ACTUALIZADO',
    mencionaPrecios: false,
    adelanto: `La operación de Iureon dejó a ${d.firma} en el plan ${def.nombre}, vigente ${vigencia}.`,
    razonDelPie:
      'Recibe este correo porque la operación de Iureon cambió el plan de su firma a mano. Si usted no esperaba este cambio, responda a este mensaje.',
    bloques: [
      titular(
        `Su plan ${def.nombre} está activo.`,
        `La operación de Iureon actualizó el plan de ${d.firma}. A partir de ahora la firma tiene el plan ${def.nombre}, vigente ${vigencia}. Este cambio no se cobró por la pasarela: lo escribió la operación directamente.`
      ),
      d.validoHasta
        ? dato('VIGENTE HASTA', fechaCorta(d.validoHasta), `${def.nombre} · ${loQueIncluye(d.plan)}`)
        : dato('PLAN ACTIVO', def.nombre, `Sin fecha de vencimiento · ${loQueIncluye(d.plan)}`),
      pares('EL CAMBIO', [
        ['Firma', d.firma],
        ['Plan', `${def.nombre} · ${NOMBRE_DE_PERIODO[d.periodo]}`],
        ['Rige desde', desde],
        ['Vigente hasta', hasta ?? 'Sin fecha de vencimiento'],
        ['Cuentas incluidas', usuariosDe(def.maxUsuarios)]
      ]),
      botones({ texto: 'Entrar a Iureon', url: URL_ENTRAR }),
      nota(
        `${def.nombre} incluye estos módulos: ${modulosDe(d.plan)}. ${
          hasta
            ? 'Al llegar la fecha de vencimiento la aplicación pasa a solo lectura y podrá renovar desde «Plan».'
            : 'Mientras no se fije una fecha de vencimiento, el plan no caduca.'
        }`
      ),
      nota('El detalle del cambio, con su motivo y quién lo hizo, queda en Ajustes › Auditoría.')
    ]
  });

  return { asunto, html, texto };
};

/* ══════════════════════ 4. Plan cancelado ══════════════════════ */

export interface DatosDeCancelacion {
  firma: string;
  plan: Plan;
  periodo: PlanPeriod;
  /** ISO completo: el instante hasta el que llega el plan pagado. Lo escribe el servidor. */
  finDelPlan: string;
}

/**
 * LO QUE OCURRE DE VERDAD AL CANCELAR, leído del código y no de lo que sonaría
 * razonable. Esto es lo único que el correo puede prometer:
 *
 *   · `suspenderAccesoDeFirma` escribe `plan_valid_until` y no toca nada más.
 *     Los guardas (`exigirPlanVigente`, `planBloquea`) derivan el vencimiento
 *     SOLO de esa fecha, así que ella sola decide hasta cuándo hay plan.
 *   · Nada se borra. La firma conserva documentos, borradores, clientes,
 *     revisiones y transcripciones, y puede seguir leyéndolos y exportándolos:
 *     los guardas solo se interponen ante lo que crea trabajo nuevo.
 *   · El saldo recargado no se toca: `credit_balance_cop` no entra en esta
 *     escritura y sigue ahí si la firma vuelve.
 *   · No hay renovación automática ni tarjeta guardada; pagar desde «Plan»
 *     reabre el acceso en cuanto la pasarela confirma.
 */
export const plantillaDeCancelacion = (d: DatosDeCancelacion): Plantilla => {
  const def = PLANES[d.plan];
  const asunto = 'Su plan en Iureon quedó cancelado · Iureon';
  const hasta = fechaLarga(d.finDelPlan);

  const { html, texto } = documento({
    titulo: 'Su plan en Iureon quedó cancelado',
    numero: '02',
    seccion: 'PLAN CANCELADO',
    mencionaPrecios: false,
    adelanto: `El plan ${def.nombre} de ${d.firma} quedó cancelado. Hay plan hasta el ${hasta}.`,
    razonDelPie:
      'Recibe este correo porque el plan de su firma se canceló en Iureon. Si usted no lo solicitó, responda a este mensaje.',
    bloques: [
      titular(
        'Su plan quedó cancelado.',
        `El plan ${def.nombre} de ${d.firma} quedó cancelado. La firma tiene plan hasta el ${hasta}; desde esa fecha la aplicación abre en solo lectura.`
      ),
      dato('CON PLAN HASTA', fechaCorta(d.finDelPlan), `${def.nombre} · ${NOMBRE_DE_PERIODO[d.periodo]} · desde esa fecha, solo lectura`),
      pares('LA CANCELACIÓN', [
        ['Firma', d.firma],
        ['Plan cancelado', `${def.nombre} · ${NOMBRE_DE_PERIODO[d.periodo]}`],
        ['Con plan hasta', hasta]
      ]),
      botones({ texto: 'Entrar a Iureon', url: URL_ENTRAR }),
      pasos('QUÉ QUEDA DESPUÉS', [
        {
          titulo: 'Nada se borra.',
          detalle:
            'Sus documentos, borradores, clientes, revisiones y transcripciones siguen ahí y los puede leer, descargar y exportar. Lo que deja de poder hacerse es crear trabajo nuevo: redactar, revisar y transcribir.'
        },
        {
          titulo: 'El saldo no se pierde ni se descuenta.',
          detalle: 'Queda como está y vuelve a estar disponible si contrata de nuevo.'
        },
        {
          titulo: 'No hay renovación automática.',
          detalle:
            'No se guarda tarjeta. Para volver, contrate desde «Plan»: el acceso se reabre en cuanto la pasarela confirme el pago.'
        }
      ]),
      nota(
        'Si además desea que borremos sus datos, escríbanos: el borrado es una operación aparte, se pide expresamente, se ejecuta de inmediato y tiene su propia constancia.'
      )
    ]
  });

  return { asunto, html, texto };
};

/* ══════════════════════ Envíos ══════════════════════ */

/**
 * A cuántas direcciones se escribe como máximo. El plan más grande tiene pocos
 * puestos; el tope existe para que una lista corrompida no dispare cien envíos.
 */
const MAX_DESTINATARIOS = 12;

const normalizar = (correos: readonly string[]): string[] =>
  [...new Set(correos.map((c) => c.trim().toLowerCase()).filter((c) => c.includes('@')))].slice(
    0,
    MAX_DESTINATARIOS
  );

/**
 * Manda la MISMA plantilla a varias direcciones, una por una, y nunca lanza.
 *
 * Uno por uno y no en copia: los correos de las socias de una firma no tienen
 * por qué verse entre sí en la cabecera de un mensaje sobre el borrado de sus
 * datos. Un fallo se registra y no detiene a los demás — el hecho ya ocurrió.
 */
const enviarATodos = async (destinatarios: readonly string[], plantilla: Plantilla): Promise<number> => {
  let enviados = 0;
  for (const para of normalizar(destinatarios)) {
    try {
      const resultado: ResultadoDeEnvio = await enviarCorreo({ para, ...plantilla });
      if (resultado.enviado) enviados += 1;
    } catch (err) {
      // `enviarCorreo` no lanza; este catch existe para que ni un fallo
      // imprevisto suyo pueda tumbar la operación que ya se consumó.
      console.error(`[MAIL] Fallo inesperado enviando «${plantilla.asunto}»:`, err);
    }
  }
  return enviados;
};

/**
 * Los administradores de la firma, que son quienes contratan, pagan y borran.
 * Si no hay ninguno con ese rol se escribe a todos: mejor un aviso de más que
 * un cambio de plan del que no se entera nadie. Devuelve vacío ante cualquier
 * fallo, porque no poder listar cuentas no puede impedir el aviso ni —mucho
 * menos— la operación que lo precedió.
 */
export const administradoresDeLaFirma = async (firmId: string): Promise<string[]> => {
  try {
    const usuarios = await listFirmUsers(firmId);
    const admins = usuarios.filter((u) => u.role === 'FIRM_ADMIN').map((u) => u.email);
    return admins.length ? admins : usuarios.map((u) => u.email);
  } catch (err) {
    console.error('[MAIL] No se pudieron listar los destinatarios de la firma:', err);
    return [];
  }
};

/**
 * La bienvenida de una firma dada de alta por el operador.
 *
 * Va SOLO al socio administrador que se acaba de crear —es la única cuenta que
 * existe— y nunca lanza: la firma ya está escrita y su cuenta ya existe, así
 * que un correo que no sale es una cortesía que falta, no un alta que falta.
 */
export const correoDeFirmaCreada = async (d: DatosDeFirmaCreada): Promise<ResultadoDeEnvio> => {
  const { asunto, html, texto } = plantillaDeFirmaCreada(d);
  try {
    return await enviarCorreo({ para: d.para, asunto, html, texto });
  } catch (err) {
    console.error('[MAIL] Fallo inesperado enviando la bienvenida de la firma creada:', err);
    return { enviado: false, error: err instanceof Error ? err.message : String(err) };
  }
};

/**
 * La constancia del borrado, a la firma y al operador.
 *
 * LAS DOS PARTES, Y ESE ES EL PUNTO. La firma se queda sin cuentas y sin
 * registro de auditoría propio —se borró con todo lo demás—, así que el único
 * papel que le queda es este correo. El operador recibe la misma copia, en la
 * dirección del titular que ya está en `emisor.ts`, como prueba de que
 * cumplió. Sale DESPUÉS del borrado, a direcciones listadas ANTES de
 * eliminarlas: esa es la última ocasión en que existen.
 */
export const correoDeBorrado = async (
  d: DatosDeBorrado & { destinatarios: readonly string[] }
): Promise<number> => {
  const enviados = await enviarATodos([...d.destinatarios, EMISOR.correo], plantillaDeBorrado(d));
  console.info(`[MAIL] Constancia de borrado de «${d.firma}»: ${enviados} envíos aceptados.`);
  return enviados;
};

export const correoDeCambioDePlan = async (
  d: DatosDeCambioDePlan & { destinatarios: readonly string[] }
): Promise<number> => enviarATodos(d.destinatarios, plantillaDeCambioDePlan(d));

export const correoDeCancelacion = async (
  d: DatosDeCancelacion & { destinatarios: readonly string[] }
): Promise<number> => enviarATodos(d.destinatarios, plantillaDeCancelacion(d));
