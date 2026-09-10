import { enviarCorreo } from '../mail/mail.service';
import type { ResultadoDeEnvio } from '../mail/mail.service';
import {
  URL_ENTRAR,
  URL_MANUAL,
  botones,
  cita,
  dato,
  documento,
  fechaLarga,
  nota,
  pares,
  pasos,
  pesos,
  titular
} from '../mail/plantilla';
import { SIN_CONSUMO, TESIS, modulosDe, usuariosDe } from '../mail/vocabulario';
import { PLANES, type Plan } from '../subscriptions/plan.catalog';
import { DIAS_DE_PRUEBA_GRATUITA, PLAN_DE_PRUEBA, USUARIOS_DE_PRUEBA } from './trial.rules';

/**
 * Las DOS bienvenidas del formulario público: la de quien abre la prueba
 * gratuita y la de quien se registró para comprar un plan.
 *
 * LA TERCERA BIENVENIDA NO ESTÁ AQUÍ. Cuando la firma la crea el operador
 * desde la consola no hay formulario público, ni contraseña elegida por el
 * visitante, ni prueba de siete días: es un aviso de operación y vive con los
 * demás, en `mail/avisos.mail.ts`.
 *
 * TODAS LAS CIFRAS SALEN DE UNA CONSTANTE, NUNCA DE LA MANO.
 * La maqueta prometía «14 días» de «Plan Premium completo» y las dos cosas eran
 * falsas para esta puerta: `trial.rules.ts` abre SIETE días de ESENCIAL con UN
 * usuario. Leerlas de las constantes es lo que impide que un cambio de política
 * deje el correo mintiendo — que es exactamente lo que había pasado.
 *
 * SALEN DESPUÉS DE QUE LA CUENTA EXISTE Y NUNCA TUMBAN NADA: con el correo
 * apagado la prueba se abre igual (la sesión se devuelve directamente), así que
 * un correo que no sale es una cortesía que falta, no una cuenta que falta.
 */

export interface DatosDeBienvenida {
  para: string;
  nombre: string;
  firma: string;
  /** ISO completo. */
  venceEl: string;
}

/* ══════════════════════ 1. Bienvenida con prueba gratuita ══════════════════════ */

export const plantillaDeBienvenida = (
  d: DatosDeBienvenida
): { asunto: string; html: string; texto: string } => {
  const def = PLANES[PLAN_DE_PRUEBA];
  const cupo = Math.min(USUARIOS_DE_PRUEBA, def.maxUsuarios);
  const vence = fechaLarga(d.venceEl);
  const asunto = `Su prueba gratuita de Iureon está abierta · ${DIAS_DE_PRUEBA_GRATUITA} días`;

  const { html, texto } = documento({
    titulo: 'Bienvenido a Iureon',
    numero: '01',
    seccion: 'BIENVENIDA',
    mencionaPrecios: true,
    adelanto: `Su firma ya está creada con ${DIAS_DE_PRUEBA_GRATUITA} días del plan ${def.nombre}. Entre con su correo y empiece por Redacción.`,
    razonDelPie:
      'Recibe este correo porque abrió una prueba gratuita de Iureon desde la página pública y quedó registrado como socio administrador de la firma.',
    bloques: [
      titular(
        'Su firma ya está creada.',
        `${d.nombre}: la cuenta de ${d.firma} está abierta y usted quedó como socio administrador. No pedimos tarjeta y nada se cobra al terminar la prueba.`
      ),
      dato(
        'PRUEBA INCLUIDA',
        `${DIAS_DE_PRUEBA_GRATUITA} días`,
        `Plan ${def.nombre} · ${usuariosDe(cupo)} · hasta el ${vence}`
      ),
      pares('LA CUENTA', [
        ['Firma', d.firma],
        ['Socio administrador', d.nombre],
        ['Correo de acceso', d.para],
        ['Plan de la prueba', `${def.nombre} · ${usuariosDe(cupo)}`],
        ['La prueba vence el', vence]
      ]),
      botones({ texto: 'Entrar a Iureon', url: URL_ENTRAR }, { texto: 'Ver el manual', url: URL_MANUAL }),
      pasos('PRIMEROS PASOS', [
        {
          titulo: 'Entre con este correo.',
          detalle: 'El acceso es con la dirección de este mensaje y la contraseña que usted eligió al registrarse.'
        },
        {
          titulo: 'Recargue saldo antes de redactar.',
          detalle:
            'El saldo de inteligencia artificial es aparte del plan y empieza en cero. Se recarga desde Saldo › Recargar, con un mínimo de $100.000.'
        },
        {
          titulo: 'Empiece por Redacción.',
          detalle: 'Describa los hechos y la plataforma le propone la actuación del catálogo, con su término y su fuente.'
        }
      ]),
      cita(TESIS),
      nota(
        `Durante la prueba tiene los módulos del plan ${def.nombre}: ${modulosDe(PLAN_DE_PRUEBA)}. ${SIN_CONSUMO} Nada se radica desde Iureon.`
      ),
      nota(
        `Al terminar los ${DIAS_DE_PRUEBA_GRATUITA} días la aplicación pasa a solo lectura: conserva lo que hizo y lo puede seguir leyendo y exportando. Para continuar, contrate un plan desde «Plan» dentro de la aplicación; el saldo que haya recargado no se pierde.`
      )
    ]
  });

  return { asunto, html, texto };
};

export const enviarBienvenida = async (d: DatosDeBienvenida): Promise<ResultadoDeEnvio> => {
  const { asunto, html, texto } = plantillaDeBienvenida(d);
  return enviarCorreo({ para: d.para, asunto, html, texto });
};

/* ══════════════════════ 2. Bienvenida de quien se registró para comprar ══════════════════════ */

export interface DatosDeBienvenidaDeCompra {
  para: string;
  nombre: string;
  firma: string;
  plan: Plan;
}

/**
 * La bienvenida de una firma que se registró PARA PAGAR: la cuenta existe, el
 * plan todavía no.
 *
 * ESTE CORREO NO PUEDE DECIR QUE EL PLAN ESTÁ ACTIVO, y por eso el dato grande
 * es el precio y no una fecha de vencimiento. `trial.rules.ts` crea la firma
 * con `plan_valid_until = ahora`, es decir NACIDA VENCIDA: la primera pantalla
 * que esta persona ve es la franja roja de solo lectura, y un correo que la
 * felicitara por «su plan» la contradiría antes de que abriera la aplicación.
 */
export const plantillaDeBienvenidaDeCompra = (
  d: DatosDeBienvenidaDeCompra
): { asunto: string; html: string; texto: string } => {
  const def = PLANES[d.plan];
  const asunto = `Su cuenta en Iureon está creada · falta activar el plan ${def.nombre}`;

  const { html, texto } = documento({
    titulo: 'Su cuenta en Iureon está creada',
    numero: '01',
    seccion: 'BIENVENIDA',
    mencionaPrecios: true,
    adelanto: `La cuenta de ${d.firma} ya existe. El plan ${def.nombre} se activa cuando se confirme el pago.`,
    razonDelPie:
      'Recibe este correo porque creó una cuenta en Iureon desde la página pública para contratar un plan y quedó registrado como socio administrador.',
    bloques: [
      titular(
        'Su cuenta ya está creada.',
        `${d.nombre}: la cuenta de ${d.firma} está abierta y usted quedó como socio administrador. El plan ${def.nombre} todavía no está activo: se activa cuando la pasarela confirme el primer pago.`
      ),
      dato(
        `PARA ACTIVAR ${def.nombre.toUpperCase()}`,
        pesos(def.precioMensualCop),
        `Al mes, IVA incluido · o ${pesos(def.precioAnualCop)} al año · ${usuariosDe(def.maxUsuarios)}`
      ),
      pares('LA CUENTA', [
        ['Firma', d.firma],
        ['Socio administrador', d.nombre],
        ['Correo de acceso', d.para],
        ['Plan elegido', def.nombre],
        ['Estado del plan', 'Sin activar, a la espera del primer pago']
      ]),
      botones({ texto: 'Entrar y pagar el plan', url: URL_ENTRAR }, { texto: 'Ver el manual', url: URL_MANUAL }),
      pasos('CÓMO SE ACTIVA', [
        {
          titulo: 'Entre con este correo.',
          detalle: 'Mientras no se pague, la aplicación abre en solo lectura y la pantalla del plan queda a la vista.'
        },
        {
          titulo: 'Pague desde «Plan».',
          detalle: 'El cobro lo procesa Wompi. No se guarda su tarjeta y no hay renovación automática.'
        },
        {
          titulo: 'El periodo cuenta desde ese día.',
          detalle: 'Al confirmarse el pago todo se habilita en el acto y le llega la confirmación con la cuenta de cobro.'
        }
      ]),
      cita(TESIS),
      nota(
        `${def.nombre} incluye ${usuariosDe(def.maxUsuarios)} y estos módulos: ${modulosDe(d.plan)}. Nada se radica desde Iureon.`
      ),
      nota(
        `El plan es el derecho a usar la aplicación. El uso de inteligencia artificial se paga aparte, con recargas de saldo desde Saldo › Recargar. ${SIN_CONSUMO}`
      )
    ]
  });

  return { asunto, html, texto };
};

export const enviarBienvenidaDeCompra = async (d: DatosDeBienvenidaDeCompra): Promise<ResultadoDeEnvio> => {
  const { asunto, html, texto } = plantillaDeBienvenidaDeCompra(d);
  return enviarCorreo({ para: d.para, asunto, html, texto });
};
