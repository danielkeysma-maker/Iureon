/**
 * EL ESQUELETO COMÚN DE LOS CORREOS TRANSACCIONALES.
 *
 * POR QUÉ EXISTE. Había cuatro maquetas y cinco plantillas escritas a mano,
 * cada una con su propio marco. Cuatro copias del mismo HTML divergen a la
 * primera corrección: se arregla el pie de una y las otras tres siguen diciendo
 * lo viejo. Aquí vive el dibujo —cabecera, filete, dato grande, tabla de pares,
 * botón, lista numerada, pie— y cada correo solo aporta su contenido.
 *
 * CADA BLOQUE DEVUELVE HTML **Y** TEXTO A LA VEZ, a propósito. La regla de la
 * casa es que todo correo lleve las dos versiones y que digan lo mismo; si el
 * texto plano se escribiera aparte, la corrección de una frase se aplicaría en
 * una sola de las dos y nadie lo notaría —el texto plano solo lo ve quien tiene
 * las imágenes apagadas o un lector antiguo—. Con un solo constructor por
 * bloque, no se pueden separar.
 *
 * TÉCNICA DE CORREO, NO DE PÁGINA. Es la de las maquetas del dueño y se
 * conserva entera: tablas `role="presentation"` anidadas, ancho fijo de 600 px
 * con `max-width`, `mso-line-height-rule:exactly` en cada bloque de texto,
 * condicionales de Outlook para el PPP, una media query a 600 px que apila la
 * tabla de pares y estira el botón, y CERO imágenes y CERO JavaScript. Un
 * cliente de correo corporativo bloquea las imágenes y a veces descarta el
 * `<style>`, así que todo lo que decide el aspecto va en atributos `style` en
 * línea; la media query es la única mejora y su ausencia no rompe nada.
 *
 * TODO LO QUE ENTRA SE ESCAPA. Los nombres de firma vienen de la base y traen
 * `&` y `<` con más frecuencia de la que uno esperaría. Quien llama pasa texto
 * llano; el escape lo hace este archivo, una sola vez, en un solo sitio.
 */

/** El dominio real de la aplicación. Las maquetas traían `app.iureon.co`, que no existe. */
export const SITIO = 'https://www.iureoncolombia.com';

/*
 * ENLACES QUE DE VERDAD ABREN ALGO.
 *
 * La aplicación es una sola página sin enrutador: se navega con `?ir=<vista>`,
 * y `App.tsx` acepta EXACTAMENTE `soporte`, `borradores`, `manual`,
 * `privacidad`, `agenda` y `administrar`. Cualquier otra ruta escrita en un
 * correo —`/plan`, `/saldo`, `/facturas`, `/exportar`, `/preferencias`,
 * `/datos`— deja al abogado en una pantalla que no pidió. Un enlace roto en un
 * correo de facturación es peor que no tenerlo, así que lo que no existe se
 * nombra en prosa («Saldo › Recargar») y no se enlaza.
 *
 * `?entrar=1` no es una vista: le dice a la aplicación que quien llega viene a
 * entrar y no debe ser desviado a la portada pública.
 */
export const URL_ENTRAR = `${SITIO}/?entrar=1`;
export const URL_MANUAL = `${SITIO}/?ir=manual`;
export const URL_SOPORTE = `${SITIO}/?ir=soporte`;
export const URL_PRIVACIDAD = `${SITIO}/?ir=privacidad`;
export const URL_BORRADORES = `${SITIO}/?ir=borradores`;

/**
 * El pie: la ciudad, sin la calle.
 *
 * El titular pidió retirar la dirección física el 9 de septiembre de 2026. Se
 * deja la ciudad porque un correo transaccional que no dice de dónde viene se
 * lee como sospechoso, y porque a los programas de reputación de envío les
 * consta menos un remitente sin procedencia alguna.
 */
export const DIRECCION = 'Sincelejo, Sucre, Colombia';

/**
 * El logotipo, al lado del nombre.
 *
 * ─── POR QUÉ PNG Y NO EL SVG DE LA MARCA ────────────────────────────────────
 *
 * Gmail y Outlook ELIMINAN el `<svg>`, así que las marcas vectoriales del
 * producto no sirven aquí. Ésta es la única imagen de todo el correo.
 *
 * ─── EL ISOTIPO CLARO, SOBRE TRANSPARENCIA, Y NO EL ICONO DE LA APLICACIÓN ──
 *
 * El icono de la aplicación trae su cuadro azul marino y encima un trazo casi
 * blanco (#F4F1EA). Recortado a transparencia sobre el papel crema, ese trazo
 * desaparecería y quedaría medio logotipo. La variante clara —`isotipo-light`—
 * está dibujada en marino y oro precisamente para fondos claros, y es la que se
 * rasterizó a 136 px (cuatro veces los 34 en que se pinta).
 *
 * LO QUE ESTO CUESTA, dicho para que nadie lo descubra por sorpresa: sin cuadro
 * de fondo, un cliente que fuerce el modo oscuro invierte el papel y el trazo
 * marino se pierde; el dorado sobrevive. Es el mismo riesgo que ya corre la
 * palabra «Iureon», que también es marina, así que no añade uno nuevo — pero si
 * algún día importa, la salida es una variante con los dos trazos en oro.
 *
 * ─── POR QUÉ EL NOMBRE SIGUE SIENDO TEXTO AL LADO ───────────────────────────
 *
 * La mayoría de los clientes bloquean las imágenes hasta que el destinatario
 * las pide. Si el logotipo fuera la marca, la cabecera aparecería vacía o con
 * un recuadro roto en la primera impresión, que es justo la que cuenta. Por eso
 * la palabra «Iureon» se queda escrita y el logotipo la acompaña: bloqueado, el
 * correo se ve exactamente como se veía antes de tenerlo.
 *
 * ─── POR QUÉ TIENE NOMBRE PROPIO Y NO APUNTA AL ICONO DEL NAVEGADOR ─────────
 *
 * Un correo enviado se queda en la bandeja para siempre y sigue pidiendo esta
 * dirección. Si apuntara al favicon, cambiarlo repintaría correos de hace un
 * año.
 */
const LOGO_URL = `${SITIO}/brand/logo-correo.png`;
const LOGO_PX = 34;

/* ────────────────────────── Paleta y tipografía ────────────────────────── */

const CREMA = '#EDE9DF'; // fondo de la página
const TARJETA = '#FCFBF7'; // el papel
const MARINO = '#14294A'; // azul de marca: cifras grandes y píldora
const ORO = '#C8A046'; // filete y subrayado de los enlaces
const ORO_TEXTO = '#8A6D1F'; // rótulos y numerales, oro legible sobre el papel
const TINTA = '#101822'; // titulares y valores
const PROSA = '#37414F'; // el párrafo de entrada
const APAGADO = '#5C6673'; // etiquetas, notas y pie
const TENUE = '#9AA0A8'; // la letra menuda del cierre
const LINEA = '#EAE5D9'; // filetes internos
const LINEA_PIE = '#E3DED2'; // el filete que separa el pie
const ENLACE = '#17456B'; // brand-700, el mismo de la barra lateral de la aplicación

const FUENTE =
  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** `font-family` + tamaño + interlineado exacto, que es lo que Outlook necesita para no inventarlo. */
const tipo = (size: number, line: number, extra = ''): string =>
  `font-family:${FUENTE};font-size:${size}px;line-height:${line}px;mso-line-height-rule:exactly;${extra}`;

export const escapar = (texto: string): string =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ────────────────────────── Fechas ────────────────────────── */

/*
 * ZONA HORARIA EXPLÍCITA SIEMPRE, Y NUNCA UNA FECHA DESDE «YYYY-MM-DD».
 * El servidor corre en UTC: un pago aplicado a las ocho de la noche en Bogotá
 * saldría en el correo con la fecha del día siguiente. Y `new Date('2026-09-09')`
 * se interpreta como medianoche UTC, que en Colombia es el 8 — este proyecto ya
 * se quemó con eso. Todo lo que entra aquí es un instante completo en ISO.
 */
export const ZONA = 'America/Bogota';

export const fechaLarga = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: ZONA });

/** Día y mes, sin año: es lo que cabe como dato grande sin partirse en dos renglones. */
export const fechaCorta = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', timeZone: ZONA });

/*
 * La hora SIN cero a la izquierda: en castellano se dice «3:42 p. m.», no
 * «03:42 p. m.». `hour: '2-digit'` obliga al cero y es lo que se leía antes.
 */
export const horaDeBogota = (iso: string): string =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: ZONA });

/** Fecha CON hora: una constancia sin hora deja abierta la pregunta de cuándo exactamente. */
export const fechaYHora = (iso: string): string =>
  `${fechaLarga(iso)} a las ${horaDeBogota(iso)} (hora de Colombia)`;

/** Pesos colombianos con el separador de miles de es-CO. */
export const pesos = (n: number): string => `$${Math.round(n).toLocaleString('es-CO')}`;

/* ────────────────────────── Bloques ────────────────────────── */

/** Un tramo del correo, en sus dos versiones a la vez. */
export interface Bloque {
  html: string;
  /** Renglones de la versión de texto plano. */
  texto: string[];
}

export interface Enlace {
  texto: string;
  url: string;
}

/** El `<tr><td>` con los márgenes laterales de la maqueta y la clase que los reduce en el móvil. */
const seccion = (padding: string, contenido: string): string =>
  `<tr><td style="padding:${padding};" class="px">${contenido}</td></tr>`;

/** Filete de una línea, del ancho de la caja. */
const filete = (color: string): string =>
  `<tr><td style="height:1px;background-color:${color};font-size:0;line-height:0;">&nbsp;</td></tr>`;

const fileteAncho = (color: string, columnas: number): string =>
  `<tr><td colspan="${columnas}" style="height:1px;background-color:${color};font-size:0;line-height:0;">&nbsp;</td></tr>`;

/** El rótulo en versalitas espaciadas que encabeza cada bloque. */
const rotulo = (texto: string, color: string, extra = ''): string =>
  `<div style="${tipo(10, 14, `font-weight:500;letter-spacing:2.6px;color:${color};${extra}`)}">${escapar(texto)}</div>`;

/**
 * El titular y el párrafo de entrada.
 *
 * `.h1` y `.lead` los encoge la media query: 37 px partidos en un teléfono
 * dejan una sola palabra por renglón.
 */
export const titular = (h1: string, entrada: string): Bloque => ({
  html: seccion(
    '36px 44px 0 44px',
    `<div class="h1" style="${tipo(37, 44, `font-weight:700;letter-spacing:-1.3px;color:${TINTA};`)}">${escapar(h1)}</div>` +
      `<div class="lead" style="${tipo(16, 28, `font-weight:400;color:${PROSA};padding-top:20px;`)}">${escapar(entrada)}</div>`
  ),
  texto: [h1, '', entrada]
});

/**
 * El dato grande: el protagonista del correo. Uno por mensaje, entre dos
 * filetes. Si hubiera dos, no habría ninguno.
 */
export const dato = (etiqueta: string, valor: string, nota: string): Bloque => ({
  html: seccion(
    '34px 44px 0 44px',
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">` +
      filete(LINEA) +
      `<tr><td style="padding:22px 0 24px 0;">` +
      rotulo(etiqueta, ORO_TEXTO) +
      `<div class="big" style="${tipo(52, 56, `font-weight:700;letter-spacing:-2.2px;color:${MARINO};padding-top:8px;`)}">${escapar(valor)}</div>` +
      `<div style="${tipo(14, 22, `font-weight:400;color:${APAGADO};padding-top:10px;`)}">${escapar(nota)}</div>` +
      `</td></tr>` +
      filete(LINEA) +
      `</table>`
  ),
  texto: ['', `${etiqueta}: ${valor}`, nota]
});

/**
 * La tabla de pares clave/valor.
 *
 * En el móvil `.key` y `.val` la apilan: dos columnas de 44 %/56 % en 320 px
 * parten un correo largo por la mitad.
 */
export const pares = (etiqueta: string, filas: ReadonlyArray<readonly [string, string]>): Bloque => {
  const cuerpo = filas
    .map(
      ([clave, valor], i) =>
        (i === 0 ? '' : fileteAncho(LINEA, 2)) +
        `<tr>` +
        `<td width="44%" valign="top" class="key" style="padding:14px 10px 14px 0;${tipo(13, 21, `font-weight:400;color:${APAGADO};`)}">${escapar(clave)}</td>` +
        `<td width="56%" align="right" valign="top" class="val" style="padding:14px 0;${tipo(14, 21, `font-weight:500;color:${TINTA};`)}">${escapar(valor)}</td>` +
        `</tr>`
    )
    .join('');

  return {
    html: seccion(
      '32px 44px 0 44px',
      rotulo(etiqueta, APAGADO, 'padding-bottom:6px;') +
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${fileteAncho(LINEA, 2)}${cuerpo}</table>`
    ),
    texto: ['', `${etiqueta}:`, ...filas.map(([clave, valor]) => `  ${clave}: ${valor}`)]
  };
};

/**
 * La píldora azul marino, ÚNICO relleno del correo, y a lo sumo un enlace
 * secundario al lado. Dos botones del mismo peso no son una llamada a la
 * acción sino una pregunta.
 */
export const botones = (principal: Enlace, secundario?: Enlace): Bloque => ({
  html: seccion(
    '34px 44px 0 44px',
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>` +
      `<td bgcolor="${MARINO}" class="btn" style="background-color:${MARINO};border-radius:999px;" align="center">` +
      `<a href="${principal.url}" style="display:block;padding:17px 34px;${tipo(15, 19, 'font-weight:500;letter-spacing:-.1px;color:#F4F1EA;text-decoration:none;border-radius:999px;')}">${escapar(principal.texto)}</a>` +
      `</td>` +
      (secundario
        ? `<td class="ghost" valign="middle" style="padding-left:24px;${tipo(14, 20, 'font-weight:400;')}">` +
          `<a href="${secundario.url}" style="color:${ENLACE};text-decoration:none;border-bottom:1px solid ${ORO};">${escapar(secundario.texto)}</a></td>`
        : '') +
      `</tr></table>`
  ),
  texto: ['', `${principal.texto}: ${principal.url}`, ...(secundario ? [`${secundario.texto}: ${secundario.url}`] : [])]
});

export interface Paso {
  titulo: string;
  detalle: string;
}

/** La lista numerada, con el numeral en oro. */
export const pasos = (etiqueta: string, items: readonly Paso[]): Bloque => {
  const cuerpo = items
    .map(
      (paso, i) =>
        (i === 0 ? '' : fileteAncho(LINEA, 3)) +
        `<tr>` +
        `<td width="42" valign="top" style="padding:18px 0;${tipo(15, 24, `font-weight:700;letter-spacing:.2px;color:${ORO_TEXTO};`)}">${String(i + 1).padStart(2, '0')}</td>` +
        `<td width="10" style="font-size:0;line-height:0;">&nbsp;</td>` +
        `<td valign="top" style="padding:18px 0;${tipo(15, 24, `font-weight:500;color:${TINTA};`)}">${escapar(paso.titulo)}` +
        `<span style="display:block;font-size:14px;line-height:23px;font-weight:400;color:${APAGADO};padding-top:3px;">${escapar(paso.detalle)}</span>` +
        `</td></tr>`
    )
    .join('');

  return {
    html: seccion(
      '40px 44px 0 44px',
      rotulo(etiqueta, APAGADO, 'padding-bottom:6px;') +
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${fileteAncho(LINEA, 3)}${cuerpo}</table>`
    ),
    texto: [
      '',
      `${etiqueta}:`,
      ...items.map((paso, i) => `  ${String(i + 1).padStart(2, '0')}. ${paso.titulo} ${paso.detalle}`)
    ]
  };
};

/**
 * Una enumeración sin numeral: sirve para el inventario de lo que se borró, que
 * puede traer veinte renglones y donde numerar sugeriría un orden que no existe.
 */
export const inventario = (etiqueta: string, items: readonly string[]): Bloque => {
  const cuerpo = items
    .map(
      (item, i) =>
        (i === 0 ? '' : fileteAncho(LINEA, 1)) +
        `<tr><td valign="top" style="padding:12px 0;${tipo(14, 22, `font-weight:400;color:${TINTA};`)}">${escapar(item)}</td></tr>`
    )
    .join('');

  return {
    html: seccion(
      '32px 44px 0 44px',
      rotulo(etiqueta, APAGADO, 'padding-bottom:6px;') +
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${fileteAncho(LINEA, 1)}${cuerpo}</table>`
    ),
    texto: ['', `${etiqueta}:`, ...items.map((item) => `  - ${item}`)]
  };
};

/** La línea en azul marino con la que cierra la bienvenida. */
export const cita = (texto: string): Bloque => ({
  html: seccion(
    '40px 44px 0 44px',
    `<div style="${tipo(21, 33, `font-weight:500;letter-spacing:-.5px;color:${MARINO};`)}">«${escapar(texto)}»</div>`
  ),
  texto: ['', `«${texto}»`]
});

/** El párrafo pequeño de cierre, en gris: la letra que matiza lo dicho arriba. */
export const nota = (texto: string): Bloque => ({
  html: seccion(
    '32px 44px 0 44px',
    `<div style="${tipo(13, 23, `font-weight:400;color:${APAGADO};`)}">${escapar(texto)}</div>`
  ),
  texto: ['', texto]
});

/* ────────────────────────── El documento ────────────────────────── */

export interface Documento {
  /** El `<title>` del mensaje. El asunto lo decide quien llama. */
  titulo: string;
  /** El numeral y el rótulo de la cabecera: `01`, `BIENVENIDA`. */
  numero: string;
  seccion: string;
  /** La línea que la bandeja muestra junto al asunto. Oculta en el cuerpo. */
  adelanto: string;
  bloques: readonly Bloque[];
  /** Por qué llegó este correo. Cada mensaje lo dice con sus palabras; uno prestado mentiría. */
  razonDelPie: string;
  /**
   * Si el correo dice alguna cifra en pesos, el pie añade la advertencia de que
   * los precios incluyen IVA y de a nombre de quién se emiten las cuentas de
   * cobro. Es obligatorio decidirlo, no opcional: la maqueta la ponía en los
   * cuatro correos, y en una constancia de borrado —donde no hay ni un precio—
   * la letra menuda sobre facturación es ruido en el peor momento posible.
   */
  mencionaPrecios: boolean;
}

/**
 * El pie: por qué llega, tres enlaces que existen, la dirección y la letra
 * menuda.
 *
 * NO LLEVA «PREFERENCIAS DE AVISO». La maqueta la enlazaba a `/preferencias`,
 * que no es ninguna pantalla de esta aplicación, y prometer un interruptor que
 * no existe es peor que no ofrecerlo. Cuando exista, entra aquí y entra en los
 * seis correos a la vez.
 *
 * TAMPOCO LLEVA WHATSAPP. La maqueta traía `wa.me/573000000000`, que es un
 * marcador: el número real se configura por entorno (`VITE_SUPPORT_WHATSAPP`) y
 * puede no estar puesto. El enlace de soporte apunta a la pantalla de Soporte
 * de la aplicación, que sí existe y que ofrece el canal que esté configurado.
 */
/** La advertencia de facturación, solo donde hay una cifra en pesos que la justifique. */
const LETRA_DE_PRECIOS =
  'Los precios incluyen IVA. Las cuentas de cobro se emiten a nombre del titular de la plataforma.';

const pie = (razon: string, mencionaPrecios: boolean): string => {
  const enlace = (e: Enlace): string =>
    `<a href="${e.url}" style="color:${ENLACE};text-decoration:none;border-bottom:1px solid ${LINEA_PIE};">${escapar(e.texto)}</a>`;

  return (
    seccion(
      '40px 44px 0 44px',
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="height:1px;background-color:${LINEA_PIE};font-size:0;line-height:0;">&nbsp;</td></tr></table>`
    ) +
    seccion(
      '22px 44px 40px 44px',
      `<div style="${tipo(12, 21, `font-weight:400;color:${APAGADO};`)}">${escapar(razon)}</div>` +
        `<div style="${tipo(12, 21, 'padding-top:12px;')}">` +
        [
          enlace({ texto: 'Manual', url: URL_MANUAL }),
          enlace({ texto: 'Soporte', url: URL_SOPORTE }),
          enlace({ texto: 'Tratamiento de datos', url: URL_PRIVACIDAD })
        ].join('&nbsp;&nbsp;&nbsp;') +
        `</div>` +
        `<div style="${tipo(11, 20, `font-weight:400;color:${TENUE};padding-top:16px;`)}">` +
        `Iureon &nbsp;&mdash;&nbsp; ${escapar(DIRECCION)}` +
        (mencionaPrecios ? `<br>${LETRA_DE_PRECIOS}` : '') +
        `</div>`
    )
  );
};

const pieEnTexto = (razon: string, mencionaPrecios: boolean): string[] => [
  '',
  '---',
  razon,
  `Manual: ${URL_MANUAL}`,
  `Soporte: ${URL_SOPORTE}`,
  `Tratamiento de datos: ${URL_PRIVACIDAD}`,
  '',
  `Iureon - ${DIRECCION}`,
  ...(mencionaPrecios ? [LETRA_DE_PRECIOS] : [])
];

/** La cabecera: la marca a la izquierda, el numeral y el rótulo a la derecha, filete oro+gris debajo. */
const cabecera = (numero: string, nombre: string): string =>
  seccion(
    '34px 44px 0 44px',
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">` +
      `<tr>` +
      `<td align="left" valign="bottom" style="${tipo(22, 26, `font-weight:700;letter-spacing:-.6px;color:${MARINO};`)}">` +
      /*
        La imagen y la palabra en la MISMA celda, con la imagen alineada al
        centro vertical del renglón: en dos celdas, un cliente que bloquea la
        imagen deja una columna vacía y el nombre se va al medio de la cabecera.
        `border:0` es para Outlook, que si no dibuja un marco azul de enlace.
      */
      `<img src="${LOGO_URL}" width="${LOGO_PX}" height="${LOGO_PX}" alt="" style="border:0;outline:none;text-decoration:none;vertical-align:middle;margin-right:10px;" />` +
      `<span style="vertical-align:middle;">Iureon</span></td>` +
      `<td align="right" valign="bottom" style="${tipo(10, 14, `font-weight:500;letter-spacing:2.6px;color:${ORO_TEXTO};`)}">${escapar(numero)} &nbsp;&mdash;&nbsp; ${escapar(nombre)}</td>` +
      `</tr>` +
      `<tr><td colspan="2" style="padding-top:16px;">` +
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>` +
      `<td width="54" bgcolor="${ORO}" style="background-color:${ORO};height:2px;font-size:0;line-height:0;">&nbsp;</td>` +
      `<td bgcolor="${LINEA}" style="background-color:${LINEA};height:1px;font-size:0;line-height:0;">&nbsp;</td>` +
      `</tr></table></td></tr>` +
      `</table>`
  );

/**
 * Monta el correo entero.
 *
 * El `<style>` de la cabeza SOLO contiene la media query y el quitado del
 * subrayado: Gmail y Outlook.com conservan un `<style>` simple, pero varios
 * clientes lo descartan entero, y por eso ninguna regla de ahí decide colores,
 * tamaños ni márgenes. Lo que se pierde al descartarlo es que el correo se
 * apile en un teléfono; lo que nunca se pierde es que se lea.
 */
export const documento = (d: Documento): { html: string; texto: string } => {
  const html = `<!DOCTYPE html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapar(d.titulo)}</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<!--[if !mso]><!-- --><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"><!--<![endif]-->
<style>
  a{text-decoration:none}
  @media only screen and (max-width:600px){
    .w{width:100%!important}
    .px{padding-left:26px!important;padding-right:26px!important}
    .h1{font-size:30px!important;line-height:36px!important}
    .big{font-size:44px!important;line-height:48px!important}
    .lead{font-size:16px!important;line-height:27px!important}
    .val{text-align:left!important;padding-top:2px!important;padding-bottom:16px!important}
    .key{padding-bottom:0!important}
    .btn a{display:block!important;text-align:center!important}
    .ghost{display:block!important;padding:16px 0 0 0!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${CREMA};">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;">${escapar(d.adelanto)}</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${CREMA};">
<tr><td align="center" style="padding:40px 12px 48px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="w" style="width:600px;max-width:600px;background-color:${TARJETA};">
${cabecera(d.numero, d.seccion)}
${d.bloques.map((b) => b.html).join('\n')}
${pie(d.razonDelPie, d.mencionaPrecios)}
</table></td></tr></table></body></html>`;

  const texto = [
    `IUREON · ${d.seccion}`,
    ...d.bloques.flatMap((b) => b.texto),
    ...pieEnTexto(d.razonDelPie, d.mencionaPrecios)
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { html, texto };
};
