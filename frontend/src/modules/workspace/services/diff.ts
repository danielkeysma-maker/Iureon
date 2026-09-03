/**
 * Diferencia entre dos versiones de un escrito, palabra por palabra.
 *
 * Para «¿qué cambió entre la versión de ayer y esta?» no sirve un diff de
 * líneas: un escrito jurídico es prosa larga y un cambio de tres palabras
 * marcaría el párrafo entero. Aquí se comparan palabras (con su espacio),
 * con la subsecuencia común más larga, y se devuelven tramos iguales,
 * quitados y añadidos, en orden. Puro; sin DOM.
 *
 * Es cuadrático en el número de palabras: para escritos de hasta unas 15.000
 * palabras responde al instante; por encima se compara por párrafos para no
 * colgar la pestaña, y se dice.
 */

export interface TramoDeDiff {
  tipo: 'igual' | 'quitado' | 'anadido';
  texto: string;
}

const MAX_PALABRAS_FINAS = 15_000;

const partir = (texto: string): string[] => texto.match(/\S+\s*|\s+/g) ?? [];

const lcs = (a: string[], b: string[]): TramoDeDiff[] => {
  const n = a.length;
  const m = b.length;
  // Tabla de longitudes, en una fila por vez hacia atrás para poder reconstruir.
  const tabla: Uint32Array[] = new Array(n + 1);
  for (let i = 0; i <= n; i++) tabla[i] = new Uint32Array(m + 1);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      tabla[i][j] = a[i] === b[j] ? tabla[i + 1][j + 1] + 1 : Math.max(tabla[i + 1][j], tabla[i][j + 1]);
    }
  }
  const salida: TramoDeDiff[] = [];
  const empujar = (tipo: TramoDeDiff['tipo'], texto: string) => {
    const ultimo = salida[salida.length - 1];
    if (ultimo && ultimo.tipo === tipo) ultimo.texto += texto;
    else salida.push({ tipo, texto });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      empujar('igual', a[i]);
      i++;
      j++;
    } else if (tabla[i + 1][j] >= tabla[i][j + 1]) {
      empujar('quitado', a[i]);
      i++;
    } else {
      empujar('anadido', b[j]);
      j++;
    }
  }
  while (i < n) empujar('quitado', a[i++]);
  while (j < m) empujar('anadido', b[j++]);
  return salida;
};

/** Los tramos que distinguen `antes` de `despues`, más si la comparación fue fina (palabras) o gruesa (párrafos). */
export const diferencias = (antes: string, despues: string): { tramos: TramoDeDiff[]; fino: boolean } => {
  if (antes === despues) return { tramos: [{ tipo: 'igual', texto: antes }], fino: true };
  const a = partir(antes);
  const b = partir(despues);
  if (a.length + b.length <= MAX_PALABRAS_FINAS * 2) return { tramos: lcs(a, b), fino: true };
  const pa = antes.split(/(\n{2,})/);
  const pb = despues.split(/(\n{2,})/);
  return { tramos: lcs(pa, pb), fino: false };
};

/** Cuántas palabras entraron y salieron: para el rótulo de la versión. */
export const resumenDeCambios = (tramos: TramoDeDiff[]): { anadidas: number; quitadas: number } => {
  let anadidas = 0;
  let quitadas = 0;
  for (const t of tramos) {
    const n = (t.texto.match(/\S+/g) ?? []).length;
    if (t.tipo === 'anadido') anadidas += n;
    if (t.tipo === 'quitado') quitadas += n;
  }
  return { anadidas, quitadas };
};
