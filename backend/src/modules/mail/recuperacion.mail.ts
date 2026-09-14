import { enviarCorreo, type ResultadoDeEnvio } from './mail.service';
import { botones, documento, nota, titular } from './plantilla';

/**
 * EL CORREO CON EL ENLACE PARA ELEGIR UNA CONTRASEÑA NUEVA.
 *
 * MISMO DIBUJO QUE LOS DEMÁS CORREOS, POR CONSTRUCCIÓN. No trae marco propio:
 * lo arma `documento()` de `plantilla.ts` —cabecera con el isotipo y el
 * numeral, papel crema, filetes de oro, la píldora azul marino del botón y el
 * pie común con `SITIO`—, la misma pieza de las bienvenidas, la confirmación de
 * plan y la constancia de borrado (maquetas `public/handoff/email-1…4`). La
 * vista previa estática es `public/handoff/email-5-recuperacion.html`, sacada
 * de esta función. `check:recuperacion` falla si este archivo escribe HTML a
 * mano en vez de pedírselo a la plantilla.
 *
 * LO ENVÍA ESTE BACKEND, NO SUPABASE. `auth.admin.generateLink` crea el enlace
 * sin mandar nada, y el correo sale por Resend desde el dominio de Iureon. El
 * correo genérico de Supabase saldría con otro remitente y otro aspecto, que es
 * justo lo que un abogado prudente debería tratar como suplantación.
 *
 * SOLO LLEVA EL ENLACE (SPEC §2.5). Ni el nombre de la persona —no se supone—,
 * ni el de la firma, ni nada de un caso: quien lea la bandeja de otro no
 * aprende más que «alguien pidió cambiar la contraseña».
 *
 * EL ENLACE VA DOS VECES: en el botón y escrito como texto. Hay clientes de
 * correo corporativo que no pintan el botón o no dejan pulsarlo; copiar la
 * dirección tiene que seguir siendo posible.
 */

export const ASUNTO_DE_RECUPERACION = 'Restablecer su contraseña de Iureon';

export const TEXTO_DEL_BOTON = 'Elegir una contraseña nueva';

/** Las dos frases que el titular pidió literales. `minutos` sale de la constante. */
export const fraseDeVigencia = (minutos: number): string =>
  `El enlace vence en ${minutos} minutos y sirve una sola vez.`;

export const FRASE_SI_NO_LO_PIDIO = 'Si usted no pidió este cambio, ignore este correo: su contraseña sigue igual.';

export interface DatosDeRecuperacion {
  para: string;
  /** El enlace a la aplicación, con el token en el fragmento. */
  enlace: string;
  /** `MINUTOS_DE_VIGENCIA_DEL_ENLACE`: quien llama lo pasa; aquí no se supone. */
  minutos: number;
}

export const plantillaDeRecuperacion = (d: Omit<DatosDeRecuperacion, 'para'>) => {
  const bloques = [
    titular(
      'Restablecer su contraseña.',
      `Recibimos una solicitud para restablecer la contraseña de la cuenta de Iureon asociada a este correo. ${fraseDeVigencia(d.minutos)}`
    ),
    botones({ texto: TEXTO_DEL_BOTON, url: d.enlace }),
    nota(`Si el botón no se abre, copie esta dirección en su navegador: ${d.enlace}`),
    nota(
      'Al guardar la contraseña nueva se cierran todas las sesiones abiertas con este correo, en cualquier dispositivo, y se vuelve a entrar con ella.'
    ),
    nota(FRASE_SI_NO_LO_PIDIO),
    nota(
      'Si el enlace venció, pida otro desde «¿Olvidó su contraseña?» en la pantalla de entrada, o pídale a un socio administrador de su firma que le ponga una contraseña nueva.'
    )
  ];

  const { html, texto } = documento({
    titulo: 'Restablecer su contraseña',
    numero: '05',
    seccion: 'RECUPERACIÓN DE CONTRASEÑA',
    mencionaPrecios: false,
    adelanto: `Elija una contraseña nueva. ${fraseDeVigencia(d.minutos)}`,
    razonDelPie:
      'Este correo se envía solo cuando alguien pide restablecer la contraseña desde la pantalla de entrada de Iureon. No contiene material de casos ni datos de clientes.',
    bloques
  });

  return { asunto: ASUNTO_DE_RECUPERACION, html, texto };
};

/** Nunca lanza: `enviarCorreo` devuelve `{ enviado, error }`. */
export const correoDeRecuperacion = async (d: DatosDeRecuperacion): Promise<ResultadoDeEnvio> => {
  const { asunto, html, texto } = plantillaDeRecuperacion(d);
  return enviarCorreo({ para: d.para, asunto, html, texto });
};
