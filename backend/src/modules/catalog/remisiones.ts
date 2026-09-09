import type {
  Actuacion,
  LegalBranch,
  RemisionDeRama,
  SobreDeRemision
} from './types';

/**
 * QUE UNA ACTUACION SEA ALCANZABLE DESDE CADA RAMA, sin afirmar en esa rama un
 * plazo que nadie leyo para ella.
 *
 * ─── DE DONDE SALE ESTO ─────────────────────────────────────────────────────
 *
 * «El recurso de reposicion no lo veo en restitucion de tierras. Se que puede
 * hacer parte de otra rama y que no se puede duplicar, pero al menos deben
 * aparecer en cada rama del derecho en el listado de esa actuacion. Si no, al
 * revisar un documento quedamos vacios: si no conocemos que tipo de actuacion
 * puede ser, no sabemos como revisar.»
 *
 * Medido: ocho ramas no tenian NINGUNA ficha de reposicion —CONSTITUCIONAL,
 * CONTRATOS, FAMILIA, INSOLVENCIA, INTERNACIONAL, PROPIEDAD_INTELECTUAL,
 * SOCIETARIO y TRIBUTARIO— y dependian de la generica de CIVIL, que el
 * selector no alcanza porque filtra por rama.
 *
 * ─── POR QUE NO SE DUPLICA LA FICHA ─────────────────────────────────────────
 *
 * Ya esta escrito en `types.ts` para lo transversal y vale igual aqui: cada
 * copia exigiria verificar su termino por separado, y seis copias por rama son
 * seis lugares donde un termino corregido puede quedar viejo. Viaja LA MISMA
 * ficha con un sobre que dice de donde viene.
 *
 * ─── POR QUE EL TERMINO SE DEGRADA ──────────────────────────────────────────
 *
 * Porque el mismo nombre puede correr a otro reloj. El propio catalogo lo
 * demuestra: «Recurso de reposicion» son tres dias ante el juez civil (CGP
 * art. 318) y diez ante la administracion (CPACA art. 76). Prestar la ficha
 * con su plazo intacto seria publicar el reloj de otro con sello de
 * verificado, que es el defecto numero uno de la doctrina de verificacion.
 *
 * Asi que la ficha prestada llega con `term.status` en NO_VERIFICADO para esa
 * rama. Lo que decia en su rama de origen se conserva en el sobre, como
 * referencia y nunca como afirmacion, y la firma puede verificarlo PARA SU
 * RAMA desde la pantalla de Catalogo.
 *
 * ─── POR QUE POR RAMA Y NO POR FICHA ────────────────────────────────────────
 *
 * Porque la remision es un hecho de la rama, no de la ficha: lo que hace que
 * el recurso de reposicion exista en un proceso de familia es el art. 1 del
 * CGP, no una linea escrita en la ficha del recurso.
 *
 * ─── Y POR QUE NO SE MARCA TRANSVERSAL ──────────────────────────────────────
 *
 * Decidido el 9 y el 10 de septiembre de 2026: una ficha del CGP no se marca
 * transversal porque su plazo puede ser distinto en otra jurisdiccion. El
 * CPACA regula la nulidad procesal con un reloj mas estrecho, y la Ley 2452 de
 * 2025 el desistimiento laboral. `transversal` dice «es la misma en todas
 * partes»; `porRemision` dice «llega hasta aqui, y su plazo esta por
 * comprobar». Son afirmaciones distintas y no deben colapsarse.
 */

/**
 * LO QUE SE PRESTA, Y NADA MAS.
 *
 * Recursos y actos de tramite comunes a cualquier proceso gobernado por el
 * CGP. La lista esta acotada a proposito y vive en UN solo sitio: prestar
 * «todo CIVIL» meteria la demanda de pertenencia y el remate de inmuebles en
 * la rama de familia, y una lista larga de actuaciones ajenas es peor que
 * ninguna — el abogado deja de leerla.
 *
 * Cada id es una ficha GENERICA: describe el acto procesal, no un acto
 * concreto de un proceso civil. Una ficha como
 * `civil/recurso-de-reposicion-en-concurrencia-de-embargos-de-distintas-especialidades`
 * no entra, porque su supuesto no existe fuera del proceso ejecutivo civil.
 */
export const ACTUACIONES_QUE_SE_PRESTAN: readonly string[] = [
  // Recursos ordinarios.
  'civil/recurso-de-reposicion',
  'civil/recurso-de-apelacion',
  'civil/recurso-de-queja',
  'civil/recurso-de-suplica',
  // Actos de tramite comunes.
  'civil/solicitud-de-nulidad-procesal',
  'civil/desistimiento-de-las-pretensiones',
  'civil/solicitud-de-aclaracion-de-providencia',
  'civil/solicitud-de-adicion-de-providencia',
  'civil/solicitud-de-correccion-de-errores-aritmeticos',
  'civil/solicitud-de-amparo-de-pobreza',
  'civil/solicitud-de-acumulacion-de-procesos',
  'civil/poder-especial-para-actuacion-judicial',
  'civil/sustitucion-revocacion-o-renuncia-del-poder'
];

const IDS_QUE_SE_PRESTAN = new Set(ACTUACIONES_QUE_SE_PRESTAN);

/*
 * ─── LO QUE SE LEYO, Y DONDE ────────────────────────────────────────────────
 *
 * Todo lo de abajo se leyo el 9 de septiembre de 2026 en fuente oficial. El
 * detalle completo, con la fuente y la fecha de consulta de cada norma, esta
 * en `research/remisiones.json`.
 *
 * secretariasenado.gov.co no respondia ese dia (la conexion vencia a los 21
 * segundos), asi que las citas se leyeron en el Gestor Normativo de la Funcion
 * Publica, que es la segunda fuente de la lista blanca de la doctrina.
 *
 * Y el PDF del Gestor Normativo del CGP —«ACTUALIZACION: 27 DE AGOSTO DE
 * 2025»— sirve el Titulo IV en su texto ANTERIOR a la Ley 2445 de 2025: su
 * art. 531 todavia dice «la persona natural no comerciante» y no menciona a la
 * pequena comerciante. Por eso nada de lo que se afirma aqui sobre el Titulo
 * IV se apoya en ese PDF. Una fuente oficial tambien puede estar
 * desactualizada, y esta lo estaba en la parte exacta que tocaba.
 */

/**
 * LAS RAMAS QUE REMITEN AL CGP, cada una con la frase que lo sostiene.
 *
 * Una rama que no este aqui NO recibe fichas prestadas. La ausencia es una
 * decision, no un olvido: las exclusiones y su cita estan mas abajo, en
 * `RAMAS_QUE_NO_REMITEN`.
 */
export const REMISIONES: Readonly<Partial<Record<LegalBranch, RemisionDeRama>>> = {
  /*
   * FAMILIA — no es siquiera una remision: el CGP se aplica DIRECTAMENTE.
   * No existe un codigo procesal de familia separado, como ya declara el
   * encabezado de la rama.
   */
  FAMILIA: {
    estatuto: 'CGP',
    base: 'Ley 1564 de 2012, art. 1',
    citas: [
      'Este código regula la actividad procesal en los asuntos civiles, comerciales, de familia y agrarios.'
    ],
    ramaFuente: 'CIVIL',
    alcance: null,
    fuente: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425',
    consultadoEl: '2026-09-09'
  },

  /*
   * CONTRATOS — los pleitos sobre contratos civiles y comerciales son asuntos
   * civiles y comerciales, y esos los regula el CGP por el mismo art. 1. La
   * rama ya declara en su encabezado que no duplica lo que vive en otra:
   * «se remiten». Esto es esa remision, hecha alcanzable.
   */
  CONTRATOS: {
    estatuto: 'CGP',
    base: 'Ley 1564 de 2012, art. 1',
    citas: [
      'Este código regula la actividad procesal en los asuntos civiles, comerciales, de familia y agrarios.'
    ],
    ramaFuente: 'CIVIL',
    alcance:
      'La rama documenta sobre todo la redacción del contrato, que no es un proceso. Estas fichas sirven cuando el contrato ya se litiga.',
    fuente: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425',
    consultadoEl: '2026-09-09'
  },

  /*
   * SOCIETARIO — dos caminos, y los dos se leyeron. Ante el juez, por ser
   * asunto comercial (art. 1). Ante la Superintendencia de Sociedades en
   * funciones jurisdiccionales, porque el paragrafo 3 del art. 24 le manda
   * usar las mismas vias procesales del juez.
   */
  SOCIETARIO: {
    estatuto: 'CGP',
    base: 'Ley 1564 de 2012, arts. 1 y 24 par. 3',
    citas: [
      'Este código regula la actividad procesal en los asuntos civiles, comerciales, de familia y agrarios.',
      'Las autoridades administrativas tramitarán los procesos a través de las mismas vías procesales previstas en la ley para los jueces.'
    ],
    ramaFuente: 'CIVIL',
    alcance:
      'Los procesos concursales y de reorganización son de única instancia por texto expreso (art. 24 par. 5), así que allí no hay apelación.',
    fuente: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425',
    consultadoEl: '2026-09-09'
  },

  /*
   * PROPIEDAD_INTELECTUAL — la rama declara en su encabezado que la
   * competencia jurisdiccional de la SIC y de la Direccion Nacional de Derecho
   * de Autor viene del art. 24 del CGP. Ese mismo articulo dice con que vias
   * procesales tramitan.
   */
  PROPIEDAD_INTELECTUAL: {
    estatuto: 'CGP',
    base: 'Ley 1564 de 2012, arts. 1 y 24 par. 3',
    citas: [
      'Las autoridades administrativas tramitarán los procesos a través de las mismas vías procesales previstas en la ley para los jueces.',
      'Se aplica, además, a todos los asuntos de cualquier jurisdicción o especialidad y a las actuaciones de particulares y autoridades administrativas, cuando ejerzan funciones jurisdiccionales, en cuanto no estén regulados expresamente en otras leyes.'
    ],
    ramaFuente: 'CIVIL',
    alcance:
      'Cubre lo jurisdiccional ante la SIC y la Dirección Nacional de Derecho de Autor. Lo administrativo ante la SIC —registro, oposición, cancelación— se rige por la Decisión Andina 486 y el CPACA, no por el CGP.',
    fuente: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425',
    consultadoEl: '2026-09-09'
  },

  /*
   * INSOLVENCIA — el caso mas directo de todos y el que mas cuidado pide.
   *
   * Esta rama ES el CGP: su procedimiento vive en el Titulo IV del mismo
   * codigo (arts. 531 a 576A, reescritos por la Ley 2445 de 2025). No hay
   * remision que hacer; el art. 318 se aplica por si mismo. Pero se aplica
   * «Salvo norma en contrario», y el Titulo IV trae varias: hay autos que la
   * ley declara sin recurso y una reposicion que se interpone ante el
   * CONCILIADOR y no ante el juez. Por eso el alcance lo dice, y por eso el
   * plazo no se afirma.
   */
  INSOLVENCIA: {
    estatuto: 'CGP',
    base: 'Ley 1564 de 2012, arts. 1 y 318',
    citas: [
      'Este código regula la actividad procesal en los asuntos civiles, comerciales, de familia y agrarios.',
      'Salvo norma en contrario, el recurso de reposición procede contra los autos que dicte el juez, contra los del magistrado sustanciador no susceptibles de súplica y contra los de la Sala de Casación Civil de la Corte Suprema de Justicia, para que se reformen o revoquen.'
    ],
    ramaFuente: 'CIVIL',
    alcance:
      'El Título IV del propio CGP trae normas en contrario: hay autos que la ley declara sin recurso y una reposición que se interpone ante el conciliador. Compruebe el artículo del trámite antes de recurrir.',
    fuente: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425',
    consultadoEl: '2026-09-09'
  },

  /*
   * CONSTITUCIONAL — AQUI EL TITULAR PIDIO EXCLUIR, Y EL TEXTO DICE OTRA COSA.
   *
   * El encargo decia: «excluye CONSTITUCIONAL (tutela, Decreto 2591 de 1991:
   * impugnacion, no reposicion)». Para la tutela es exacto: contra el fallo el
   * recurso es la impugnacion de tres dias del art. 31, y la palabra
   * «reposicion» solo aparece en el decreto para decir que NO hay que agotarla
   * antes de tutelar (art. 9).
   *
   * Pero esta rama no es solo la tutela. Tambien trae las acciones populares y
   * de grupo de la Ley 472 de 1998, y esa ley SI da la reposicion por texto
   * expreso: su art. 36 se titula «RECURSO DE REPOSICION» y la remite al
   * estatuto procesal civil. Excluir la rama entera dejaria al abogado de una
   * accion popular sin ninguna reposicion alcanzable, que es exactamente la
   * queja que origino todo esto.
   *
   * Asi que la rama entra CON ALCANCE DECLARADO, y el alcance nombra la tutela
   * para que nadie confunda las dos cosas.
   */
  CONSTITUCIONAL: {
    estatuto: 'CGP',
    base: 'Ley 472 de 1998, arts. 36 y 44',
    citas: [
      'Contra los autos dictados durante el trámite de la Acción Popular procede el recurso de reposición, el cual será interpuesto en los términos del Código de Procedimiento Civil.',
      'En los procesos por acciones populares se aplicarán las disposiciones del Código de Procedimiento Civil y del Código Contencioso Administrativo dependiendo de la jurisdicción que le corresponda, en los aspectos no regulados en la presente ley, mientras no se opongan a la naturaleza y la finalidad de tales acciones.'
    ],
    ramaFuente: 'CIVIL',
    alcance:
      'Solo para las acciones populares y de grupo. En la tutela el recurso contra el fallo es la impugnación de tres días del art. 31 del Decreto 2591 de 1991, no la reposición.',
    fuente: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=188',
    consultadoEl: '2026-09-09'
  }
};

/**
 * LAS RAMAS QUE NO REMITEN, con la frase por la que no lo hacen.
 *
 * No se usa en tiempo de ejecucion: una rama no listada en `REMISIONES` ya no
 * recibe nada. Existe porque una exclusion sin cita es indistinguible de un
 * olvido, y el proximo que lea este archivo tiene que poder saber cual de las
 * dos cosas fue.
 */
export const RAMAS_QUE_NO_REMITEN: Readonly<
  Partial<Record<LegalBranch, { base: string; citas: string[]; razon: string; fuente: string }>>
> = {
  /*
   * TRIBUTARIO — la rama cubre el procedimiento ANTE LA DIAN, que es
   * administrativo y no judicial. Su norma residual no es el CGP sino el
   * CPACA, y los recursos que ahi proceden son los del art. 74, no los del
   * art. 318. La etapa judicial de esta materia ya vive en ADMINISTRATIVO.
   */
  TRIBUTARIO: {
    base: 'Ley 1437 de 2011, arts. 34 y 74',
    citas: [
      'Las actuaciones administrativas se sujetarán al procedimiento administrativo común y principal que se establece en este Código, sin perjuicio de los procedimientos administrativos regulados por leyes especiales. En lo no previsto en dichas leyes se aplicarán las disposiciones de esta Parte Primera del Código.',
      'Por regla general, contra los actos definitivos procederán los siguientes recursos:'
    ],
    razon:
      'Los actos de la DIAN son actos administrativos. El Estatuto Tributario trae sus propios recursos —reposición y reconsideración, ya catalogados en esta rama— y lo no previsto lo llena el CPACA, no el CGP.',
    fuente: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },

  /*
   * INTERNACIONAL — el unico tramite de la rama que el CGP gobierna es el
   * exequatur, y ahi la ficha generica de CIVIL nombraria la autoridad
   * equivocada: no se presenta ante «el juez que dicto el auto» sino ante la
   * Sala de Casacion Civil de la Corte Suprema. Y la autoridad competente es
   * parte del plazo (doctrina, regla 7). El resto de la rama —extradicion de
   * la Ley 906, arbitraje internacional de la Ley 1563, tramites ante la
   * CIDH— corre por normas cuyo regimen de recursos no se releyo en esta
   * pasada, y una remision que no se leyo no se declara.
   */
  INTERNACIONAL: {
    base: 'Ley 1564 de 2012, art. 607',
    citas: [
      'La demanda sobre exequátur de una sentencia extranjera, con el fin de que produzca efectos en Colombia, se presentará por el interesado a la Sala de Casación Civil de la Corte Suprema de Justicia, salvo que conforme a los tratados internacionales corresponda a otro juez, y ante ella deberá citarse a la parte afectada por la sentencia, si hubiere sido dictado en proceso contencioso.'
    ],
    razon:
      'El exequátur va ante la Sala de Casación Civil, no ante el juez que la ficha civil nombra; y la extradición, el arbitraje internacional y los trámites ante la CIDH corren por normas cuyo régimen de recursos no se releyó. Queda declarado como hueco.',
    fuente: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  }
};

/** La marca corta que la pantalla pinta junto al nombre. */
export const MARCA_POR_REMISION = 'por remisión del CGP · plazo sin verificar en esta rama';

/** El aviso largo, en la ficha y en lo que se le entrega al motor. */
export const AVISO_POR_REMISION =
  'Plazo del proceso civil por remisión; no verificado para esta rama.';

export const remisionDe = (branch: LegalBranch): RemisionDeRama | null =>
  REMISIONES[branch] ?? null;

/** True cuando la ficha es una de las que se prestan. */
export const sePresta = (actuacion: Actuacion): boolean => IDS_QUE_SE_PRESTAN.has(actuacion.id);

/**
 * Envuelve una ficha para una rama prestataria.
 *
 * ─── QUE CAMBIA Y QUE NO ────────────────────────────────────────────────────
 *
 * `branch` NO cambia: la ficha sigue siendo de CIVIL y decirlo de otro modo
 * seria inventar una ficha que no existe. Lo que cambia es el termino, que se
 * degrada, y el fundamento, que se completa con la remision.
 *
 * El fundamento se completa a proposito, y no solo el sobre: lo que el motor
 * de redaccion recibe verbatim es `legalBasis`, y ese es el unico sitio donde
 * la advertencia llega hasta el modelo sin que el catalogo tenga que reescribir
 * el bloque de instrucciones que vive en otro modulo.
 */
export const envolverPorRemision = (
  actuacion: Actuacion,
  paraRama: LegalBranch,
  remision: RemisionDeRama
): Actuacion => {
  const sobre: SobreDeRemision = {
    ramaFuente: remision.ramaFuente,
    paraRama,
    estatuto: remision.estatuto,
    base: remision.base,
    marca: MARCA_POR_REMISION,
    aviso: AVISO_POR_REMISION,
    alcance: remision.alcance,
    terminoEnLaRamaFuente: actuacion.term,
    legalBasisEnLaRamaFuente: actuacion.legalBasis
  };

  const alcance = remision.alcance ? ` ${remision.alcance}` : '';

  return {
    ...actuacion,
    legalBasis: `${actuacion.legalBasis} — llega a ${paraRama} por remisión (${remision.base}). ${AVISO_POR_REMISION}${alcance} No afirme que este plazo es el de ${paraRama}.`,
    /*
     * DEGRADADO, y sin descripcion. El contrato del tipo es que
     * NO_VERIFICADO no lleva texto de termino, y romperlo dejaria un plazo
     * descrito que nadie comprobo para esta rama — exactamente el estado que
     * `TermStatus` existe para impedir. Lo que decia en lo civil se conserva
     * en `sobre.terminoEnLaRamaFuente`, que la pantalla muestra rotulado como
     * referencia.
     */
    term: { status: 'NO_VERIFICADO', description: null },
    porRemision: sobre
  };
};

/**
 * Las fichas prestadas que le corresponden a una rama, ya envueltas.
 *
 * Devuelve vacio cuando la rama no remite, cuando es la rama fuente, o cuando
 * la fuente no tiene la ficha. Nunca lanza: una rama sin remision es el caso
 * normal.
 */
export const fichasPorRemision = (
  branch: LegalBranch,
  todas: readonly Actuacion[]
): Actuacion[] => {
  const remision = remisionDe(branch);
  if (!remision || remision.ramaFuente === branch) return [];

  /*
   * EL ORDEN DE `ACTUACIONES_QUE_SE_PRESTAN` MANDA, y no el del catalogo. La
   * lista se leyo de arriba abajo cuando se escribio —los cuatro recursos
   * primero, los tramites despues— y el abogado que la vea al final de su rama
   * merece ese mismo orden y no el que dejo el generador.
   */
  const porId = new Map(todas.map((a) => [a.id, a]));

  return ACTUACIONES_QUE_SE_PRESTAN.flatMap((id) => {
    const base = porId.get(id);
    if (!base || base.branch !== remision.ramaFuente) return [];
    return [envolverPorRemision(base, branch, remision)];
  });
};
