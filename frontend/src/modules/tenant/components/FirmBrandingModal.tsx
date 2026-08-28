import React, { useEffect, useState } from 'react';
import { Upload, X as XIcon } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { brandingApi, type FirmBranding } from '../services/branding.api';

interface FirmBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Se llama con la marca guardada, para que la exportación la use al momento. */
  onSaved?: (branding: FirmBranding) => void;
}

/**
 * Marca y formato de la firma. Diálogo tipo 2 —formulario— en tamaño L.
 *
 * ─── FORMULARIO A LA IZQUIERDA, ESCRITO REAL A LA DERECHA ───────────────────
 *
 * Nadie puede juzgar un membrete en abstracto. La previsualización es un
 * escrito de verdad —membrete, juzgado, pretensiones, hechos, bloque de
 * firma— que reacciona a cada opción: cambiar el interlineado se ve en el
 * párrafo, no en una etiqueta.
 *
 * ─── LAS OPCIONES SON LAS QUE UN DESPACHO DISCUTE ───────────────────────────
 *
 * Romanos contra arábigos, «PRIMERO.» contra «1.», la T.P. en el bloque de
 * firma, el correo de notificaciones judiciales. No es un panel de estilos
 * genérico. La numeración y los títulos se aplican AL GENERAR el escrito —el
 * texto ya escrito no se renumera— y viajan como instrucción al motor.
 *
 * ─── EL VELO NO CIERRA CON CAMBIOS SIN GUARDAR ──────────────────────────────
 *
 * Regla del tipo 2 en 3a: es el único caso del sistema donde el clic afuera
 * pregunta en vez de cerrar. Y el primario dice el verbo real —«Guardar y
 * aplicar»— porque guardar sin aplicar no es lo que nadie espera aquí.
 */
export const FirmBrandingModal: React.FC<FirmBrandingModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [marca, setMarca] = useState<FirmBranding | null>(null);
  const [original, setOriginal] = useState<string>('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [avisoVelo, setAvisoVelo] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    brandingApi
      .get()
      .then(({ branding }) => {
        setMarca(branding);
        setOriginal(JSON.stringify(branding));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo leer la marca.'));
  }, [isOpen]);

  const hayCambios = marca !== null && JSON.stringify(marca) !== original;

  const poner = <K extends keyof FirmBranding>(campo: K, valor: FirmBranding[K]) =>
    setMarca((m) => (m ? { ...m, [campo]: valor } : m));

  const subirImagen = (campo: 'logoUrl' | 'signatureImageUrl') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = (ev) => poner(campo, (ev.target?.result as string) ?? null);
    lector.readAsDataURL(archivo);
    e.target.value = '';
  };

  const guardar = async () => {
    if (!marca) return;
    setGuardando(true);
    setError('');

    try {
      const guardada = await brandingApi.put(marca);
      setMarca(guardada);
      setOriginal(JSON.stringify(guardada));
      onSaved?.(guardada);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la marca.');
    } finally {
      setGuardando(false);
    }
  };

  const m = marca;

  return (
    <Dialog
      abierto={isOpen}
      onCerrar={onClose}
      tamano="L"
      titulo="Marca y formato de la firma"
      subtitulo="Se aplica a todo escrito nuevo y a los exportados. Sustituye el formato por defecto de Iureon."
      hayCambiosSinGuardar={hayCambios}
      onIntentoDeCerrarConCambios={() => setAvisoVelo(true)}
      pieIzquierda={
        hayCambios ? (
          <span className="text-unverified">Cambios sin guardar</span>
        ) : (
          <span className="font-mono text-[11px]">Esc cierra</span>
        )
      }
      acciones={
        <>
          <button
            onClick={() => {
              if (m) setMarca(JSON.parse(original || 'null'));
              setAvisoVelo(false);
              onClose();
            }}
            className="btn-neutral btn-sm"
            disabled={guardando}
          >
            Descartar
          </button>
          <button
            onClick={() => void guardar()}
            className="btn-primary btn-sm"
            disabled={!hayCambios || guardando}
          >
            {guardando ? 'Guardando…' : 'Guardar y aplicar'}
          </button>
        </>
      }
    >
      {error && <p className="notice-unverified mb-3">{error}</p>}
      {avisoVelo && hayCambios && (
        <p className="notice mb-3">
          Hay cambios sin guardar. Use «Guardar y aplicar» o «Descartar» — el clic afuera no
          decide por usted.
        </p>
      )}

      {!m ? (
        <p className="text-meta text-ink-500">Leyendo la marca de la firma…</p>
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-4 lg:flex-row">
          {/* ─── EL FORMULARIO ─────────────────────────────────────────────── */}
          <div className="flex w-full min-w-0 flex-col gap-4 overflow-y-auto lg:w-[360px] lg:shrink-0">
            <section>
              <h3 className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Membrete
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  {m.logoUrl ? (
                    <img src={m.logoUrl} alt="Logo" className="h-[38px] max-w-[120px] rounded border border-line-200 bg-white object-contain px-1" />
                  ) : (
                    <span className="flex h-[38px] w-[90px] items-center justify-center rounded border border-dashed border-line-200 text-[10px] text-ink-400">
                      Sin logo
                    </span>
                  )}
                  <label className="btn-neutral btn-sm cursor-pointer">
                    <Upload className="h-3 w-3" />
                    {m.logoUrl ? 'Reemplazar' : 'Subir logo'}
                    <input type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={subirImagen('logoUrl')} />
                  </label>
                  {m.logoUrl && (
                    <button onClick={() => poner('logoUrl', null)} className="btn-neutral btn-sm">
                      <XIcon className="h-3 w-3" />
                      Quitar
                    </button>
                  )}
                </div>
                <p className="text-meta text-ink-400">PNG o SVG con fondo transparente · alto útil 60px en el escrito.</p>

                <label className="block">
                  <span className="field-label">Razón social</span>
                  <input value={m.firmName} onChange={(e) => poner('firmName', e.target.value)} className="field mt-1 w-full" placeholder="Restrepo & Cárdenas Abogados" />
                </label>
                <label className="block">
                  <span className="field-label">NIT</span>
                  <input value={m.firmNit} onChange={(e) => poner('firmNit', e.target.value)} className="field mt-1 w-full font-mono" placeholder="900.482.117-3" />
                </label>
                <label className="block">
                  <span className="field-label">Pie de página</span>
                  <input value={m.firmAddress} onChange={(e) => poner('firmAddress', e.target.value)} className="field mt-1 w-full" placeholder="Cra. 11 # 93-46, of. 302 · Bogotá" />
                </label>
                <label className="block">
                  <span className="field-label">Teléfono</span>
                  <input value={m.firmPhone} onChange={(e) => poner('firmPhone', e.target.value)} className="field mt-1 w-full" placeholder="(601) 742 18 90" />
                </label>
              </div>
            </section>

            <section>
              <h3 className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Formato del escrito
              </h3>

              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="field-label">Tipografía</span>
                    <select value={m.fontFamily} onChange={(e) => poner('fontFamily', e.target.value as FirmBranding['fontFamily'])} className="field mt-1 w-full">
                      <option>Times New Roman</option>
                      <option>Arial</option>
                      <option>Calibri</option>
                      <option>Inter</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="field-label">Tamaño</span>
                    <select value={m.fontSizePt} onChange={(e) => poner('fontSizePt', Number(e.target.value))} className="field mt-1 w-full">
                      {[10, 11, 12, 13, 14].map((n) => (
                        <option key={n} value={n}>{n} pt</option>
                      ))}
                    </select>
                  </label>
                </div>

                <Radios etiqueta="Interlineado" valor={m.lineSpacing} opciones={[['1.0', '1,0'], ['1.5', '1,5'], ['2.0', '2,0']]} onChange={(v) => poner('lineSpacing', v as FirmBranding['lineSpacing'])} />
                <Radios etiqueta="Numeración de hechos" valor={m.factNumbering} opciones={[['ARABIGA', '1. 2. 3.'], ['ORDINAL', 'PRIMERO.']]} onChange={(v) => poner('factNumbering', v as FirmBranding['factNumbering'])} />
                <Radios etiqueta="Títulos de sección" valor={m.sectionTitles} opciones={[['ROMANOS', 'I. Romanos'], ['ARABIGOS', '1. Arábigos'], ['SIN_NUMERAR', 'Sin numerar']]} onChange={(v) => poner('sectionTitles', v as FirmBranding['sectionTitles'])} />

                {/* La numeración se impone al GENERAR: el texto ya escrito no se renumera. */}
                <p className="text-meta text-ink-400">
                  Numeración y títulos se aplican a los escritos que se generen desde ahora.
                </p>
              </div>
            </section>

            <section>
              <h3 className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Bloque de firma
              </h3>

              <div className="space-y-2.5">
                <label className="block">
                  <span className="field-label">T.P. del abogado que firma</span>
                  <input value={m.tpNumber} onChange={(e) => poner('tpNumber', e.target.value)} className="field mt-1 w-full font-mono" placeholder="214.882 del C.S.J." />
                </label>
                <label className="block">
                  <span className="field-label">Correo de notificaciones judiciales</span>
                  <input value={m.firmEmail} onChange={(e) => poner('firmEmail', e.target.value)} className="field mt-1 w-full" placeholder="notificaciones@rcabogados.co" />
                </label>

                <div className="flex items-center gap-2">
                  {m.signatureImageUrl ? (
                    <img src={m.signatureImageUrl} alt="Firma" className="h-[34px] rounded border border-line-200 bg-white object-contain px-1" />
                  ) : (
                    <span className="text-meta text-ink-400">Sin imagen de firma</span>
                  )}
                  <label className="btn-neutral btn-sm cursor-pointer">
                    <Upload className="h-3 w-3" />
                    {m.signatureImageUrl ? 'Reemplazar' : 'Firma escaneada'}
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={subirImagen('signatureImageUrl')} />
                  </label>
                  {m.signatureImageUrl && (
                    <button onClick={() => poner('signatureImageUrl', null)} className="btn-neutral btn-sm">
                      <XIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* ─── LA PREVISUALIZACIÓN · un escrito real ─────────────────────── */}
          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Previsualización · escrito real
              </span>
              <span className="chip-neutral">Manda sobre el defecto</span>
            </div>

            <div
              className="rounded-card border border-line-200 bg-white px-8 py-7 text-black shadow-e1"
              style={{
                fontFamily: `'${m.fontFamily}', serif`,
                fontSize: `${m.fontSizePt}px`,
                lineHeight: m.lineSpacing === '1.0' ? 1.35 : m.lineSpacing === '1.5' ? 1.7 : 2.1
              }}
            >
              {/* Membrete */}
              <div className="mb-4 flex items-center gap-3 border-b border-black/20 pb-2">
                {m.logoUrl && <img src={m.logoUrl} alt="" className="h-[42px] object-contain" />}
                <div className="min-w-0">
                  <p className="font-bold uppercase tracking-wide">{m.firmName || 'RAZÓN SOCIAL DE LA FIRMA'}</p>
                  <p style={{ fontSize: `${m.fontSizePt - 2}px` }}>NIT {m.firmNit || '—'}</p>
                </div>
              </div>

              <p className="font-bold">JUZGADO TREINTA Y CUATRO (34) ADMINISTRATIVO DEL CIRCUITO DE BOGOTÁ</p>
              <p className="mt-2">Referencia: Nulidad y restablecimiento del derecho</p>
              <p>Demandante: Jorge Elías Mosquera Rentería</p>

              <p className="mt-4 font-bold">
                {m.sectionTitles === 'ROMANOS' ? 'I. PRETENSIONES' : m.sectionTitles === 'ARABIGOS' ? '1. PRETENSIONES' : 'PRETENSIONES'}
              </p>
              <p className="mt-1 text-justify">
                Solicito al despacho declarar la nulidad de la Resolución 8842 del 12 de noviembre
                de 2024, expedida por Colpensiones, y, a título de restablecimiento del derecho,
                ordenar el reconocimiento y pago retroactivo de la prestación.
              </p>

              <p className="mt-4 font-bold">
                {m.sectionTitles === 'ROMANOS' ? 'II. HECHOS' : m.sectionTitles === 'ARABIGOS' ? '2. HECHOS' : 'HECHOS'}
              </p>
              <p className="mt-1 text-justify">
                {m.factNumbering === 'ORDINAL' ? 'PRIMERO.' : '1.'} La Junta Regional de
                Calificación de Invalidez dictaminó una pérdida de capacidad laboral del 62,3%.
              </p>

              {/* Bloque de firma */}
              <p className="mt-5">Atentamente,</p>
              {m.signatureImageUrl && <img src={m.signatureImageUrl} alt="" className="mt-1 h-[38px] object-contain" />}
              <p className="mt-1 font-bold">Camila Restrepo Vélez</p>
              <p style={{ fontSize: `${m.fontSizePt - 2}px` }}>
                C.C. 52.418.907{m.tpNumber ? ` · T.P. ${m.tpNumber}` : ''}
              </p>
              {m.firmEmail && <p style={{ fontSize: `${m.fontSizePt - 2}px` }}>{m.firmEmail}</p>}

              {/* Pie */}
              {(m.firmAddress || m.firmPhone) && (
                <p className="mt-5 border-t border-black/20 pt-1.5 text-center" style={{ fontSize: `${m.fontSizePt - 3}px` }}>
                  {[m.firmAddress, m.firmPhone].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            {/* La previsualización es SIEMPRE en papel blanco: es lo que se exporta. */}
            <p className="mt-1.5 text-center text-meta text-ink-400">
              Sobre papel blanco a propósito: así sale el .docx y el PDF, esté la aplicación en el
              tema que esté.
            </p>
          </div>
        </div>
      )}
    </Dialog>
  );
};

/** Radio en línea: etiqueta a la izquierda, opciones como pastillas. */
const Radios: React.FC<{
  etiqueta: string;
  valor: string;
  opciones: Array<[string, string]>;
  onChange: (v: string) => void;
}> = ({ etiqueta, valor, opciones, onChange }) => (
  <div>
    <span className="field-label">{etiqueta}</span>
    <div className="mt-1 flex flex-wrap gap-1.5">
      {opciones.map(([v, texto]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-control border px-2.5 py-1 text-[12px] font-medium ${
            valor === v
              ? 'border-brand-700 bg-brand-50 text-brand-700'
              : 'border-line-200 bg-canvas text-ink-700 hover:border-brand-700'
          }`}
        >
          {texto}
        </button>
      ))}
    </div>
  </div>
);
