/**
 * Las líneas del membrete, calculadas una vez para el PDF y el Word.
 *
 * ─── EL DEFECTO QUE ESTO CIERRA ─────────────────────────────────────────────
 *
 * La configuración por defecto traía relleno: «REPÚBLICA DE COLOMBIA - RAMA
 * JUDICIAL», «SIN NIT FISCAL REGISTRADO», «Dirección Corporativa»,
 * «notificaciones@tufirma.co». Era texto de maqueta, y salía IMPRESO en el
 * escrito de cualquier firma que no hubiera llenado Membrete: la tutela de
 * un litigante llevaba en el pie el nombre de la Rama Judicial, que es la
 * cabecera de un juzgado, no de quien le escribe. Un relleno que se imprime
 * no es relleno; es una afirmación falsa en un documento que se radica.
 *
 * ─── LA REGLA ───────────────────────────────────────────────────────────────
 *
 * Solo se imprime lo que la firma escribió. Lo vacío no se sustituye por
 * nada: sin NIT no hay «NIT», sin correo no hay correo, y sin nombre no hay
 * cabecera. Puro y compartido para que el PDF y el Word no puedan discrepar.
 */

export interface DatosDeMembrete {
  firmName?: string | null;
  firmNit?: string | null;
  firmAddress?: string | null;
  firmPhone?: string | null;
  firmEmail?: string | null;
}

export interface LineasDeMembrete {
  /** El nombre de la firma en mayúsculas, o '' si no hay. */
  encabezado: string;
  /** «NIT 900.123.456-7 · Cra. 11 # 93-46, Bogotá», solo con lo que exista. */
  identificacion: string;
  /** Pie del PDF: «Firma · correo». */
  pieIzquierda: string;
  /** Pie del Word: «dirección · teléfono». */
  pieContacto: string;
  /** Si hay algo que imprimir como membrete. */
  tieneMembrete: boolean;
}

const limpio = (v?: string | null): string => (v ?? '').trim();

export const lineasDeMembrete = (b: DatosDeMembrete): LineasDeMembrete => {
  const nombre = limpio(b.firmName);
  const nit = limpio(b.firmNit);
  const direccion = limpio(b.firmAddress);
  const telefono = limpio(b.firmPhone);
  const correo = limpio(b.firmEmail);
  return {
    encabezado: nombre.toUpperCase(),
    identificacion: [nit && `NIT ${nit}`, direccion].filter(Boolean).join(' · '),
    pieIzquierda: [nombre, correo].filter(Boolean).join(' · '),
    pieContacto: [direccion, telefono].filter(Boolean).join(' · '),
    tieneMembrete: Boolean(nombre || nit || direccion || telefono || correo)
  };
};
