import { BRANCH_LABELS } from '../../catalog/branchLabels';
import { compararEnEspanol } from '../../workspace/services/fichaEnLaLista';
import type { Expediente } from '../types';
import { ramaLimpia } from './buscarCasos';

/**
 * LOS DATOS DEL CASO QUE SE PUEDEN EDITAR, SIN REACT NI RED.
 *
 * El 14 de septiembre de 2026 el dueño preguntó cómo corregir el nombre, el
 * radicado o la rama de un caso cuando se le olvidó ponerla al crearlo. El
 * servidor ya lo aceptaba (`PATCH /api/expedientes/:id`); faltaba la pantalla.
 * Aquí viven las cuatro reglas que pueden hacer daño sin que nada falle, y por
 * eso se prueban en `check:datos-del-caso`:
 *
 *  · SOLO VIAJA LO QUE CAMBIÓ. El servidor lee `null` como «bórrelo»; mandar el
 *    formulario entero pone en riesgo lo que nadie tocó.
 *  · EL NOMBRE ES OBLIGATORIO, con el mismo mensaje del servidor.
 *  · EL AVISO DEL RADICADO ORIENTA Y NO BLOQUEA: hay radicados legítimos que
 *    no son de 23 dígitos.
 *  · UNA RAMA ESCRITA A MANO SIGUE A LA VISTA hasta que el abogado la cambie.
 */

/** Los campos del diálogo, como texto. Vacío es «no hay». */
export interface DatosDelCaso {
  caratula: string;
  radicado: string;
  despacho: string;
  rama: string;
  contraparte: string;
  notas: string;
}

export type CampoDelCaso = keyof DatosDelCaso;

const CAMPOS: readonly CampoDelCaso[] = ['caratula', 'radicado', 'despacho', 'rama', 'contraparte', 'notas'];

/** Lo que el diálogo trae escrito al abrirse: lo guardado, con `null` como vacío. */
export const datosDelCaso = (caso: Pick<Expediente, CampoDelCaso>): DatosDelCaso => ({
  caratula: caso.caratula ?? '',
  radicado: caso.radicado ?? '',
  despacho: caso.despacho ?? '',
  /* Una rama en blanco es la falta de rama, igual que en la lista. */
  rama: ramaLimpia(caso.rama) ?? '',
  contraparte: caso.contraparte ?? '',
  notas: caso.notas ?? ''
});

/*
 * SE COMPARA SIN LOS ESPACIOS DE LOS BORDES porque el servidor guarda así
 * (`texto` recorta y convierte vacío en null). Un espacio al final no es un
 * cambio y no debe viajar ni ensuciar la auditoría.
 */
const limpio = (v: string): string | null => {
  const t = v.trim();
  return t.length > 0 ? t : null;
};

/**
 * Lo que se manda en el PATCH: SOLO los campos que cambiaron. Un campo vaciado
 * a propósito viaja como `null` (bórrelo); uno que no se tocó no viaja.
 *
 * El radicado se manda tal como se escribió, sin normalizar: así lo guarda la
 * creación, y la búsqueda de la lista ya lo encuentra con o sin guiones.
 */
export const cambiosDelCaso = (inicial: DatosDelCaso, actual: DatosDelCaso): Partial<Record<CampoDelCaso, string | null>> => {
  const cambios: Partial<Record<CampoDelCaso, string | null>> = {};
  for (const campo of CAMPOS) {
    const antes = limpio(inicial[campo]);
    const ahora = limpio(actual[campo]);
    if (antes !== ahora) cambios[campo] = ahora;
  }
  return cambios;
};

export const hayCambios = (inicial: DatosDelCaso, actual: DatosDelCaso): boolean =>
  Object.keys(cambiosDelCaso(inicial, actual)).length > 0;

/** El mismo texto con que el servidor rechaza un caso sin nombre (`actualizarExpediente`). */
export const SIN_NOMBRE = 'El expediente no se puede quedar sin nombre.';

/** Lo que impide guardar. Solo el nombre: todo lo demás es opcional. */
export const errorDelCaso = (actual: DatosDelCaso): string | null => (limpio(actual.caratula) === null ? SIN_NOMBRE : null);

export const AVISO_DEL_RADICADO = 'Un radicado de la Rama Judicial tiene 23 dígitos; revise si falta alguno.';

/**
 * El aviso del radicado, o `null`. Cuenta DÍGITOS: guiones y espacios no
 * importan. Nunca es un error — una tutela «T-1234» o un número interno de la
 * firma son radicados que el abogado tiene derecho a guardar.
 */
export const avisoDelRadicado = (radicado: string): string | null => {
  if (limpio(radicado) === null) return null;
  return radicado.replace(/\D/g, '').length === 23 ? null : AVISO_DEL_RADICADO;
};

export type RamaGuardada =
  | { tipo: 'ninguna' }
  | { tipo: 'catalogo'; codigo: string; etiqueta: string }
  | { tipo: 'manual'; texto: string };

/**
 * Qué clase de rama tiene guardada el caso. `Object.hasOwn` y no
 * `BRANCH_LABELS[r]` a secas, por la misma razón que `etiquetaDeRama`: una rama
 * escrita a mano que se llame «constructor» no es un código.
 */
export const leerRama = (rama: string | null | undefined): RamaGuardada => {
  const r = ramaLimpia(rama);
  if (r === null) return { tipo: 'ninguna' };
  return Object.hasOwn(BRANCH_LABELS, r) ? { tipo: 'catalogo', codigo: r, etiqueta: BRANCH_LABELS[r] } : { tipo: 'manual', texto: r };
};

export interface OpcionDeRamaParaEditar {
  valor: string;
  etiqueta: string;
}

/**
 * Las opciones del selector de rama: «Sin rama», la rama escrita a mano si el
 * caso tiene una —con su texto tal cual y el apellido «(registrada a mano)»—, y
 * todas las ramas del catálogo en orden alfabético español.
 *
 * LA RAMA A MANO ES UNA OPCIÓN MÁS Y SU VALOR ES SU PROPIO TEXTO. Así, dejarla
 * elegida no manda ningún cambio, y cambiarla por una del catálogo es elegir
 * otra fila: nadie la pierde por abrir el diálogo.
 */
export const opcionesDeRamaParaEditar = (ramaGuardada: string | null | undefined): OpcionDeRamaParaEditar[] => {
  const guardada = leerRama(ramaGuardada);
  const catalogo = Object.entries(BRANCH_LABELS)
    .map(([valor, etiqueta]) => ({ valor, etiqueta }))
    .sort((a, b) => compararEnEspanol(a.etiqueta, b.etiqueta));
  return [
    { valor: '', etiqueta: 'Sin rama' },
    ...(guardada.tipo === 'manual' ? [{ valor: guardada.texto, etiqueta: `${guardada.texto} (registrada a mano)` }] : []),
    ...catalogo
  ];
};

export interface OpcionDeCliente {
  valor: string;
  etiqueta: string;
  /** El documento tal como se guardó en la ficha: se pinta en mono, porque se copia. */
  documento?: string;
  /** Lo que además del nombre encuentra la fila en el filtro. */
  busqueda?: string;
}

/* 92522595 → 92.522.595: como lo escribe quien copia la cédula de un papel. */
const agruparDeATres = (digitos: string): string => digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/**
 * Las opciones del selector de cliente del caso: «Sin cliente» y cada ficha con
 * su documento.
 *
 * EL FILTRO COMPARTIDO COMPARA TEXTO, así que la búsqueda de cada fila lleva el
 * documento de tres formas —solo dígitos, agrupado con puntos y tal como se
 * guardó—. Así «92.522.595» encuentra una cédula guardada sin puntos, y
 * «1102811692» una guardada con ellos, sin tocar el selector que comparten
 * Redacción y los filtros.
 */
export const opcionesDeCliente = (
  clientes: ReadonlyArray<{ id: string; fullName: string; documentId: string }>
): OpcionDeCliente[] => [
  { valor: '', etiqueta: 'Sin cliente' },
  ...clientes.map((c) => {
    const digitos = c.documentId.replace(/\D/g, '');
    return {
      valor: c.id,
      etiqueta: c.fullName,
      documento: c.documentId,
      busqueda: [digitos, agruparDeATres(digitos), c.documentId].filter(Boolean).join(' ')
    };
  })
];

/**
 * Aplica lo que el servidor devolvió al caso que ya está en pantalla, SIN
 * perder lo que el servidor calculó aparte —cuentas, términos, personas— y que
 * la respuesta del PATCH no trae. Solo se copian los campos editables.
 */
export const aplicarGuardado = <T extends Expediente>(caso: T, guardado: Expediente): T => ({
  ...caso,
  caratula: guardado.caratula,
  radicado: guardado.radicado,
  despacho: guardado.despacho,
  rama: guardado.rama,
  contraparte: guardado.contraparte,
  notas: guardado.notas,
  updatedAt: guardado.updatedAt || caso.updatedAt
});
