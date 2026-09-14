import type { ContenidoDeLeccion } from './types';
import { PALABRAS_EN_MAYUSCULA_PERMITIDAS, plegar } from './vocabulario';

/**
 * Borra de un escrito todo lo que identifica el caso, ANTES de que lo lea
 * ningún modelo.
 *
 * ─── POR QUÉ ANTES Y NO DESPUÉS ────────────────────────────────────────────
 *
 * Lo que se le manda a un proveedor ya salió de la plataforma. Pedirle al
 * modelo que «ignore los datos del caso» no los devuelve: la cédula del
 * cliente ya viajó. Así que el texto se limpia aquí, con reglas que se pueden
 * leer y probar, y el modelo solo recibe marcadores.
 *
 * ─── Y OTRA VEZ SOBRE LO QUE SE GUARDA ─────────────────────────────────────
 *
 * El navegador manda de vuelta el contenido que el socio marcó para guardar.
 * Ese contenido no se cree: el servidor lo sanea de nuevo, porque quien arme la
 * petición a mano puede meter lo que quiera en una «fórmula de cierre».
 *
 * ─── EL ORDEN IMPORTA ──────────────────────────────────────────────────────
 *
 * Primero lo más específico: los datos exactos del caso, los correos, los
 * valores con signo, las direcciones y las fechas; luego los radicados (23
 * dígitos) antes que los NIT y las cédulas, porque un radicado con guiones
 * contiene trozos que parecen cédulas; al final los nombres por su contexto.
 * Cada paso deja marcadores sin dígitos, así que el siguiente no los vuelve a
 * tocar.
 */

/** Datos del caso que el escrito lleva y que se borran por coincidencia exacta. */
export interface DatosDelCaso {
  partes?: string[];
  despachos?: string[];
  radicados?: string[];
}

const MESES = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';

/*
 * Reemplazo por coincidencia exacta sin tildes ni mayúsculas. Se pliega letra
 * por letra para que cada posición del texto plegado corresponda a la misma
 * del original: así el reemplazo cae exactamente sobre lo que el escrito dice,
 * con sus tildes, y no sobre una versión normalizada.
 */
const plegarLetraPorLetra = (texto: string): string =>
  Array.from(texto)
    .map((c) => {
      const p = plegar(c);
      return p.length === 1 ? p : c.toLowerCase();
    })
    .join('');

const reemplazarExacto = (texto: string, aguja: string, marcador: string): string => {
  const limpia = aguja.trim().replace(/\s+/g, ' ');
  if (limpia.length < 4) return texto;
  const buscada = plegarLetraPorLetra(limpia);
  let resultado = texto;
  let plegado = plegarLetraPorLetra(resultado.replace(/\s/g, ' '));
  let desde = plegado.indexOf(buscada);
  while (desde !== -1) {
    resultado = resultado.slice(0, desde) + marcador + resultado.slice(desde + buscada.length);
    plegado = plegarLetraPorLetra(resultado.replace(/\s/g, ' '));
    desde = plegado.indexOf(buscada, desde + marcador.length);
  }
  return resultado;
};

const contarDigitos = (s: string): number => (s.match(/\d/g) ?? []).length;

/* Un nombre: palabras que empiezan en mayúscula, con «de», «del», «la», «y» en medio. */
const PALABRA = "[A-ZÁÉÍÓÚÑÜ][A-Za-zÁÉÍÓÚÑÜáéíóúñü.&'-]*";
/*
 * SIN CRUZAR EL SALTO DE LÍNEA: con `\s` el nombre seguía al renglón de abajo, y
 * «Señor Juez Laboral del Circuito de Sincelejo» + «Referencia:» se leía como una
 * sola persona. El encabezado del escrito —lo primero que la lección quiere—
 * desaparecía entero.
 */
const NOMBRE = `${PALABRA}(?:[ \\t]+(?:(?:de|del|la|las|los|y|e)[ \\t]+)?${PALABRA}){0,6}`;

/**
 * ¿Nombra a alguien, o son palabras de tratamiento («Juez Civil del Circuito»)?
 *
 * Si la primera palabra es de tratamiento o de cargo, hace falta que DOS no lo
 * sean para leerla como nombre: «Juez Laboral del Circuito de Sincelejo» trae
 * una ciudad, no una persona; «Juez Pedro Gómez» trae dos palabras ajenas y sí
 * es alguien. Si la primera ya es ajena («María», «Constructora»), basta.
 */
const esNombrePropio = (candidato: string): boolean => {
  const palabras = candidato.split(/[\s.,]+/).filter((p) => p.length > 0 && /^[A-ZÁÉÍÓÚÑÜ]/.test(p));
  if (palabras.length === 0) return false;
  const ajenas = palabras.filter((p) => !PALABRAS_EN_MAYUSCULA_PERMITIDAS.has(plegar(p))).length;
  return PALABRAS_EN_MAYUSCULA_PERMITIDAS.has(plegar(palabras[0])) ? ajenas >= 2 : ajenas >= 1;
};

const DISPARADORES_DESPUES =
  '(?:[Ss]eñora?|SEÑORA?|[Ss]ra?\\.|[Ee]n[ \\t]+contra[ \\t]+de|EN[ \\t]+CONTRA[ \\t]+DE|\\b[Cc]ontra|\\bCONTRA|[Aa]poderad[oa](?:[ \\t]+judicial)?[ \\t]+de)';

export const sanearTexto = (texto: string, datos?: DatosDelCaso): string => {
  let t = texto;

  // 1. Los datos exactos del caso, cuando el escrito los trae.
  for (const r of datos?.radicados ?? []) t = reemplazarExacto(t, r, '[RADICADO]');
  for (const d of datos?.despachos ?? []) t = reemplazarExacto(t, d, '[DESPACHO]');
  for (const p of datos?.partes ?? []) t = reemplazarExacto(t, p, '[PARTE]');

  // 2. Correos.
  t = t.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[CORREO]');

  // 3. Valores: con signo, con «pesos» o «COP».
  t = t.replace(/\$\s?\d{1,3}(?:[.,]\d{3})+(?:,\d{1,2})?|\$\s?\d+(?:,\d{1,2})?/g, '[VALOR]');
  t = t.replace(/\b\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?\s*(?:pesos|COP)\b/gi, '[VALOR]');
  t = t.replace(/\bCOP\s?\d[\d.,]*/g, '[VALOR]');

  /*
   * 3b. Radicados: 20 a 25 dígitos, corridos o con separadores. VAN ANTES DE LAS
   * FECHAS: «11001-31-03-001-2020-00123-00» contiene «31-03-001», que la regla
   * de fechas con guiones leería como un día, y el radicado quedaba partido.
   */
  t = t.replace(/\b\d(?:\d|[-.\s](?=\d)){18,40}\b/g, (m) => {
    const n = contarDigitos(m);
    return n >= 20 && n <= 25 ? '[RADICADO]' : m;
  });

  // 4. Direcciones urbanas: «Calle 45 # 12-30, apto 301», «Cra. 7 No. 32-16».
  t = t.replace(
    /\b(?:calle|cl\.?|carrera|cra\.?|kra\.?|kr\.?|avenida|av\.?|diagonal|dg\.?|transversal|tv\.?|autopista|circular)\s*\d+\s*[a-z]?(?:\s*bis)?\s*(?:#|no\.?|n°|nº|número)\s*\d+\s*[a-z]?\s*-\s*\d+(?:\s*,?\s*(?:apto\.?|apartamento|oficina|of\.?|local|interior|int\.?|piso|casa|torre|bloque)\s*[\w-]+)*/gi,
    '[DIRECCIÓN]'
  );

  // 5. Fechas: «15 de marzo de 2024», «quince (15) de marzo de dos mil veinticuatro (2024)», «15/03/2024».
  t = t.replace(
    new RegExp(`(?:\\b[a-záéíóúñ]+\\s+)?\\(\\d{1,2}\\)\\s+de\\s+(?:${MESES})\\s+(?:de|del)\\s+(?:[a-záéíóúñ ]+)?\\(?\\d{4}\\)?`, 'gi'),
    '[FECHA]'
  );
  t = t.replace(new RegExp(`\\b\\d{1,2}\\s+de\\s+(?:${MESES})\\s+(?:de|del)\\s+\\d{4}\\b`, 'gi'), '[FECHA]');
  t = t.replace(new RegExp(`\\b(?:${MESES})\\s+(?:de|del)\\s+\\d{4}\\b`, 'gi'), '[FECHA]');
  t = t.replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/g, '[FECHA]');

  // 7. NIT con dígito de verificación.
  t = t.replace(/\b\d{3}\.?\d{3}\.?\d{3}\s?-\s?\d\b/g, '[IDENTIFICACIÓN]');

  // 8. Teléfonos: celulares y fijos con indicativo 60X.
  t = t.replace(/(?<![\d.])(?:\+57\s?)?3\d{2}\s?\d{3}\s?\d{4}(?!\d)/g, '[TELÉFONO]');
  t = t.replace(/\(\s?60\d\s?\)\s?\d{3}\s?\d{4}|(?<![\d.])60\d\s?\d{3}\s?\d{4}(?!\d)/g, '[TELÉFONO]');

  // 9. Cédulas y cualquier número con puntos o corrido de 6 dígitos o más (tarjetas profesionales incluidas).
  /*
   * `(?!\d|,\d)` y no `(?![\d,])`: excluir cualquier coma hacía que
   * «1.102.811.692,» retrocediera hasta «1.102.811» y dejara «.692» a la vista.
   * Lo que hay que excluir es la coma DECIMAL, que va seguida de dígito.
   */
  t = t.replace(/(?<![\d])\d{1,3}(?:\.\d{3})+(?!\d|,\d)/g, (m) => (contarDigitos(m) >= 6 ? '[IDENTIFICACIÓN]' : m));
  t = t.replace(/\b\d{6,}\b/g, '[IDENTIFICACIÓN]');

  // 10. Nombres por su contexto: después de «señor(a)», «en contra de», «apoderado de»…
  t = t.replace(new RegExp(`(${DISPARADORES_DESPUES}[ \\t]+)(${NOMBRE}(?:[ \\t]+S\\.?A\\.?S\\.?|[ \\t]+S\\.?A\\.?|[ \\t]+Ltda\\.?)?)`, 'g'), (m, disparador: string, nombre: string) =>
    esNombrePropio(nombre) ? `${disparador}[PARTE]` : m
  );
  // …y antes de «identificado(a) con».
  t = t.replace(new RegExp(`(${NOMBRE})(,?\\s+)(?=identificad[oa]s?\\s+con)`, 'g'), (m, nombre: string, separador: string) =>
    esNombrePropio(nombre) ? `[PARTE]${separador}` : m
  );

  return t;
};

/**
 * El mismo saneamiento sobre cada cadena de una lección. No descarta nada: solo
 * reemplaza. Lo que después de sanear siga siendo jurídico lo descarta la guarda.
 */
export const sanearContenido = (c: ContenidoDeLeccion, datos?: DatosDelCaso): ContenidoDeLeccion => {
  const s = (x: string): string => sanearTexto(x, datos);
  return {
    titulosDeSeccion: c.titulosDeSeccion.map((t) => ({ ...t, titulo: s(t.titulo) })),
    numeracionHechos: c.numeracionHechos,
    ordenDeSecciones: c.ordenDeSecciones.map(s),
    encabezado: s(c.encabezado),
    formulasDeApertura: c.formulasDeApertura.map(s),
    formulasDeCierre: c.formulasDeCierre.map(s),
    bloqueDeFirma: c.bloqueDeFirma.map(s),
    tratamiento: c.tratamiento ? { ...c.tratamiento, formula: s(c.tratamiento.formula) } : null,
    glosario: c.glosario.map((g) => ({ preferido: s(g.preferido), variantes: g.variantes.map(s), ejemplo: s(g.ejemplo) }))
  };
};
