/**
 * Extracto del período: arithmetic over the firm's ledger, for a document the
 * firm can print.
 *
 * ─── WHAT THIS IS, AND WHAT IT IS NOT ────────────────────────────────────────
 *
 * It is a statement: opening balance, what came in, what went out grouped by
 * what the lawyer asked for, closing balance. It is NOT an invoice. In Colombia
 * an invoice is a legal document validated by the DIAN before delivery
 * (Estatuto Tributario, art. 616-1), and this module never claims to be one:
 * the document it feeds says so in its own footer. Calling it «comprobante»
 * is deliberate.
 *
 * ─── WHY THE GROUPING READS THE DESCRIPTION ─────────────────────────────────
 *
 * `credit_movements` has no `operation` column: the ledger was written to be
 * read by a person, row by row, and each consumption carries the title of the
 * document it paid for («Borrador: Recurso de reposición»). Grouping by what
 * the lawyer asked for therefore reads the concept's prefix. That is a
 * contract with the writers of those rows — the drafting controller writes
 * «Borrador: …», the transcription controller «Resumen de …» — and the check
 * pins it. Anything that matches no prefix lands in `otros` rather than
 * disappearing: a statement that silently drops a row is wrong money.
 *
 * Pure. No database, no clock: the controller fetches and this adds up.
 */

export interface MovimientoDelLibro {
  kind: string;
  amountCop: number;
  balanceAfterCop: number;
  description: string;
  actorEmail: string;
  createdAt: string;
}

export interface Suma {
  cantidad: number;
  total: number;
}

export interface ResumenDelPeriodo {
  saldoInicial: number;
  saldoFinal: number;
  recargas: Suma;
  devoluciones: Suma;
  ajustes: Suma;
  consumo: {
    borradores: Suma;
    resumenes: Suma;
    orientaciones: Suma;
    /** Revisiones de escritos ya redactados («Revisión: …»). */
    revisiones: Suma;
    otros: Suma;
    total: number;
  };
  /** recargas + devoluciones */
  entradas: number;
  /** consumo + ajustes (ajustes carry their own sign) */
  salidas: number;
}

const cero = (): Suma => ({ cantidad: 0, total: 0 });

const sumar = (s: Suma, monto: number): void => {
  s.cantidad += 1;
  s.total += monto;
};

/** Which concept a consumption row belongs to, read from what the lawyer asked for. */
const conceptoDe = (description: string): 'borradores' | 'resumenes' | 'orientaciones' | 'revisiones' | 'otros' => {
  if (/^Borrador\b/i.test(description)) return 'borradores';
  if (/^Resumen de\b/i.test(description)) return 'resumenes';
  if (/^Revisi[óo]n\b/i.test(description)) return 'revisiones';
  if (/^Consulta de revisi[óo]n\b/i.test(description)) return 'revisiones';
  if (/orientaci[óo]n/i.test(description)) return 'orientaciones';
  return 'otros';
};

/** Adds up a ledger slice. Accepts the rows in any order. */
export const resumirPeriodo = (movimientos: MovimientoDelLibro[]): ResumenDelPeriodo => {
  const r: ResumenDelPeriodo = {
    saldoInicial: 0,
    saldoFinal: 0,
    recargas: cero(),
    devoluciones: cero(),
    ajustes: cero(),
    consumo: { borradores: cero(), resumenes: cero(), orientaciones: cero(), revisiones: cero(), otros: cero(), total: 0 },
    entradas: 0,
    salidas: 0
  };

  if (movimientos.length === 0) return r;

  const ordenados = [...movimientos].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const primero = ordenados[0];
  const ultimo = ordenados[ordenados.length - 1];

  // The balance before the oldest row is the balance it left minus what it moved.
  r.saldoInicial = primero.balanceAfterCop - primero.amountCop;
  r.saldoFinal = ultimo.balanceAfterCop;

  for (const m of ordenados) {
    switch (m.kind) {
      case 'RECARGA':
        sumar(r.recargas, m.amountCop);
        break;
      case 'DEVOLUCION':
        sumar(r.devoluciones, m.amountCop);
        break;
      case 'AJUSTE':
        sumar(r.ajustes, m.amountCop);
        break;
      case 'CONSUMO':
        sumar(r.consumo[conceptoDe(m.description)], m.amountCop);
        r.consumo.total += m.amountCop;
        break;
      default:
        // An unknown kind is still money that moved. It goes with its sign.
        if (m.amountCop >= 0) sumar(r.recargas, m.amountCop);
        else {
          sumar(r.consumo.otros, m.amountCop);
          r.consumo.total += m.amountCop;
        }
    }
  }

  r.entradas = r.recargas.total + r.devoluciones.total;
  r.salidas = r.consumo.total + r.ajustes.total;
  return r;
};

/**
 * The month's boundaries in Bogotá time (UTC-5, no daylight saving), as ISO
 * instants for the database. A draft made at 9 pm on the 31st is 02:00 UTC on
 * the 1st; it belongs to the month the lawyer was living in.
 */
export const limitesDelPeriodo = (periodo: string): { desde: string; hasta: string } | null => {
  const m = /^(\d{4})-(\d{2})$/.exec(periodo);
  if (!m) return null;
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) return null;

  const BOGOTA_OFFSET_HOURS = 5;
  const desde = new Date(Date.UTC(anio, mes - 1, 1, BOGOTA_OFFSET_HOURS));
  const hasta = new Date(Date.UTC(anio, mes, 1, BOGOTA_OFFSET_HOURS));
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
};
