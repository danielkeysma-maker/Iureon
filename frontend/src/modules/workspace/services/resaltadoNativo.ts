import { localizarCitas } from './marcas';

/**
 * Pintar las marcas del abogado SOBRE un documento que no es texto plano.
 *
 * ─── POR QUÉ NO SE PUEDE ENVOLVER EN `<span>` ───────────────────────────────
 *
 * En el papel del taller el texto es una cadena y las marcas se pintan
 * partiéndola en tramos. Sobre el original no: la capa de texto de un PDF son
 * cientos de `<span>` colocados en coordenadas absolutas —moverlos o partirlos
 * descoloca el documento— y el HTML de un Word trae tablas, listas y notas al
 * pie cuyo marcado no se puede cortar por la mitad sin romperlo. Envolver a
 * mano rompería lo único que este visor existe para conservar: la forma.
 *
 * ─── LA API DE RESALTADO DEL NAVEGADOR ──────────────────────────────────────
 *
 * `CSS.highlights` pinta rangos SIN tocar el DOM: se registran `Range` y el
 * navegador los dibuja con las reglas `::highlight(nombre)`. El documento
 * queda intacto, la selección nativa sigue funcionando encima y quitar una
 * marca es borrar una entrada de un mapa.
 *
 * NO ESTÁ EN TODOS LOS NAVEGADORES, y eso se declara en vez de fingirse:
 * `hayResaltadoNativo()` responde que no y la pantalla dice cuántas marcas hay
 * y ofrece el salto al papel, que es donde sí se ven. Un visor que se traga
 * las marcas en silencio le haría creer al abogado que no marcó nada.
 *
 * ─── LA BÚSQUEDA ES LA MISMA DEL PAPEL ──────────────────────────────────────
 *
 * `localizarCitas` es la que ya decide qué pasaje corresponde a una cita, con
 * su tolerancia a comillas, guiones y espacios. Aquí se reutiliza tal cual —no
 * se copia— sobre el texto aplanado del contenedor: dos localizadores que se
 * separaran darían marcas en sitios distintos según la pestaña, que es peor
 * que no tenerlas.
 */

/** Un carácter del texto aplanado y de dónde salió. `nodo` null = separador que añadimos nosotros. */
interface Origen {
  nodo: Text | null;
  desplazamiento: number;
}

export interface TextoAplanado {
  texto: string;
  origenes: Origen[];
}

/** Elementos que separan párrafos: sin esto, el final de una línea se pega al principio de la siguiente. */
const CORTA_LINEA = new Set(['BR', 'P', 'DIV', 'LI', 'TR', 'TD', 'TH', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TABLE', 'SECTION', 'BLOCKQUOTE']);

/**
 * El texto del contenedor como una sola cadena, con la posición de cada
 * carácter en su nodo. El salto que se inserta entre bloques ocupa un carácter
 * sin nodo: `localizarCitas` colapsa espacios, así que no desplaza nada.
 */
export const aplanarTexto = (contenedor: HTMLElement): TextoAplanado => {
  let texto = '';
  const origenes: Origen[] = [];
  const recorrido = document.createTreeWalker(contenedor, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let nodo = recorrido.nextNode();
  while (nodo) {
    if (nodo.nodeType === Node.TEXT_NODE) {
      const t = nodo as Text;
      const contenido = t.data;
      for (let i = 0; i < contenido.length; i++) {
        texto += contenido[i];
        origenes.push({ nodo: t, desplazamiento: i });
      }
    } else if (CORTA_LINEA.has((nodo as Element).tagName)) {
      // Un solo salto: dos seguidos no cambian nada porque los espacios se colapsan.
      if (texto.length && texto[texto.length - 1] !== '\n') {
        texto += '\n';
        origenes.push({ nodo: null, desplazamiento: 0 });
      }
    }
    nodo = recorrido.nextNode();
  }
  return { texto, origenes };
};

/** El navegador sabe pintar rangos sin tocar el DOM. */
export const hayResaltadoNativo = (): boolean =>
  typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight === 'function';

/**
 * Convierte un tramo del texto aplanado en un `Range`. Devuelve null cuando el
 * tramo cae entero sobre separadores inventados (no hay nodo que señalar).
 */
export const rangoDelTramo = (plano: TextoAplanado, inicio: number, fin: number): Range | null => {
  let i = inicio;
  while (i < fin && !plano.origenes[i]?.nodo) i += 1;
  let j = fin - 1;
  while (j >= i && !plano.origenes[j]?.nodo) j -= 1;
  const desde = plano.origenes[i];
  const hasta = plano.origenes[j];
  if (!desde?.nodo || !hasta?.nodo) return null;
  const rango = document.createRange();
  rango.setStart(desde.nodo, desde.desplazamiento);
  rango.setEnd(hasta.nodo, hasta.desplazamiento + 1);
  return rango;
};

/** Una capa de resaltado: el nombre con que se registra y las citas que la componen. */
export interface CapaDeResaltado {
  nombre: string;
  citas: string[];
}

export interface ResultadoDelPintado {
  /** Cuántas citas se pudieron pintar, por capa. */
  pintadas: Record<string, number>;
  /** Cuántas no aparecen en el original. Se dice: el texto extraído y el archivo no siempre coinciden. */
  noLocalizadas: number;
}

/**
 * Registra las capas sobre el contenedor. Devuelve qué se pudo pintar para que
 * la pantalla lo diga en vez de dejar creer que todo quedó marcado.
 *
 * `prefijo` aísla las capas de este visor de cualquier otro resaltado de la
 * aplicación: `CSS.highlights` es un registro global de la página.
 */
export const pintarCapas = (contenedor: HTMLElement, capas: CapaDeResaltado[], prefijo: string): ResultadoDelPintado => {
  const pintadas: Record<string, number> = {};
  let noLocalizadas = 0;
  if (!hayResaltadoNativo()) {
    for (const capa of capas) pintadas[capa.nombre] = 0;
    return { pintadas, noLocalizadas: capas.reduce((n, c) => n + c.citas.length, 0) };
  }

  const plano = aplanarTexto(contenedor);
  for (const capa of capas) {
    const clave = `${prefijo}-${capa.nombre}`;
    CSS.highlights.delete(clave);
    if (!capa.citas.length) {
      pintadas[capa.nombre] = 0;
      continue;
    }
    const { marcas, noLocalizadas: perdidas } = localizarCitas(plano.texto, capa.citas);
    noLocalizadas += perdidas.length;
    const rangos: Range[] = [];
    for (const m of marcas) {
      const r = rangoDelTramo(plano, m.inicio, m.fin);
      if (r) rangos.push(r);
      else noLocalizadas += 1;
    }
    pintadas[capa.nombre] = rangos.length;
    if (rangos.length) CSS.highlights.set(clave, new Highlight(...rangos));
  }
  return { pintadas, noLocalizadas };
};

/** Retira las capas de este visor del registro global. Se llama al desmontar. */
export const borrarCapas = (nombres: string[], prefijo: string): void => {
  if (!hayResaltadoNativo()) return;
  for (const nombre of nombres) CSS.highlights.delete(`${prefijo}-${nombre}`);
};
