import type { Carpeta, DocumentoIndexado } from './expedientes.api';
import type { ResumenDelCaso, TerminoDelExpediente } from '../types';

/**
 * LO QUE LA PANTALLA DE EXPEDIENTES DICE CON PALABRAS, EN UN SOLO SITIO.
 *
 * Funciones puras, sin red ni React, por dos razones. La primera: estas frases
 * se repiten en la lista, en el detalle y en el teléfono, y una redacción
 * copiada tres veces se corrige en una y se queda vieja en las otras. La
 * segunda: son las que pueden mentir —«vacía» cuando no se contó, «0» cuando no
 * se leyó—, y lo que puede mentir se prueba (`check:expedientes-cara`).
 */

/* ─── EL PLAZO ────────────────────────────────────────────────────────────── */

/**
 * «hoy · mañana · en N días · vencido hace N días».
 *
 * Los días los cuenta el SERVIDOR contra el hoy de Bogotá; aquí solo se dicen.
 * Recalcularlos con el reloj del equipo daría otra cifra a un abogado de viaje.
 */
export const plazoEnPalabras = (dias: number): string => {
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'mañana';
  if (dias > 1) return `en ${dias} días`;
  const hace = Math.abs(dias);
  return `vencido hace ${hace} ${hace === 1 ? 'día' : 'días'}`;
};

/**
 * Tres días o menos, o vencido: ámbar con peso. No rojo —el rojo es de lo que
 * borra— y no para todo término: si todo es urgente, nada lo es.
 */
export const esUrgente = (t: Pick<TerminoDelExpediente, 'diasRestantes' | 'vencido'>): boolean =>
  t.vencido || t.diasRestantes <= 3;

export interface AvisoDelTermino {
  titulo: string;
  /** El próximo término cuando el aviso habla de uno vencido. */
  detalle: string | null;
  /** Falso si alguno de los dos términos mostrados no está verificado en la agenda. */
  verificado: boolean;
  vencido: boolean;
}

const tituloDelProximo = (t: TerminoDelExpediente): string => {
  if (t.diasRestantes === 0) return `Vence hoy: ${t.que}`;
  if (t.diasRestantes === 1) return `Vence mañana: ${t.que}`;
  return `Quedan ${t.diasRestantes} días para ${t.que}`;
};

/**
 * EL AVISO DE LA CABECERA DEL CASO.
 *
 * Lo vencido manda: un término que ya pasó es lo primero que el abogado tiene
 * que saber, y esconderlo detrás del próximo lo haría leer primero la noticia
 * cómoda. El próximo no se pierde: va en la segunda línea.
 *
 * Un servidor anterior al campo no trae ninguno de los dos (`undefined`) y NO
 * se inventa aviso; tampoco se dice «nada vence», porque no se sabe.
 */
export const avisoDelTermino = (
  caso: Partial<Pick<ResumenDelCaso, 'proximoTermino' | 'terminoVencido'>>
): AvisoDelTermino | null => {
  const vencido = caso.terminoVencido ?? null;
  const proximo = caso.proximoTermino ?? null;
  if (vencido) {
    const hace = Math.abs(vencido.diasRestantes);
    return {
      titulo: `Venció hace ${hace} ${hace === 1 ? 'día' : 'días'}: ${vencido.que}`,
      detalle: proximo ? `Después: ${plazoEnPalabras(proximo.diasRestantes)} · ${proximo.que}` : null,
      verificado: vencido.verificado && (proximo?.verificado ?? true),
      vencido: true
    };
  }
  if (proximo) {
    return { titulo: tituloDelProximo(proximo), detalle: null, verificado: proximo.verificado, vencido: false };
  }
  return null;
};

/* ─── «NO SÉ» NO ES «CERO» ────────────────────────────────────────────────── */

/** `null`/`undefined` = no se pudo contar, y entonces NO se pinta nada. */
export const documentosEnPalabras = (n: number | null | undefined): string | null => {
  if (n === null || n === undefined) return null;
  return `${n.toLocaleString('es-CO')} ${n === 1 ? 'documento' : 'documentos'}`;
};

/** El número de una pestaña. Sin agenda leída no hay número que dar. */
export const cuentaDePestana = (ids: readonly string[] | null): string | null =>
  ids === null ? null : String(ids.length);

/**
 * La línea bajo «Expedientes». «Esta semana» incluye lo vencido (así la arma el
 * servidor en `clasificarEnPestanas`), y la frase lo dice para no prometer que
 * lo de la pestaña todavía está a tiempo.
 */
export const lineaDeEstaSemana = (estaSemana: readonly string[] | null, avisoTerminos: string | null): string => {
  if (estaSemana === null) return avisoTerminos ?? 'No se pudo leer la agenda de términos.';
  if (estaSemana.length === 0) return 'Nada vence esta semana.';
  if (estaSemana.length === 1) return '1 caso vence esta semana o ya venció.';
  return `${estaSemana.length} casos vencen esta semana o ya vencieron.`;
};

/* ─── BORRAR UNA CARPETA ──────────────────────────────────────────────────── */

export type ContenidoParaBorrar =
  | { estado: 'contado'; subcarpetas: number; documentos: number }
  | { estado: 'sin-contar' };

/**
 * QUÉ DICE EL DIÁLOGO DE BORRAR, según lo que se sepa del contenido.
 *
 * Nació de un defecto: la cuenta empezaba en ceros y, si la consulta fallaba,
 * se quedaba en ceros y el diálogo decía «vacía». Por eso «no se pudo contar»
 * es un estado propio y no un contado-en-cero, y en ese estado se exige
 * escribir el nombre: el borrado va en cascada —documentos indexados y sus
 * archivos— y quien no sabe cuánto hay dentro tiene que decidir despacio.
 *
 * Una carpeta llena también exige el nombre. Una vacía, contada, no: pedir que
 * se teclee para borrar nada enseña a teclear sin leer.
 */
export const textoDelBorrado = (
  c: ContenidoParaBorrar
): { partes: string[]; vacia: boolean; exigeNombre: boolean } => {
  if (c.estado === 'sin-contar') return { partes: [], vacia: false, exigeNombre: true };
  const partes = [
    c.subcarpetas > 0 ? `${c.subcarpetas} subcarpeta(s)` : null,
    c.documentos > 0 ? `${c.documentos} documento(s) indexado(s)` : null
  ].filter((p): p is string => p !== null);
  return { partes, vacia: partes.length === 0, exigeNombre: partes.length > 0 };
};

/* ─── EL ÁRBOL ────────────────────────────────────────────────────────────── */

/** Tope de saltos al subir por los padres: un ciclo que ya esté en la base no puede colgar la pantalla. */
const MAX_SALTOS = 50;

/** «Pruebas › Documentales». */
export const rutaDe = (id: string, carpetas: readonly Carpeta[]): string => {
  const nombres: string[] = [];
  let actual: string | null = id;
  for (let i = 0; actual && i < MAX_SALTOS; i += 1) {
    const c = carpetas.find((x) => x.id === actual);
    if (!c) break;
    nombres.unshift(c.nombre);
    actual = c.padreId;
  }
  return nombres.join(' › ');
};

/** ¿`id` cuelga, a cualquier profundidad, de `ancestro`? */
const cuelgaDe = (id: string, ancestro: string, carpetas: readonly Carpeta[]): boolean => {
  let actual = carpetas.find((x) => x.id === id)?.padreId ?? null;
  for (let i = 0; actual && i < MAX_SALTOS; i += 1) {
    if (actual === ancestro) return true;
    actual = carpetas.find((x) => x.id === actual)?.padreId ?? null;
  }
  return false;
};

export type MotivoDeNoDestino = 'es-ella' | 'dentro-de-ella' | 'ya-esta-aqui' | null;

export interface Destino {
  /** `null` = la raíz del expediente. */
  id: string | null;
  ruta: string;
  /** Por qué no se puede escoger; `null` si se puede. */
  motivo: MotivoDeNoDestino;
}

const ordenados = (carpetas: readonly Carpeta[]): { id: string; ruta: string }[] =>
  carpetas
    .map((c) => ({ id: c.id, ruta: rutaDe(c.id, carpetas) }))
    .sort((a, b) => a.ruta.localeCompare(b.ruta, 'es'));

/**
 * A DÓNDE SE PUEDE MOVER UNA CARPETA.
 *
 * El servidor ya lo impide (`CARPETA_EN_SI_MISMA`, `CARPETA_EN_SU_HIJA`), y esa
 * guarda se queda. Esto es la otra mitad: no OFRECER lo que se va a rechazar.
 * Un destino que se puede pulsar y después falla enseña que la lista miente.
 * Los imposibles se muestran deshabilitados y con su razón, no se esconden: el
 * abogado que busca «Anexos» tiene que ver por qué no está disponible.
 */
export const destinosDeCarpeta = (carpetas: readonly Carpeta[], carpetaId: string): Destino[] => {
  const ella = carpetas.find((c) => c.id === carpetaId);
  const raiz: Destino = { id: null, ruta: 'Raíz del expediente', motivo: ella?.padreId === null ? 'ya-esta-aqui' : null };
  return [
    raiz,
    ...ordenados(carpetas).map(({ id, ruta }) => ({
      id,
      ruta,
      motivo:
        id === carpetaId
          ? ('es-ella' as const)
          : cuelgaDe(id, carpetaId, carpetas)
            ? ('dentro-de-ella' as const)
            : id === ella?.padreId
              ? ('ya-esta-aqui' as const)
              : null
    }))
  ];
};

/** A dónde se puede mover un documento: a cualquier carpeta menos a la que ya lo tiene. */
export const destinosDeDocumento = (carpetas: readonly Carpeta[], carpetaActual: string | null): Destino[] => [
  { id: null, ruta: 'Raíz del expediente', motivo: carpetaActual === null ? 'ya-esta-aqui' : null },
  ...ordenados(carpetas).map(({ id, ruta }) => ({
    id,
    ruta,
    motivo: id === carpetaActual ? ('ya-esta-aqui' as const) : null
  }))
];

export const MOTIVO_EN_PALABRAS: Record<Exclude<MotivoDeNoDestino, null>, string> = {
  'es-ella': 'es esta carpeta',
  'dentro-de-ella': 'está dentro de ella',
  'ya-esta-aqui': 'ya está aquí'
};

/**
 * Lo que hay DIRECTAMENTE en una carpeta, contado con las listas que la
 * pantalla ya cargó. Sin pedirle nada al servidor: la tarjeta se pinta con lo
 * que hay en memoria, y la cuenta en cascada —la que importa para borrar— la
 * sigue pidiendo el diálogo, que es quien la necesita exacta.
 */
export const resumenDeCarpeta = (
  id: string,
  carpetas: readonly Carpeta[],
  documentos: readonly DocumentoIndexado[]
): { documentos: number; subcarpetas: number } => ({
  documentos: documentos.filter((d) => (d.carpetaId ?? null) === id).length,
  subcarpetas: carpetas.filter((c) => c.padreId === id).length
});

export const enPalabrasElResumen = (r: { documentos: number; subcarpetas: number }): string => {
  const partes = [
    r.documentos > 0 ? `${r.documentos} ${r.documentos === 1 ? 'documento' : 'documentos'}` : null,
    r.subcarpetas > 0 ? `${r.subcarpetas} ${r.subcarpetas === 1 ? 'subcarpeta' : 'subcarpetas'}` : null
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(' · ') : 'Vacía';
};

/**
 * El árbol aplanado en orden de lectura, con su nivel de sangría. Recorre desde
 * la raíz, así que un ramal colgado de un ciclo no aparece —igual que no
 * aparecería en ningún otro recorrido— y la visita lleva su propio registro para
 * no dar vueltas.
 */
export const arbolPlano = (carpetas: readonly Carpeta[]): { carpeta: Carpeta; nivel: number }[] => {
  const salida: { carpeta: Carpeta; nivel: number }[] = [];
  const vistas = new Set<string>();
  const bajar = (padreId: string | null, nivel: number): void => {
    carpetas
      .filter((c) => c.padreId === padreId && !vistas.has(c.id))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .forEach((c) => {
        vistas.add(c.id);
        salida.push({ carpeta: c, nivel });
        if (nivel < MAX_SALTOS) bajar(c.id, nivel + 1);
      });
  };
  bajar(null, 0);
  return salida;
};

/* ─── LA BÚSQUEDA ─────────────────────────────────────────────────────────── */

/**
 * LA SIMILITUD CON PALABRAS, NO CON PORCENTAJE.
 *
 * Un «64 %» se lee como probabilidad de que el pasaje sea el correcto, y no es
 * eso: es la cercanía entre dos vectores, cuyos valores útiles viven apretados
 * entre 0,5 y 0,8. Tres grados en palabras dicen lo único que sirve —cuál leer
 * primero— sin fingir una precisión que el número no tiene.
 */
export const relevanciaEnPalabras = (similitud: number): string => {
  if (similitud >= 0.75) return 'Muy relacionado';
  if (similitud >= 0.6) return 'Relacionado';
  return 'Algo relacionado';
};
