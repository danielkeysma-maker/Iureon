/**
 * QUIÉN DECIDE QUE LA CINTA DEL GUARDADO CEDA SU ALTURA EN EL TELÉFONO.
 *
 * La cinta que dice dónde queda el texto ocupa 83 px encima del escrito, y en
 * un teléfono esos 83 px salen del documento: con la pestaña «Original»
 * abierta se notan en el acto. El titular decidió el 16 de septiembre de 2026
 * devolvérselos al documento, porque el taller guarda solo y repetir en cada
 * renglón que guarda no le dice nada nuevo al abogado.
 *
 * Lo que NO se puede esconder es lo que cambia aquello con lo que el abogado
 * cuenta: que el texto vive solo en esta sesión, que el último cambio no se
 * pudo guardar, que las versiones nuevas ya no caben, o que la cinta trae el
 * único botón que ofrece la salida. Esconder ahí no sería ahorrar altura:
 * sería ocultar la mala noticia.
 *
 * Decide el ESTADO, no el ancho: el ancho solo dice si esta respuesta se
 * aplica —en el computador la cinta no se mueve—. Vive aquí, y no dentro del
 * componente, para que la comprobación pueda ejercitarla estado por estado sin
 * arrastrar media aplicación.
 */
export type EstadoDeLaCinta = {
  /** La firma autoriza conservar el texto y el taller sí lo guarda. */
  activo: boolean;
  estado: 'quieto' | 'guardando' | 'guardado' | 'fallo';
  versionesNoCaben: boolean;
  /** La cinta trae un botón —autorizar el guardado, guardar el borrador— que no vive en ningún otro sitio. */
  hayAccion: boolean;
};

export const cintaSeEscondeEnElTelefono = (e: EstadoDeLaCinta): boolean =>
  e.activo && !e.hayAccion && !e.versionesNoCaben && e.estado !== 'fallo';
