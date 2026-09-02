import React from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { billingApi, type Extracto, type Movement, type Suma } from '../billing.api';

/**
 * Extracto del período: el libro de un mes, sumado, y un comprobante que se
 * imprime o se guarda como PDF desde el navegador.
 *
 * ─── COMPROBANTE, NO FACTURA ────────────────────────────────────────────────
 *
 * En Colombia «factura» es un documento legal que la DIAN valida antes de
 * entregarse (Estatuto Tributario, art. 616-1). Este documento no lo es y lo
 * dice en su pie. Es un extracto: saldo inicial, entradas, salidas por
 * concepto, saldo final, y el detalle. Lo que la firma necesita para saber en
 * qué se fue el saldo; lo que la factura electrónica necesitará después, por
 * un proveedor tecnológico, es otra pieza.
 *
 * ─── POR QUÉ SE IMPRIME CON `window.print` Y NO CON UNA VENTANA NUEVA ───────
 *
 * Una ventana emergente se bloquea en el teléfono y en varios escritorios. La
 * hoja imprimible vive en el documento, montada al final del <body> con un
 * portal para que no la recorten los `overflow` del diálogo, oculta en
 * pantalla y visible solo al imprimir: la regla `@media print` en index.css
 * apaga todo lo demás. Funciona en el teléfono con «Compartir → Imprimir» o
 * «Guardar como PDF», que es lo que un socio hace de verdad.
 *
 * ─── EL SERVIDOR SUMA; AQUÍ SE MUESTRA ──────────────────────────────────────
 *
 * Los totales vienen calculados del servidor sobre el mismo libro que la tabla
 * de movimientos. Sumar aquí sería tener dos aritméticas que un día dirían
 * cifras distintas.
 */

interface ExtractoDelPeriodoProps {
  activo: boolean;
  firmName: string;
  firmNit?: string;
}

const pesos = (valor: number): string => {
  const abs = Math.round(Math.abs(valor)).toLocaleString('es-CO');
  return valor < 0 ? `-$${abs}` : `$${abs}`;
};

const fechaHora = (iso: string): string =>
  new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * «Septiembre de 2026», desde «2026-09». Solo la primera letra en mayúscula:
 * `text-transform: capitalize` daba «Septiembre De 2026», que en español es
 * un error de ortografía impreso en un comprobante.
 */
const nombreDelPeriodo = (periodo: string): string => {
  const [a, m] = periodo.split('-').map(Number);
  const nombre = new Date(Date.UTC(a, m - 1, 15)).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
};

/** El mes en curso en Bogotá, con la misma regla que el servidor (UTC-5, sin horario de verano). */
const periodoActual = (): string => {
  const bogota = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return `${bogota.getUTCFullYear()}-${String(bogota.getUTCMonth() + 1).padStart(2, '0')}`;
};

/** Los últimos doce meses, del actual hacia atrás. */
const ultimosPeriodos = (cuantos = 12): string[] => {
  const [a, m] = periodoActual().split('-').map(Number);
  return Array.from({ length: cuantos }, (_, i) => {
    const d = new Date(Date.UTC(a, m - 1 - i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
};

const CONCEPTOS: Array<{ clave: 'borradores' | 'resumenes' | 'orientaciones' | 'revisiones' | 'otros'; singular: string; plural: string }> = [
  { clave: 'borradores', singular: 'escrito', plural: 'escritos' },
  { clave: 'resumenes', singular: 'resumen', plural: 'resúmenes' },
  { clave: 'orientaciones', singular: 'orientación', plural: 'orientaciones' },
  { clave: 'revisiones', singular: 'revisión de escrito', plural: 'revisiones de escritos' },
  { clave: 'otros', singular: 'otro consumo', plural: 'otros consumos' }
];

const cuenta = (s: Suma, singular: string, plural: string): string =>
  `${s.cantidad} ${s.cantidad === 1 ? singular : plural}`;

export const ExtractoDelPeriodo: React.FC<ExtractoDelPeriodoProps> = ({ activo, firmName, firmNit }) => {
  const [periodo, setPeriodo] = React.useState(periodoActual);
  const [extracto, setExtracto] = React.useState<Extracto | null>(null);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState('');
  const periodos = React.useMemo(() => ultimosPeriodos(), []);

  React.useEffect(() => {
    if (!activo) return;
    let vigente = true;
    setCargando(true);
    setError('');
    billingApi
      .statement(periodo)
      .then((e) => {
        if (vigente) setExtracto(e);
      })
      .catch((err: unknown) => {
        if (vigente) setError(err instanceof Error ? err.message : 'No se pudo cargar el extracto.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [activo, periodo]);

  const r = extracto?.resumen ?? null;
  const hayMovimientos = (extracto?.movimientos.length ?? 0) > 0;

  return (
    <div className="rounded-card border border-line-200 bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h4 className="text-ui font-semibold text-ink-900">Extracto</h4>
          <label htmlFor="periodo-extracto" className="sr-only">
            Período
          </label>
          <select
            id="periodo-extracto"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="field h-8 w-auto py-0 text-[12.5px]"
          >
            {periodos.map((p) => (
              <option key={p} value={p}>
                {nombreDelPeriodo(p)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={!hayMovimientos || cargando}
          className="btn-neutral btn-sm"
          title="Imprimir o guardar como PDF el comprobante del período"
        >
          <Printer className="h-3.5 w-3.5" />
          Imprimir comprobante
        </button>
      </div>

      {error && <p className="mt-2 text-meta text-danger">{error}</p>}

      {r && !hayMovimientos && !cargando && (
        <p className="mt-3 text-meta text-ink-500">Sin movimientos en {nombreDelPeriodo(periodo)}.</p>
      )}

      {r && hayMovimientos && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-control border border-line-100 bg-canvas p-2.5">
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">Saldo inicial</p>
            <p className="mt-0.5 font-mono text-[15px] font-semibold text-ink-900">{pesos(r.saldoInicial)}</p>
          </div>
          <div className="rounded-control border border-line-100 bg-canvas p-2.5">
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">Entradas</p>
            <p className="mt-0.5 font-mono text-[15px] font-semibold text-verified">+{pesos(r.entradas)}</p>
            <p className="text-[11px] leading-snug text-ink-500">
              {cuenta(r.recargas, 'recarga', 'recargas')}
              {r.devoluciones.cantidad > 0 && ` · ${cuenta(r.devoluciones, 'devolución', 'devoluciones')}`}
            </p>
          </div>
          <div className="rounded-control border border-line-100 bg-canvas p-2.5">
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">Salidas</p>
            <p className="mt-0.5 font-mono text-[15px] font-semibold text-ink-900">{pesos(r.salidas)}</p>
            <p className="text-[11px] leading-snug text-ink-500">
              {CONCEPTOS.filter((c) => r.consumo[c.clave].cantidad > 0)
                .map((c) => cuenta(r.consumo[c.clave], c.singular, c.plural))
                .join(' · ') || 'sin consumo'}
              {r.ajustes.cantidad > 0 && ` · ${cuenta(r.ajustes, 'ajuste', 'ajustes')}`}
            </p>
          </div>
          <div className="rounded-control border border-line-100 bg-canvas p-2.5">
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">Saldo final</p>
            <p className="mt-0.5 font-mono text-[15px] font-semibold text-ink-900">{pesos(r.saldoFinal)}</p>
          </div>
        </div>
      )}

      <p className="mt-2 text-meta text-ink-400">
        Comprobante informativo de movimientos. No es factura de venta ni documento equivalente.
      </p>

      {extracto && hayMovimientos && (
        <HojaImprimible extracto={extracto} firmName={firmName} firmNit={firmNit} />
      )}
    </div>
  );
};

/* ─── LA HOJA, montada al final del body y visible solo al imprimir ─────────── */

const HojaImprimible: React.FC<{ extracto: Extracto; firmName: string; firmNit?: string }> = ({
  extracto,
  firmName,
  firmNit
}) => {
  const r = extracto.resumen;
  const filas: Movement[] = [...extracto.movimientos].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const generado = new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });

  return createPortal(
    <div id="extracto-imprimible" className="hidden print:block" style={{ fontFamily: 'Georgia, serif', color: '#111' }}>
      <div style={{ padding: '24px 32px', maxWidth: 720, margin: '0 auto', fontSize: 12, lineHeight: 1.45 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #111', paddingBottom: 8 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.02em' }}>Iureon</div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Comprobante de movimientos de saldo</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11 }}>
            <div>{nombreDelPeriodo(extracto.periodo)}</div>
            <div>Generado el {generado}</div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555' }}>Firma</div>
            <div style={{ fontWeight: 600 }}>{firmName}</div>
            {firmNit && <div>NIT {firmNit}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555' }}>Período</div>
            <div>
              {new Date(extracto.desde).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} –{' '}
              {new Date(new Date(extracto.hasta).getTime() - 1).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse', fontSize: 12 }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 0' }}>Saldo inicial</td>
              <td style={{ textAlign: 'right', fontFamily: 'ui-monospace, monospace' }}>{pesos(r.saldoInicial)}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0' }}>
                Entradas · {cuenta(r.recargas, 'recarga', 'recargas')}
                {r.devoluciones.cantidad > 0 && `, ${cuenta(r.devoluciones, 'devolución', 'devoluciones')}`}
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'ui-monospace, monospace' }}>+{pesos(r.entradas)}</td>
            </tr>
            {CONCEPTOS.filter((c) => r.consumo[c.clave].cantidad > 0).map((c) => (
              <tr key={c.clave}>
                <td style={{ padding: '4px 0 4px 16px' }}>{cuenta(r.consumo[c.clave], c.singular, c.plural)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'ui-monospace, monospace' }}>{pesos(r.consumo[c.clave].total)}</td>
              </tr>
            ))}
            {r.ajustes.cantidad > 0 && (
              <tr>
                <td style={{ padding: '4px 0 4px 16px' }}>{cuenta(r.ajustes, 'ajuste del operador', 'ajustes del operador')}</td>
                <td style={{ textAlign: 'right', fontFamily: 'ui-monospace, monospace' }}>{pesos(r.ajustes.total)}</td>
              </tr>
            )}
            <tr style={{ borderTop: '1px solid #111', fontWeight: 700 }}>
              <td style={{ padding: '6px 0' }}>Saldo final</td>
              <td style={{ textAlign: 'right', fontFamily: 'ui-monospace, monospace' }}>{pesos(r.saldoFinal)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: 18, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555' }}>Detalle</div>
        <table style={{ width: '100%', marginTop: 4, borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #999', textAlign: 'left' }}>
              <th style={{ padding: '3px 0', fontWeight: 600 }}>Fecha</th>
              <th style={{ padding: '3px 0', fontWeight: 600 }}>Concepto</th>
              <th style={{ padding: '3px 0', fontWeight: 600 }}>Usuario</th>
              <th style={{ padding: '3px 0', fontWeight: 600, textAlign: 'right' }}>Valor</th>
              <th style={{ padding: '3px 0', fontWeight: 600, textAlign: 'right' }}>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((m, i) => (
              <tr key={`${m.createdAt}-${i}`} style={{ borderBottom: '1px solid #e5e5e5' }}>
                <td style={{ padding: '3px 8px 3px 0', whiteSpace: 'nowrap' }}>{fechaHora(m.createdAt)}</td>
                <td style={{ padding: '3px 8px 3px 0' }}>{m.description}</td>
                <td style={{ padding: '3px 8px 3px 0', color: '#555' }}>{m.actorEmail}</td>
                <td style={{ padding: '3px 0', textAlign: 'right', fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap' }}>
                  {m.amountCop > 0 ? '+' : ''}
                  {pesos(m.amountCop)}
                </td>
                <td style={{ padding: '3px 0 3px 8px', textAlign: 'right', fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap' }}>
                  {pesos(m.balanceAfterCop)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {extracto.truncado && (
          <p style={{ marginTop: 8, fontSize: 10 }}>
            El período tiene más movimientos de los que caben en este comprobante; descargue el CSV para el detalle completo.
          </p>
        )}

        <p style={{ marginTop: 18, fontSize: 10, color: '#555', borderTop: '1px solid #ccc', paddingTop: 8 }}>
          Comprobante informativo de los movimientos del saldo prepagado de la firma en Iureon. No es factura de venta ni
          documento equivalente en los términos del Estatuto Tributario, y no sustituye la factura electrónica que se emite
          por separado. Los valores están en pesos colombianos.
        </p>
      </div>
    </div>,
    document.body
  );
};
