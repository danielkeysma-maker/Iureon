import type { InformeDeDocumentoRecibido, ClaseDeAtaque, PuntoDeAtaque } from './review.api';

/**
 * «Por dónde se ataca»: los rótulos de cada clase de flanco, y el puente que
 * lleva lo hallado a la guía de actuaciones.
 *
 * ─── POR QUÉ VIVE APARTE ────────────────────────────────────────────────────
 *
 * Lo usan tres sitios que no se pueden importar entre sí sin arrastrar cosas:
 * el diálogo (React), el dibujo del PDF (que corre en Node, sin Vite, para
 * poder comprobarse) y la exportación a Word. Aquí no se importa nada: solo
 * tipos, que se borran al compilar. Así los tres dicen exactamente lo mismo y
 * ninguno se queda atrás cuando cambie una palabra.
 */

export const ETIQUETA_DE_ATAQUE: Record<ClaseDeAtaque, string> = {
  NO_SE_SOSTIENE: 'Lo que afirma y no se sostiene',
  TENSION_CON_LA_NORMA: 'Tensión con la norma que el propio documento cita',
  NO_RESUELVE: 'Se le pidió y no lo resolvió',
  SIN_APOYO_CITADO: 'Lo afirma sin apoyo citado'
};

export const etiquetaDeAtaque = (clase: ClaseDeAtaque): string => ETIQUETA_DE_ATAQUE[clase] ?? ETIQUETA_DE_ATAQUE.NO_SE_SOSTIENE;

/** Los puntos de ataque de un informe, tolerando los guardados antes de que existieran. */
export const puntosDeAtaqueDe = (informe: InformeDeDocumentoRecibido | null | undefined): PuntoDeAtaque[] =>
  informe?.porDondeSeAtaca ?? [];

/**
 * Los hechos con los que se consulta la guía de actuaciones después de leer un
 * documento recibido.
 *
 * ─── EL PUENTE YA EXISTÍA; LO QUE CAMBIA ES CON QUÉ VIAJA ───────────────────
 *
 * Antes se le entregaba a la guía el texto crudo del documento, y el catálogo
 * proponía candidatas para «esto que llegó». Pero lo que el abogado quiere
 * cuando lee un auto que le cierra una puerta no es una actuación cualquiera:
 * es la que sirve para ATACAR lo que el juez dijo. Por eso los flancos que
 * halló el informe encabezan los hechos, con su cita al lado, y el texto del
 * documento queda debajo como el respaldo que es.
 *
 * LO QUE NO CAMBIA, y es lo importante: aquí no se propone ninguna actuación.
 * El nombre lo sigue dando el CATÁLOGO —la guía lo resuelve contra su lista
 * cerrada— y lo sigue escogiendo una persona. Esto solo decide qué se le
 * cuenta a esa guía.
 */
export const hechosParaLaGuia = (informe: InformeDeDocumentoRecibido | null | undefined, textoDelDocumento: string): string => {
  const puntos = puntosDeAtaqueDe(informe);
  const texto = textoDelDocumento.trim();
  if (puntos.length === 0) return texto;

  const lineas = puntos.map((p) =>
    [
      `- ${etiquetaDeAtaque(p.clase)}.`,
      `  Dice el documento: «${p.cita}»`,
      p.norma && p.citaDeLaNorma ? `  Norma en que él mismo se apoya, ${p.norma}, transcrita así: «${p.citaDeLaNorma}»` : '',
      p.lectura ? `  Lectura del revisor: ${p.lectura}` : ''
    ]
      .filter(Boolean)
      .join('\n')
  );

  return [
    'Busco la actuación que sirva para ATACAR lo que resolvió el documento que recibí.',
    informe?.queEs ? `El documento es: ${informe.queEs}` : '',
    informe?.quienLoProfirio ? `Lo profirió: ${informe.quienLoProfirio}` : '',
    '',
    'POR DÓNDE SE ATACA, según la lectura del documento (cada punto va con las palabras del propio documento):',
    ...lineas,
    '',
    'TEXTO DEL DOCUMENTO RECIBIDO:',
    texto
  ]
    .filter((x) => x !== '')
    .join('\n');
};
