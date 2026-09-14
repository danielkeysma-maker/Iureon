import { motivoJuridico } from './guardaJuridica';
import { sanearTexto } from './saneamiento';
import type { EstiloConsolidado, Numeracion, RolDelEstilo } from './types';

/**
 * El bloque que el estilo de la firma le pone al prompt de la redacción.
 *
 * ─── LA FRASE DE PRECEDENCIA ES LA PIEZA QUE MANDA ─────────────────────────
 *
 * El estilo llega DESPUÉS de la estructura obligatoria de la ficha, de la regla
 * de citación y del formato de Membrete, y un modelo tiende a obedecer lo
 * último que leyó. Por eso el bloque abre diciendo qué gobierna (la redacción)
 * y qué no puede tocar (hechos, normas, plazos, pretensiones, jurisprudencia,
 * secciones [OBLIGATORIA]). El orden de precedencia es: ficha y reglas de
 * citación > campos explícitos de Membrete > estilo enseñado > formato por
 * defecto.
 *
 * ─── LA GUARDA CORRE OTRA VEZ AQUÍ ─────────────────────────────────────────
 *
 * Lo guardado ya pasó por la guarda al enseñarse. Se repite al renderizar
 * porque una fila puede venir de antes de una regla nueva, o haberse escrito a
 * mano en la base: lo que llega al prompt de todos los escritos de la firma se
 * comprueba en el último paso, no se da por comprobado.
 */

export const PRECEDENCIA_DEL_ESTILO =
  'ESTILO ENSEÑADO POR LA FIRMA — gobierna solo la REDACCIÓN: fórmulas de encabezado, cortesía y cierre, tratamiento, vocabulario preferido y el orden de las secciones que no sean [OBLIGATORIA]. No aporta hechos, normas, plazos, pretensiones ni jurisprudencia. Si choca con la estructura obligatoria, la regla de citación o el formato de la firma, ganan esos. Los marcadores entre corchetes se llenan con los datos del caso o se dejan entre corchetes.';

/** Tope del bloque. Un prompt que crece con cada lección desplazaría lo que sí es obligatorio. */
export const MAX_CARACTERES_DEL_BLOQUE = 4500;

const ROL: Record<RolDelEstilo, string> = { LITIGANTE: 'litigante', DESPACHO: 'despacho', SECRETARIA: 'secretaría' };
const NUMERACION: Record<Numeracion, string> = {
  ROMANOS: 'números romanos (I., II., III.)',
  ARABIGOS: 'números arábigos (1., 2., 3.)',
  ORDINALES: 'ordinales en letra (PRIMERO., SEGUNDO.)',
  NINGUNA: 'sin numeración'
};
const PERSONA = {
  PRIMERA_SINGULAR: 'primera persona del singular',
  PRIMERA_PLURAL: 'primera persona del plural',
  TERCERA: 'tercera persona («el suscrito»)'
} as const;

/** Una cadena del perfil sobrevive solo si no identifica el caso ni afirma derecho. */
const limpia = (s: string | null | undefined): string | null => {
  if (!s) return null;
  if (sanearTexto(s) !== s) return null;
  return motivoJuridico(s) === null ? s : null;
};

export const renderBloqueDelEstilo = (
  perfil: EstiloConsolidado,
  alcance: { rol: RolDelEstilo; rama: string | null }
): string | null => {
  if (perfil.lecciones === 0) return null;

  const cabeza = [
    PRECEDENCIA_DEL_ESTILO,
    `Tomado de ${perfil.lecciones} ${perfil.lecciones === 1 ? 'escrito' : 'escritos'} de ${ROL[alcance.rol]}${
      alcance.rama ? ` en la rama ${alcance.rama}` : ' (estilo general del rol)'
    }.`
  ].join('\n');

  const secciones: string[] = [];

  const titulos = perfil.titulosDeSeccion.filter((t) => limpia(t.titulo));
  if (titulos.length > 0) {
    secciones.push(`Títulos de sección: ${titulos.map((t) => `${t.titulo} (${NUMERACION[t.numeracion]})`).join('; ')}.`);
  }
  if (perfil.numeracionHechos) {
    secciones.push(`Numeración de los hechos: ${NUMERACION[perfil.numeracionHechos]}.`);
  }
  const orden = perfil.ordenDeSecciones.filter((s) => limpia(s));
  if (orden.length > 0) {
    secciones.push(`Orden de las secciones que no sean [OBLIGATORIA]: ${orden.join(' → ')}.`);
  }
  const encabezado = limpia(perfil.encabezado?.texto);
  if (encabezado) secciones.push(`Encabezado: «${encabezado}».`);

  const formulas = (titulo: string, xs: EstiloConsolidado['formulasDeApertura']): void => {
    const buenas = xs.filter((f) => limpia(f.texto));
    if (buenas.length === 0) return;
    secciones.push(
      `${titulo} (de la más usada a la menos):\n${buenas
        .map((f) => `- «${f.texto}» (visto en ${f.vistoEn} ${f.vistoEn === 1 ? 'escrito' : 'escritos'})`)
        .join('\n')}`
    );
  };
  formulas('Fórmulas de apertura', perfil.formulasDeApertura);
  formulas('Fórmulas de cierre', perfil.formulasDeCierre);

  const firma = perfil.bloqueDeFirma.filter((l) => limpia(l));
  if (firma.length > 0) secciones.push(`Bloque de firma (renglón por renglón):\n${firma.map((l) => `  ${l}`).join('\n')}`);

  const tratamiento = perfil.tratamiento && limpia(perfil.tratamiento.formula);
  if (perfil.tratamiento && tratamiento) {
    secciones.push(
      `Tratamiento al despacho: «${tratamiento}»${perfil.tratamiento.persona ? `, en ${PERSONA[perfil.tratamiento.persona]}` : ''}.`
    );
  }

  const glosario = perfil.glosario
    .filter((g) => limpia(g.preferido))
    .map((g) => {
      const variantes = g.variantes.filter((v) => limpia(v));
      const ejemplo = limpia(g.ejemplo);
      return `- «${g.preferido}»${variantes.length ? ` en lugar de ${variantes.map((v) => `«${v}»`).join(', ')}` : ''}${
        ejemplo ? `; ejemplo: «${ejemplo}»` : ''
      } (visto en ${g.vistoEn} ${g.vistoEn === 1 ? 'escrito' : 'escritos'})`;
    });

  /*
   * EL TOPE SE APLICA POR RENGLÓN COMPLETO, en orden de importancia: nunca se
   * corta una fórmula por la mitad, porque una fórmula a medias es una fórmula
   * que la firma no escribió.
   */
  let bloque = cabeza;
  let quedoAlgo = false;
  for (const s of secciones) {
    if (bloque.length + 1 + s.length > MAX_CARACTERES_DEL_BLOQUE) continue;
    bloque += `\n${s}`;
    quedoAlgo = true;
  }
  if (glosario.length > 0) {
    const titulo = '\nVocabulario preferido:';
    if (bloque.length + titulo.length < MAX_CARACTERES_DEL_BLOQUE) {
      let parte = titulo;
      let entradas = 0;
      for (const g of glosario) {
        if (bloque.length + parte.length + 1 + g.length > MAX_CARACTERES_DEL_BLOQUE) break;
        parte += `\n${g}`;
        entradas += 1;
      }
      if (entradas > 0) {
        bloque += parte;
        quedoAlgo = true;
      }
    }
  }

  return quedoAlgo ? bloque : null;
};
