import React from 'react';
import { ExternalLink, RefreshCw, Server } from 'lucide-react';
import { privacyApi, type Disclosure, type Subprocessor, type DataClass } from '../privacy.api';

/**
 * Privacidad y seguridad. La pantalla que se proyecta ante un cliente.
 *
 * ─── POR QUÉ EL ENCABEZADO ES OSCURO ────────────────────────────────────────
 *
 * Es la única pantalla de la aplicación pensada para mostrarse en una reunión
 * de ventas o leerse frente al cliente de la firma: tiene que leerse como
 * documento institucional, no como una página de ajustes. El azul de la barra
 * lateral es la identidad; aquí se usa una sola vez más, a propósito.
 *
 * ─── LA JERARQUÍA LA FIJA LA SENSIBILIDAD DEL DATO ──────────────────────────
 *
 * Los subencargados que tocan CONTENIDO DEL CASO —lo que cubre el secreto
 * profesional— van como fichas amplias que responden las cuatro preguntas de
 * un abogado en orden fijo: qué recibe, dónde se procesa, con qué base sale
 * del país, cuánto se conserva. Los de infraestructura van en tabla densa.
 * No es orden alfabético ni de contrato: es el orden del riesgo.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ──────────────────
 *
 * · «Certificado en PDF» y «avisarme de cambios»: no hay generación de
 *   certificados ni sistema de avisos. Prometerlos sería decorar.
 * · El panel «¿quién ha visto el contrato de mi cliente?» por documento: exige
 *   un registro de envíos por documento que no existe todavía. Es la pieza más
 *   valiosa del artboard y merece su propio backend, no una imitación.
 * · «0 cambios en 90 días»: no hay historial del registro. La lista es
 *   derivada de la configuración viva — eso sí se dice, porque es verdad.
 */

const ETIQUETA_DATOS: Record<DataClass, string> = {
  IDENTIFICACION: 'Identificación',
  CONTENIDO_DEL_CASO: 'Contenido del caso',
  AUDIO_DE_AUDIENCIA: 'Audio de audiencia',
  TRANSCRITO: 'Transcrito',
  DATOS_DE_PAGO: 'Datos de pago',
  METADATOS_DE_USO: 'Metadatos de uso'
};

/** Case content is the sensitive one: it is what professional secrecy covers. */
const esSensible = (dato: DataClass): boolean =>
  dato === 'CONTENIDO_DEL_CASO' || dato === 'AUDIO_DE_AUDIENCIA' || dato === 'TRANSCRITO';

const tocaElCaso = (s: Subprocessor): boolean => s.datos.some(esSensible);

export const SubprocessorsView: React.FC = () => {
  const [disclosure, setDisclosure] = React.useState<Disclosure | null>(null);
  const [lista, setLista] = React.useState<Subprocessor[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState('');
  /* La hora de la lectura: es lo que respalda el sello «derivado del sistema». */
  const [leidoEl, setLeidoEl] = React.useState<Date | null>(null);

  const cargar = React.useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const { disclosure: d, subprocessors: s } = await privacyApi.subprocessors();
      setDisclosure(d);
      setLista(s);
      setLeidoEl(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el registro.');
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    void cargar();
  }, [cargar]);

  const sensibles = lista.filter(tocaElCaso);
  const infraestructura = lista.filter((s) => !tocaElCaso(s));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-canvas font-sans">
      {/* ─── ENCABEZADO INSTITUCIONAL ──────────────────────────────────────── */}
      <header className="shrink-0 bg-nav px-6 py-5">
        <div className="mx-auto flex max-w-4xl flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-title text-white">Privacidad y seguridad</h1>
            <p className="mt-1 text-ui leading-[1.5] text-nav-ink">
              Quién más puede haber visto el contrato de su cliente.
            </p>
            {disclosure && (
              <p className="mt-2 max-w-2xl text-meta leading-[1.6] text-nav-muted">
                Su firma es la <span className="font-medium text-nav-ink">responsable</span> del
                tratamiento; Iureon es su{' '}
                <span className="font-medium text-nav-ink">encargado</span>. Cada proveedor de esta
                lista es, por tanto, un subencargado de su firma. {disclosure.marcoLegal}.
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            {/*
              EL SELLO. La lista se genera desde la configuración que está
              corriendo — nadie la mantiene a mano — y la hora es la de ESTA
              lectura, no una promesa de comprobación programada que no existe.
            */}
            <span className="inline-block rounded-control border border-nav-line px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-nav-ink">
              Derivado del sistema
            </span>
            {leidoEl && (
              <p className="mt-1 font-mono text-[10.5px] text-nav-muted">
                Leído de la configuración{' '}
                {leidoEl.toLocaleString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
            <p className="mt-0.5 font-mono text-[10.5px] text-nav-muted">
              {lista.length} subencargados activos
            </p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-4xl space-y-4">
          {error && <p className="notice-unverified">{error}</p>}

          {cargando && lista.length === 0 && (
            <p className="text-meta text-ink-500">Leyendo la configuración…</p>
          )}

          {/* ─── POSICIÓN JURÍDICA ───────────────────────────────────────── */}
          {disclosure && (
            <section className="overflow-hidden rounded-card border border-line-200 bg-surface">
              <header className="border-b border-line-100 bg-canvas px-4 py-2.5">
                <h3 className="text-ui font-semibold text-ink-900">
                  Su posición jurídica · {disclosure.marcoLegal}
                </h3>
              </header>
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
                {(
                  [
                    ['Su firma', disclosure.posicionDeLaFirma],
                    ['Iureon', disclosure.posicionDeIureon],
                    ['Estos terceros', disclosure.posicionDeEstosTerceros]
                  ] as const
                ).map(([titulo, texto]) => (
                  <div key={titulo}>
                    <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                      {titulo}
                    </p>
                    <p className="mt-1 text-ui leading-[1.55] text-ink-700">{texto}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── LOS QUE TOCAN EL CASO · fichas amplias ──────────────────── */}
          {sensibles.length > 0 && (
            <section>
              <h3 className="t-head rounded-t-card border border-b-0 border-line-200">
                Tocan contenido del caso · {sensibles.length} — lo que cubre el secreto profesional
              </h3>
              <div className="divide-y divide-line-100 rounded-b-card border border-line-200 bg-surface">
                {sensibles.map((s, i) => (
                  <div key={`${s.nombre}-${i}`} className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-ui font-semibold text-ink-900">{s.nombre}</h4>
                        <p className="text-meta text-ink-500">
                          {s.proposito}
                          {s.atravesDe && (
                            <span className="text-ink-400"> · a través de {s.atravesDe}</span>
                          )}
                        </p>
                      </div>
                      <a
                        href={s.sitio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex shrink-0 items-center gap-1 text-meta text-brand-700 hover:underline"
                      >
                        Su política <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {/*
                      LAS CUATRO PREGUNTAS DE UN ABOGADO, en su orden fijo.
                      Qué recibe · dónde · con qué base sale del país · cuánto
                      se conserva. Cada ficha responde las cuatro, siempre.
                    */}
                    <dl className="grid grid-cols-1 gap-x-5 gap-y-1.5 sm:grid-cols-2">
                      <div>
                        <dt className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                          Qué recibe
                        </dt>
                        <dd className="mt-0.5 flex flex-wrap gap-1">
                          {s.datos.map((d) => (
                            <span
                              key={d}
                              className={esSensible(d) ? 'chip-unverified' : 'chip-neutral'}
                            >
                              {ETIQUETA_DATOS[d]}
                            </span>
                          ))}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                          Dónde se procesa
                        </dt>
                        <dd className="mt-0.5 text-ui text-ink-900">{s.ubicacion}</dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                          Base de transferencia
                        </dt>
                        <dd className="mt-0.5 text-ui leading-[1.5] text-ink-700">
                          {s.baseDeTransferencia}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                          {s.retiene ? 'Cuánto conserva' : 'No conserva'}
                        </dt>
                        <dd className="mt-0.5 text-ui leading-[1.5] text-ink-700">{s.retencion}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── INFRAESTRUCTURA · tabla densa ───────────────────────────── */}
          {infraestructura.length > 0 && (
            <section className="overflow-hidden rounded-card border border-line-200 bg-surface">
              <header className="flex items-center gap-2 border-b border-line-100 bg-canvas px-4 py-2.5">
                <Server className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                <h3 className="text-ui font-semibold text-ink-900">
                  Infraestructura · {infraestructura.length}
                </h3>
              </header>

              <div className="t-head hidden items-center gap-3 md:flex">
                <span className="w-[180px] shrink-0">Subencargado</span>
                <span className="min-w-0 flex-1">Qué recibe</span>
                <span className="w-[110px] shrink-0">Ubicación</span>
                <span className="w-[170px] shrink-0">Retención</span>
              </div>

              {infraestructura.map((s, i) => (
                <div key={`${s.nombre}-${i}`} className="t-row flex flex-wrap items-center gap-3">
                  <span className="w-[180px] shrink-0">
                    <a
                      href={s.sitio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ui text-ink-900 hover:text-brand-700 hover:underline"
                      title={s.proposito}
                    >
                      {s.nombre}
                    </a>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-meta text-ink-500">
                    {s.datos.map((d) => ETIQUETA_DATOS[d]).join(', ')}
                  </span>
                  <span className="w-[110px] shrink-0 text-meta text-ink-700">{s.ubicacion}</span>
                  <span
                    className="w-[170px] shrink-0 truncate text-meta text-ink-500"
                    title={s.retencion}
                  >
                    {s.retencion}
                  </span>
                </div>
              ))}
            </section>
          )}

          {/* ─── LO QUE NUNCA OCURRE ─────────────────────────────────────── */}
          {disclosure && (
            <section className="rounded-card border border-[rgb(var(--verified-line))] bg-[rgb(var(--verified-surf))] p-4">
              <h3 className="text-ui font-semibold text-ink-900">Lo que nunca ocurre</h3>
              <ul className="mt-2 space-y-1.5">
                {disclosure.loQueNoHacemos.map((linea, i) => (
                  <li key={i} className="flex gap-2 text-ui leading-[1.55] text-ink-700">
                    <span className="shrink-0 text-verified">—</span>
                    <span>{linea}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {disclosure && (
            <p className="px-1 pb-2 text-meta leading-[1.6] text-ink-400">
              {disclosure.advertencia}
            </p>
          )}

          <div className="flex justify-end pb-4">
            <button onClick={() => void cargar()} className="btn-neutral btn-sm">
              <RefreshCw className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
              Volver a leer la configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
