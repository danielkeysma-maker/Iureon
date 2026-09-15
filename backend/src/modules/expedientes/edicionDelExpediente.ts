/**
 * EL RESUMEN DE UNA EDICIÓN DEL EXPEDIENTE, PARA LA AUDITORÍA.
 *
 * Función pura: recibe lo que había guardado y lo que el cliente MANDÓ en el
 * PATCH, y devuelve qué cambió en una línea corta. `null` si nada cambió de
 * verdad: un campo reenviado con el mismo valor no es un hecho, y llenar la
 * auditoría de no-cambios ahoga los cambios reales (mismo criterio que el
 * renombrado de documentos y carpetas).
 *
 * ─── QUÉ LLEVA VALORES Y QUÉ SOLO EL NOMBRE DEL CAMPO ──────────────────────
 *
 * La carátula, el radicado, la rama y el estado identifican el caso: quien no
 * lo encuentre por su nombre o su radicado de siempre tiene derecho a leer
 * cómo se llamaba y quién lo cambió. El despacho, la contraparte y el cliente
 * se nombran sin su texto. Las NOTAS se nombran y su contenido nunca va al
 * rastro: son lo que el abogado escribió sobre el asunto de su cliente, y la
 * auditoría la leen todos los socios de la firma.
 */

export interface DatosAntesDeLaEdicion {
  caratula: string;
  radicado: string | null;
  despacho: string | null;
  rama: string | null;
  contraparte: string | null;
  notas: string | null;
  estado: string;
  clienteId: string | null;
}

type CampoEditable = keyof DatosAntesDeLaEdicion;

/* En este orden se escriben: primero lo que identifica el caso. */
const CAMPOS: ReadonlyArray<{ campo: CampoEditable; nombre: string; conValores: boolean }> = [
  { campo: 'caratula', nombre: 'carátula', conValores: true },
  { campo: 'radicado', nombre: 'radicado', conValores: true },
  { campo: 'rama', nombre: 'rama', conValores: true },
  { campo: 'despacho', nombre: 'despacho', conValores: false },
  { campo: 'contraparte', nombre: 'contraparte', conValores: false },
  { campo: 'estado', nombre: 'estado', conValores: true },
  { campo: 'clienteId', nombre: 'cliente', conValores: false },
  { campo: 'notas', nombre: 'notas', conValores: false }
];

/* Igual que `texto` del servicio: lo que se guarda es el texto sin bordes, y vacío es null. */
const limpio = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
};

export const resumenDeLaEdicion = (
  antes: DatosAntesDeLaEdicion,
  enviados: Record<string, unknown>
): string | null => {
  const partes: string[] = [];
  for (const { campo, nombre, conValores } of CAMPOS) {
    if (!(campo in enviados)) continue;
    const anterior = limpio(antes[campo]);
    const nuevo = limpio(enviados[campo]);
    if (anterior === nuevo) continue;
    partes.push(conValores ? `${nombre} «${anterior ?? '—'}» → «${nuevo ?? '—'}»` : nombre);
  }
  return partes.length > 0 ? partes.join(' · ') : null;
};
