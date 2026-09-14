import { branchLabel } from '../catalog/branchLabels';
import type { EstadoDelPerfil } from './hooks/usePerfilDeEstilo';
import type {
  ContenidoDeLeccion,
  EstiloAplicado,
  EstiloConsolidado,
  FuenteDeLeccion,
  ItemDescartado,
  MetaDeLeccion,
  Numeracion,
  RolDelEstilo
} from './types';

/**
 * Lo que las pantallas del estilo de la firma DICEN, en funciones puras.
 *
 * Vive aquí y no en los componentes para que `check:estilo` lo lea sin montar
 * React, y para que el precio y las frases que el dueño aprobó estén escritos
 * una sola vez.
 *
 * ─── NUNCA «APRENDE» ───────────────────────────────────────────────────────
 *
 * La plataforma guarda un formato. No aprende, no entrena, no «se adapta». La
 * única vez que esas palabras aparecen es para negarlas, en el pie del diálogo,
 * y el check lo vigila: la versión anterior de este botón respondía
 * «Aprendido» sin guardar nada.
 */

/**
 * El precio de «Leer el formato», en pesos. Es `PRICE_COP.ESTILO` del servidor
 * (`billing.service.ts`); `check:estilo` compara los dos y falla si se separan.
 * Es el piso: el servidor cobra el mayor entre el piso y lo que midió, y un
 * escrito ordinario no pasa del piso.
 */
export const PRECIO_LEER_FORMATO_COP = 100;

const pesos = (n: number): string => `$${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

export const TEXTO_BOTON_LEER = `Leer el formato · ${pesos(PRECIO_LEER_FORMATO_COP)}`;
export const TEXTO_BOTON_ENSENAR = 'Enseñar este formato';
export const MENSAJE_SOLO_SOCIO = 'Solo el socio administrador puede enseñar el formato de la firma.';
export const MENSAJE_GUARDADO = 'Guardado. Se usará desde el próximo borrador.';
export const TEXTO_INTERRUPTOR = 'Usar el formato y la jerga que su firma enseñó';

/** Enseñar es del socio administrador; el servidor lo impone igual, esto solo evita ofrecer lo que se negará. */
export const puedeEnsenar = (role?: string | null): boolean => role === 'FIRM_ADMIN' || role === 'SUPER_ADMIN';

export const ETIQUETA_ROL: Record<RolDelEstilo, string> = { LITIGANTE: 'Litigante', DESPACHO: 'Despacho', SECRETARIA: 'Secretaría' };

const nombreDeRama = (rama: string | null): string => (rama ? branchLabel(rama) : 'todas las ramas');
const escritos = (n: number): string => `${n} ${n === 1 ? 'escrito' : 'escritos'}`;

export const subtituloDelDialogo = (rol: RolDelEstilo, rama: string | null): string =>
  `Los próximos borradores de ${ETIQUETA_ROL[rol]} · ${nombreDeRama(rama)} saldrán con el formato y la jerga de este escrito.`;

export const pieDelDialogo = (rol: RolDelEstilo, rama: string | null): string =>
  `La plataforma no aprende de sus escritos ni entrena nada: guarda un formato. Se aplica a toda la firma para escritos de ${ETIQUETA_ROL[rol]} en ${nombreDeRama(rama)}. Puede quitarlo cuando quiera, desde Ajustes → Estilo de la firma.`;

export const QUE_SE_GUARDA = [
  'Cómo titula las secciones y numera los hechos',
  'Las fórmulas de cortesía y de cierre que usa',
  'El orden de los acápites y el bloque de firma',
  'El vocabulario que prefiere, con un ejemplo sin datos del caso'
];

export const QUE_NO_SE_GUARDA = [
  'El texto del escrito',
  'Los datos de su cliente ni los hechos del caso',
  'Ningún artículo, plazo ni afirmación jurídica'
];

/** «No se guardó: menciona un plazo». */
export const motivoLegible = (d: ItemDescartado): string => `No se guardó: ${d.motivo}`;

/** El paso 3 del asistente: con perfil hay interruptor; sin perfil, una línea que lo dice. */
export type LineaDelPaso3 =
  | { tipo: 'CON_PERFIL'; detalle: string }
  | { tipo: 'SIN_PERFIL'; texto: string };

export const lineaDelPaso3 = (perfil: { lecciones: number; rama: string | null } | null, rol: RolDelEstilo): LineaDelPaso3 =>
  perfil && perfil.lecciones > 0
    ? {
        tipo: 'CON_PERFIL',
        detalle: `${escritos(perfil.lecciones)} de ${ETIQUETA_ROL[rol]}${perfil.rama ? ` · ${branchLabel(perfil.rama)}` : ''} · manda sobre el formato por defecto, nunca sobre lo que exige la norma`
      }
    : { tipo: 'SIN_PERFIL', texto: `Su firma aún no ha enseñado un formato para ${ETIQUETA_ROL[rol]}. Se redacta con el formato por defecto.` };

/** «Con el estilo de su firma (Litigante · Laboral · 4 escritos)». */
export const etiquetaEstiloAplicado = (e: EstiloAplicado): string =>
  `Con el estilo de su firma (${ETIQUETA_ROL[e.rol]} · ${e.rama ? branchLabel(e.rama) : 'general del rol'} · ${escritos(e.lecciones)})`;

/* ─── La vista previa: un ítem por casilla ──────────────────────────────── */

const NUMERACION: Record<Numeracion, string> = {
  ROMANOS: 'romanos',
  ARABIGOS: 'arábigos',
  ORDINALES: 'ordinales',
  NINGUNA: 'sin numerar'
};
const PERSONA = { PRIMERA_SINGULAR: 'primera persona', PRIMERA_PLURAL: 'primera persona del plural', TERCERA: 'tercera persona' } as const;

export interface ItemDeLaLectura {
  clave: string;
  grupo: string;
  texto: string;
}

export const itemsDeLaLectura = (c: ContenidoDeLeccion): ItemDeLaLectura[] => [
  ...c.titulosDeSeccion.map((t, i) => ({ clave: `titulosDeSeccion.${i}`, grupo: 'Títulos de sección', texto: `${t.titulo} (${NUMERACION[t.numeracion]})` })),
  ...(c.numeracionHechos ? [{ clave: 'numeracionHechos', grupo: 'Numeración de los hechos', texto: NUMERACION[c.numeracionHechos] }] : []),
  ...(c.ordenDeSecciones.length ? [{ clave: 'ordenDeSecciones', grupo: 'Orden de las secciones', texto: c.ordenDeSecciones.join(' → ') }] : []),
  ...(c.encabezado ? [{ clave: 'encabezado', grupo: 'Encabezado', texto: c.encabezado }] : []),
  ...c.formulasDeApertura.map((f, i) => ({ clave: `formulasDeApertura.${i}`, grupo: 'Fórmulas de apertura', texto: f })),
  ...c.formulasDeCierre.map((f, i) => ({ clave: `formulasDeCierre.${i}`, grupo: 'Fórmulas de cierre', texto: f })),
  ...(c.bloqueDeFirma.length ? [{ clave: 'bloqueDeFirma', grupo: 'Bloque de firma', texto: c.bloqueDeFirma.join(' / ') }] : []),
  ...(c.tratamiento
    ? [
        {
          clave: 'tratamiento',
          grupo: 'Tratamiento',
          texto: `${c.tratamiento.formula}${c.tratamiento.persona ? ` · ${PERSONA[c.tratamiento.persona]}` : ''}`
        }
      ]
    : []),
  ...c.glosario.map((g, i) => ({
    clave: `glosario.${i}`,
    grupo: 'Vocabulario',
    texto: `«${g.preferido}»${g.variantes.length ? ` en lugar de ${g.variantes.map((v) => `«${v}»`).join(', ')}` : ''}`
  }))
];

/** El contenido sin lo que el socio desmarcó. */
export const contenidoConLoMarcado = (c: ContenidoDeLeccion, desmarcadas: ReadonlySet<string>): ContenidoDeLeccion => {
  const queda = (clave: string): boolean => !desmarcadas.has(clave);
  return {
    titulosDeSeccion: c.titulosDeSeccion.filter((_, i) => queda(`titulosDeSeccion.${i}`)),
    numeracionHechos: queda('numeracionHechos') ? c.numeracionHechos : null,
    ordenDeSecciones: queda('ordenDeSecciones') ? c.ordenDeSecciones : [],
    encabezado: queda('encabezado') ? c.encabezado : '',
    formulasDeApertura: c.formulasDeApertura.filter((_, i) => queda(`formulasDeApertura.${i}`)),
    formulasDeCierre: c.formulasDeCierre.filter((_, i) => queda(`formulasDeCierre.${i}`)),
    bloqueDeFirma: queda('bloqueDeFirma') ? c.bloqueDeFirma : [],
    tratamiento: queda('tratamiento') ? c.tratamiento : null,
    glosario: c.glosario.filter((_, i) => queda(`glosario.${i}`))
  };
};

/* ─── Ajustes → Estilo de la firma ──────────────────────────────────────── */

/*
 * EL NOMBRE DE LA SECCIÓN ES EL QUE PROMETE EL PIE DEL DIÁLOGO. «Puede quitarlo
 * cuando quiera, desde Ajustes → Estilo de la firma» estuvo escrito antes de
 * que la sección existiera; `check:estilo` exige que el pie y la entrada de
 * Ajustes digan lo mismo, para que la promesa no vuelva a apuntar a nada.
 */
export const TITULO_SECCION_AJUSTES = 'Estilo de la firma';
export const TEXTO_SECCION_AJUSTES = 'Lo enseña un socio administrador desde un escrito terminado. Aplica a toda la firma.';
export const LINEA_RECALCULO = 'Quitar un escrito recalcula el estilo al instante. Ningún texto de sus casos está guardado aquí.';
export const MENSAJE_ERROR_AL_LEER = 'No se pudo leer el estilo de la firma';
export const MENSAJE_SOLO_SOCIO_QUITAR = 'Solo el socio administrador puede quitar un escrito enseñado. Usted puede leer el estilo de la firma.';
export const MENSAJE_QUITADO = 'Se quitó el escrito. El estilo ya se recalculó con los que quedan.';
export const OPCION_GENERAL_DEL_ROL = 'General del rol';
export const TEXTO_ENLACE_AJUSTES = 'Abrir Ajustes → Estilo de la firma';

export const ETIQUETA_FUENTE: Record<FuenteDeLeccion, string> = {
  BORRADOR: 'Desde un borrador',
  ESCRITO_SUBIDO: 'Desde un escrito subido',
  EDICION: 'Desde una edición en el taller'
};

/** «visto en 1 escrito», «visto en 4 escritos». */
export const vistoEn = (n: number): string => `visto en ${escritos(n)}`;

/** «Litigante · Laboral & Seguridad Social», «Despacho · general del rol». */
export const nombreDelAlcance = (rol: RolDelEstilo, rama: string | null): string =>
  `${ETIQUETA_ROL[rol]} · ${rama ? branchLabel(rama) : 'general del rol'}`;

export type LecturaDeLaSeccion =
  | { tipo: 'CARGANDO'; texto: string }
  | { tipo: 'ERROR'; texto: string }
  | { tipo: 'VACIO'; texto: string }
  | { tipo: 'PERFIL'; alcance: string; respaldo: string | null };

/**
 * Qué dice la sección para un rol y una rama.
 *
 * UN FALLO NO ES UN VACÍO. «Su firma aún no ha enseñado un formato» es una
 * afirmación sobre la base; si la consulta no respondió, no se sabe, y decirlo
 * invitaría al socio a enseñar de nuevo lo que ya está guardado.
 *
 * EL RESPALDO SE DICE. Si para la rama no hay lecciones, lo que se ve es el
 * general del rol —el mismo que se aplica al redactar— y quitar aquí quita del
 * general, que también usan las demás ramas.
 */
export const lecturaDeLaSeccion = (estado: EstadoDelPerfil): LecturaDeLaSeccion => {
  if (estado.estado === 'CARGANDO') return { tipo: 'CARGANDO', texto: 'Leyendo el estilo de la firma…' };
  if (estado.estado === 'ERROR') return { tipo: 'ERROR', texto: MENSAJE_ERROR_AL_LEER };
  const r = estado.respuesta;
  if (r.perfil.lecciones === 0) {
    const donde = r.ramaPedida ? `${ETIQUETA_ROL[r.rol]} en ${branchLabel(r.ramaPedida)} ni para el general del rol` : `${ETIQUETA_ROL[r.rol]} (general del rol)`;
    return {
      tipo: 'VACIO',
      texto: `Su firma aún no ha enseñado un formato para ${donde}. Se enseña con «${TEXTO_BOTON_ENSENAR}» desde un borrador terminado.`
    };
  }
  const respaldo =
    r.ramaPedida && r.rama === null
      ? `Para ${branchLabel(r.ramaPedida)} su firma no ha enseñado un formato propio: a esos escritos se les aplica el general de ${ETIQUETA_ROL[r.rol]}. Lo que se ve y lo que se quite aquí es ese general.`
      : null;
  return { tipo: 'PERFIL', alcance: nombreDelAlcance(r.rol, r.rama), respaldo };
};

export interface FilaDelEstilo {
  clave: string;
  titulo: string;
  items: Array<{ texto: string; detalle?: string }>;
}

/** La vista consolidada, en el orden en que se lee un escrito. Solo lo que existe: una fila vacía no se pinta. */
export const filasDelEstilo = (p: EstiloConsolidado): FilaDelEstilo[] => {
  const filas: FilaDelEstilo[] = [
    { clave: 'titulos', titulo: 'Títulos de sección', items: p.titulosDeSeccion.map((t) => ({ texto: t.titulo, detalle: `numeración: ${NUMERACION[t.numeracion]}` })) },
    { clave: 'orden', titulo: 'Orden de las secciones', items: p.ordenDeSecciones.length ? [{ texto: p.ordenDeSecciones.join(' → ') }] : [] },
    { clave: 'numeracion', titulo: 'Numeración de los hechos', items: p.numeracionHechos ? [{ texto: NUMERACION[p.numeracionHechos] }] : [] },
    { clave: 'encabezado', titulo: 'Encabezado', items: p.encabezado ? [{ texto: p.encabezado.texto, detalle: vistoEn(p.encabezado.vistoEn) }] : [] },
    { clave: 'apertura', titulo: 'Fórmulas de apertura', items: p.formulasDeApertura.map((f) => ({ texto: f.texto, detalle: vistoEn(f.vistoEn) })) },
    { clave: 'cierre', titulo: 'Fórmulas de cierre', items: p.formulasDeCierre.map((f) => ({ texto: f.texto, detalle: vistoEn(f.vistoEn) })) },
    {
      clave: 'tratamiento',
      titulo: 'Tratamiento',
      items: p.tratamiento ? [{ texto: p.tratamiento.formula, detalle: p.tratamiento.persona ? PERSONA[p.tratamiento.persona] : undefined }] : []
    },
    { clave: 'firma', titulo: 'Bloque de firma', items: p.bloqueDeFirma.map((linea) => ({ texto: linea })) },
    {
      clave: 'glosario',
      titulo: 'Glosario',
      items: p.glosario.map((g) => ({
        texto: `«${g.preferido}»${g.variantes.length ? ` en lugar de ${g.variantes.map((v) => `«${v}»`).join(', ')}` : ''}`,
        detalle: vistoEn(g.vistoEn)
      }))
    }
  ];
  return filas.filter((f) => f.items.length > 0);
};

/** Lo que pregunta la confirmación de «Quitar». */
export const confirmacionDeQuitar = (
  leccion: MetaDeLeccion,
  fecha: (iso: string) => string
): { titulo: string; texto: string; detalle: string } => ({
  titulo: 'Quitar este escrito del estilo',
  texto: `El estilo de ${nombreDelAlcance(leccion.rol, leccion.rama)} se recalcula al instante con los escritos que quedan: los próximos borradores ya no usarán lo que este escrito enseñó. Los borradores ya redactados no cambian.`,
  detalle: `Enseñado el ${fecha(leccion.createdAt)} por ${leccion.taughtBy} · ${ETIQUETA_FUENTE[leccion.fuente]}`
});
