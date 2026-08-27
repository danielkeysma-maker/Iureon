import React from 'react';
import { AlertTriangle, ExternalLink, ShieldCheck, Server, RefreshCw } from 'lucide-react';
import { privacyApi, type Disclosure, type Subprocessor, type DataClass } from '../privacy.api';

/**
 * Who processes this firm's data, named.
 *
 * WHY A SCREEN AND NOT A CLAUSE IN THE TERMS. Under Ley 1581 de 2012 the firm
 * is the *responsable* of its clients' data and Iureon its *encargado*, so
 * every provider below is a SUBENCARGADO OF THE FIRM — not a supplier of ours
 * in relation to that data. A lawyer whose client asks "who else has seen my
 * contract" cannot answer "a technology provider", and their files are covered
 * by professional secrecy.
 *
 * THE LIST IS DERIVED, WHICH IS THE WHOLE POINT. It is generated from the same
 * configuration flags the runtime reads, so it cannot drift: a provider that is
 * switched off stops appearing, and one that is switched on appears without
 * anyone remembering to add it. A register maintained by hand is worse than
 * none — it reads as diligence while describing a system that no longer exists.
 *
 * It also names the layer a generic notice omits: OpenRouter is a router, so
 * the case facts reach the model vendors behind it. Naming only the router
 * would be literally true and leave the firm unable to answer the question.
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

export const SubprocessorsView: React.FC = () => {
  const [disclosure, setDisclosure] = React.useState<Disclosure | null>(null);
  const [lista, setLista] = React.useState<Subprocessor[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState('');

  const cargar = React.useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const { disclosure: d, subprocessors: s } = await privacyApi.subprocessors();
      setDisclosure(d);
      setLista(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el registro.');
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    void cargar();
  }, [cargar]);

  const directos = lista.filter((s) => !s.atravesDe);
  const indirectos = lista.filter((s) => s.atravesDe);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
      <div className="max-w-4xl mx-auto space-y-4 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-950 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-200" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Quién procesa los datos de tu firma
            </h2>
            <p className="text-[11px] text-slate-500">
              Registro de subencargados, generado desde la configuración que está corriendo.
            </p>
          </div>
          <button
            onClick={() => void cargar()}
            className="text-slate-400 hover:text-slate-700 shrink-0"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-rose-900">{error}</p>
          </div>
        )}

        {disclosure && (
          <>
            {/*
              La posición de cada quien, primero.

              No es preámbulo: una firma que le responde a su cliente, o que
              radica ante la SIC, necesita saber que la RESPONSABLE es ella y no
              nosotros. Es lo que la mayoría supone al revés.
            */}
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <header className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
                <h3 className="text-xs font-bold text-slate-900">
                  Tu posición jurídica · {disclosure.marcoLegal}
                </h3>
              </header>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-blue-950 uppercase tracking-wide">Tu firma</p>
                  <p className="text-[11px] text-slate-700 mt-0.5">{disclosure.posicionDeLaFirma}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-950 uppercase tracking-wide">Iureon</p>
                  <p className="text-[11px] text-slate-700 mt-0.5">{disclosure.posicionDeIureon}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-950 uppercase tracking-wide">
                    Los de abajo
                  </p>
                  <p className="text-[11px] text-slate-700 mt-0.5">
                    {disclosure.posicionDeEstosTerceros}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-emerald-950 mb-2">Lo que NO se hace</h3>
              <ul className="space-y-1.5">
                {disclosure.loQueNoHacemos.map((linea, i) => (
                  <li key={i} className="text-[11px] text-emerald-900 flex gap-2">
                    <span className="text-emerald-600 shrink-0">—</span>
                    <span>{linea}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {cargando && lista.length === 0 && (
          <p className="text-[11px] text-slate-500">Leyendo la configuración…</p>
        )}

        {directos.length > 0 && (
          <Grupo
            titulo="Subencargados directos"
            subtitulo="Reciben datos por contrato con Iureon, por cuenta de tu firma."
            items={directos}
          />
        )}

        {indirectos.length > 0 && (
          <Grupo
            titulo="Detrás del enrutador"
            subtitulo="Los hechos del caso no se detienen en el enrutador: llegan a estas empresas."
            items={indirectos}
          />
        )}

        {disclosure && (
          <p className="text-[10px] text-slate-500 leading-relaxed px-1 pb-2">
            {disclosure.advertencia}
          </p>
        )}
      </div>
    </div>
  );
};

const Grupo: React.FC<{ titulo: string; subtitulo: string; items: Subprocessor[] }> = ({
  titulo,
  subtitulo,
  items
}) => (
  <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <header className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
      <Server className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      <div className="min-w-0">
        <h3 className="text-xs font-bold text-slate-900">
          {titulo} <span className="text-slate-400 font-medium">({items.length})</span>
        </h3>
        <p className="text-[10px] text-slate-500">{subtitulo}</p>
      </div>
    </header>

    <div className="divide-y divide-slate-100">
      {items.map((s, i) => (
        <div key={`${s.nombre}-${i}`} className="p-4">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="min-w-0">
              <h4 className="text-[12px] font-bold text-slate-900">{s.nombre}</h4>
              {s.atravesDe && (
                <p className="text-[10px] text-slate-500">a través de {s.atravesDe}</p>
              )}
            </div>
            <a
              href={s.sitio}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-800 hover:underline flex items-center gap-1 shrink-0"
            >
              Su política <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-[11px] text-slate-700 mb-2">{s.proposito}</p>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {s.datos.map((d) => (
              <span
                key={d}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  esSensible(d)
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {ETIQUETA_DATOS[d]}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <p className="text-[10px] text-slate-500">
              <span className="font-semibold text-slate-700">Dónde:</span> {s.ubicacion}
            </p>
            <p className="text-[10px] text-slate-500">
              <span className="font-semibold text-slate-700">
                {s.retiene ? 'Conserva:' : 'No conserva:'}
              </span>{' '}
              {s.retencion}
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>
);
