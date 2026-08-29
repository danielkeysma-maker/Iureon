import React from 'react';
import { Loader2 } from 'lucide-react';
import { auditApi, type AuditLogEntry } from '../services/audit.api';
import { ACCIONES } from './AuditView';

/**
 * Auditoría en móvil. Artboard 4e, y su nota es la instrucción entera:
 *
 *   «La tabla densa de auditoría no cabe en 390px y NO SE INTENTA: se convierte
 *    en lista de eventos agrupada por día.»
 *
 * ─── POR QUÉ NO SE INTENTA, MEDIDO ──────────────────────────────────────────
 *
 * Las columnas de escritorio suman 464px —fecha 104, usuario 110, acción 150,
 * origen 100— antes del recurso, que es la que más texto lleva. En 375 no hay
 * forma de encogerlas sin que cada celda quede en dos palabras. La maqueta no
 * propone una tabla estrecha: propone otra cosa.
 *
 * ─── AGRUPAR POR DÍA ES LO QUE HACE ÚTIL EL REGISTRO ────────────────────────
 *
 * A esta pantalla se viene con una pregunta con fecha —«¿quién descargó eso el
 * martes?»—, no a leer mil cuatrocientos eventos seguidos. El rótulo del día es
 * lo que convierte una lista larga en una consulta.
 *
 * ─── LO QUE 4e DIBUJA Y NO SE PINTA, con la razón (ya declarada) ────────────
 *
 * · El sello «OK» por evento. Solo se registran las acciones que OCURRIERON:
 *   una columna que siempre dice OK es ruido, y está razonado desde antes en la
 *   pantalla de escritorio. El día que se registren fallos, el sello tendrá algo
 *   que distinguir.
 * · La hoja de detalle con «Antes / Después» y el `sha256`. Exigiría guardar el
 *   estado previo de cada cambio, que la tabla no guarda. Es construible —una
 *   columna con el valor anterior— y queda anotado como tal.
 */

const fechaDe = (iso: string): string => new Date(iso).toISOString().slice(0, 10);

const rotuloDelDia = (iso: string): string => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dia = new Date(iso);
  dia.setHours(0, 0, 0, 0);
  const dias = Math.round((hoy.getTime() - dia.getTime()) / 86400000);

  const largo = dia.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
  if (dias === 0) return `Hoy · ${largo}`;
  if (dias === 1) return `Ayer · ${largo}`;
  return dia.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
};

const hora = (iso: string): string =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

export const AuditMobileView: React.FC = () => {
  const [eventos, setEventos] = React.useState<AuditLogEntry[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let vigente = true;
    auditApi
      .listLogs()
      .then((filas) => {
        if (vigente) setEventos(filas);
      })
      .catch((e: unknown) => {
        if (vigente) setError(e instanceof Error ? e.message : 'No se pudo leer la auditoría.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  /*
   * Agrupado por dia CONSERVANDO EL ORDEN que trae el servidor —lo mas reciente
   * primero—. Reordenar aqui pondria a esta pantalla a discrepar del registro
   * que audita, que es exactamente lo que no puede pasar.
   */
  const porDia = React.useMemo(() => {
    const orden: string[] = [];
    const mapa = new Map<string, AuditLogEntry[]>();
    for (const e of eventos) {
      const dia = fechaDe(e.timestamp);
      if (!mapa.has(dia)) {
        mapa.set(dia, []);
        orden.push(dia);
      }
      mapa.get(dia)!.push(e);
    }
    return orden.map((dia) => ({ dia, eventos: mapa.get(dia)! }));
  }, [eventos]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-canvas">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {cargando && (
          <div className="flex items-center justify-center gap-2 py-16 text-[12.5px] text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Leyendo la auditoría…
          </div>
        )}

        {error && (
          <p className="rounded-[8px] border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.06)] px-3.5 py-3 text-[12.5px] leading-snug text-danger">
            {error}
          </p>
        )}

        {!cargando && !error && eventos.length === 0 && (
          <p className="py-16 text-center text-[12.5px] text-ink-500">
            Todavía no hay eventos registrados.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {porDia.map(({ dia, eventos: delDia }) => (
            <section key={dia}>
              <p className="pb-1 pt-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                {rotuloDelDia(delDia[0].timestamp)}
              </p>

              <ul className="flex flex-col gap-2">
                {delDia.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-[8px] border border-line-200 bg-surface px-3 py-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-900">
                        {ACCIONES[e.action] ?? e.action}
                      </span>
                      <span className="shrink-0 font-mono text-[11.5px] text-ink-500">
                        {hora(e.timestamp)}
                      </span>
                    </div>

                    {e.resource && (
                      <p className="mt-1 text-justify text-[12.5px] leading-[1.55] text-ink-700 [text-wrap:pretty]">
                        {e.resource}
                      </p>
                    )}

                    {/*
                      QUIEN Y DESDE DONDE, en una linea de mono. La IP se recorta
                      igual que en escritorio: identifica la sesion sin publicar
                      la direccion completa de nadie.
                    */}
                    <p className="mt-1.5 font-mono text-[11px] text-ink-400">
                      {[e.userEmail, e.ipAddress].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
