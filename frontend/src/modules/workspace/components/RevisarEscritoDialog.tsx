import React from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Copy, FileText, UploadCloud, X } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { ApiError } from '../../../config/httpClient';
import { archivoABase64, reviewApi, type RespuestaDeRevision } from '../services/review.api';
import { uploadFileToStorage } from '../../documents/services/storageUpload';

/**
 * Revisar un escrito ya redactado.
 *
 * ─── QUÉ ES ─────────────────────────────────────────────────────────────────
 *
 * El abogado sube la tutela, la demanda o el recurso que ya escribió y
 * pregunta lo que quiera: debilidades, fortalezas, qué aplicó mal. La
 * respuesta es un informe, no un borrador; el escrito no se reescribe.
 *
 * ─── POR QUÉ VALE MÁS QUE UN CHAT ───────────────────────────────────────────
 *
 * La revisión se hace contra la ficha verificada de la actuación elegida
 * arriba. Lo objetivo —qué secciones exige la norma y cuáles faltan— sale del
 * catálogo; lo valorativo, del modelo. El informe los separa, y la cabecera
 * dice si hubo ficha o no, porque sin ficha lo objetivo pierde respaldo.
 *
 * ─── EL DOCUMENTO NO SE GUARDA ──────────────────────────────────────────────
 *
 * Ni el archivo, ni el texto, ni el informe quedan en el servidor. Si el
 * abogado quiere conservar el informe, lo copia. Es su trabajo, leído una vez.
 */

interface RevisarEscritoDialogProps {
  abierto: boolean;
  onCerrar: () => void;
  documentType: string;
  legalBranch: string;
  precioCop: number;
  /** Avisa a quien pinta el saldo que hubo un cobro: el saldo se reporta, nunca se deriva. */
  onSaldoCambiado?: () => void;
}

/*
 * 15 MB: una tutela con sus anexos escaneados. Hasta EN_CUERPO el archivo viaja
 * dentro del JSON (un viaje, sin almacenamiento); por encima, Vercel no acepta
 * el cuerpo y el archivo sube directo a B2 como el audio de las audiencias: el
 * servidor lo lee desde ahi y lo borra antes de responder.
 */
const MAX_BYTES = 15 * 1024 * 1024;
const EN_CUERPO = 3_500_000;
const pesos = (n: number): string => `$${Math.round(n).toLocaleString('es-CO')}`;

const SUGERENCIAS = [
  'Señale debilidades, fortalezas, qué está mal aplicado y qué corregiría antes de presentarlo.',
  '¿La petición es concreta y ejecutable? ¿Qué le falta al escrito frente a lo que exige la norma?',
  '¿Los hechos sostienen las pretensiones? ¿Dónde flaquea la argumentación?'
];

export const RevisarEscritoDialog: React.FC<RevisarEscritoDialogProps> = ({
  abierto,
  onCerrar,
  documentType,
  legalBranch,
  precioCop,
  onSaldoCambiado
}) => {
  const [archivo, setArchivo] = React.useState<File | null>(null);
  const [texto, setTexto] = React.useState('');
  const [pregunta, setPregunta] = React.useState(SUGERENCIAS[0]);
  const [ocupado, setOcupado] = React.useState(false);
  const [error, setError] = React.useState('');
  const [respuesta, setRespuesta] = React.useState<RespuestaDeRevision | null>(null);
  const [copiado, setCopiado] = React.useState(false);
  /** Porcentaje de subida cuando el archivo va por almacenamiento; null si no aplica. */
  const [subiendo, setSubiendo] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (abierto) return;
    setArchivo(null);
    setTexto('');
    setPregunta(SUGERENCIAS[0]);
    setError('');
    setRespuesta(null);
    setOcupado(false);
  }, [abierto]);

  const hayEscrito = archivo !== null || texto.trim().length > 0;
  const sinActuacion = !documentType || /^elegir/i.test(documentType);

  const elegirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError('El archivo supera 15 MB. Quite los anexos o pegue el texto del escrito.');
      return;
    }
    setError('');
    setArchivo(f);
  };

  const revisar = async () => {
    if (!hayEscrito || ocupado) return;
    setOcupado(true);
    setError('');
    setRespuesta(null);
    try {
      let cuerpo: { fileName: string; contentBase64?: string; storageKey?: string; texto?: string };
      if (!archivo) {
        cuerpo = { fileName: 'texto-pegado.txt', texto };
      } else if (archivo.size <= EN_CUERPO) {
        cuerpo = { fileName: archivo.name, contentBase64: await archivoABase64(archivo) };
      } else {
        setSubiendo(0);
        const storageKey = await uploadFileToStorage(archivo, 'revisiones', setSubiendo, 'el escrito');
        setSubiendo(null);
        cuerpo = { fileName: archivo.name, storageKey };
      }
      setRespuesta(await reviewApi.revisar({ documentType, legalBranch, pregunta, ...cuerpo }));
      onSaldoCambiado?.();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'No se pudo revisar el escrito.');
    } finally {
      setOcupado(false);
      setSubiendo(null);
    }
  };

  const textoDelInforme = (): string => {
    if (!respuesta) return '';
    if (!respuesta.informe) return respuesta.informeLibre ?? '';
    const i = respuesta.informe;
    const bloque = (t: string, xs: string[]) => (xs.length ? `${t}\n${xs.map((x) => `- ${x}`).join('\n')}\n` : '');
    return [
      `REVISIÓN · ${documentType}`,
      '',
      i.resumen,
      '',
      bloque('SECCIONES QUE LA NORMA EXIGE Y FALTAN', i.seccionesFaltantes),
      bloque('FORTALEZAS', i.fortalezas),
      bloque('DEBILIDADES', i.debilidades),
      i.erroresDeAplicacion.length
        ? `ERRORES DE APLICACIÓN\n${i.erroresDeAplicacion.map((e) => `- ${e.donde}: ${e.problema} → ${e.correccion}`).join('\n')}\n`
        : '',
      bloque('RECOMENDACIONES', i.recomendaciones)
    ]
      .filter((s) => s !== '')
      .join('\n');
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(textoDelInforme());
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1600);
    } catch {
      setError('No se pudo copiar. Seleccione el texto y cópielo a mano.');
    }
  };

  return (
    <Dialog
      abierto={abierto}
      onCerrar={ocupado ? () => undefined : onCerrar}
      tamano="L"
      titulo="Revisar un escrito"
      subtitulo={
        sinActuacion
          ? 'Elija primero la actuación arriba: la revisión objetiva se hace contra su ficha.'
          : `Contra la ficha de «${documentType}» · el documento no se guarda`
      }
      hayCambiosSinGuardar={ocupado}
      onIntentoDeCerrarConCambios={() => undefined}
      pieIzquierda={
        <span className="font-mono text-[11px] text-ink-400">
          {respuesta ? `Cobrado ${pesos(respuesta.cobradoCop)} · saldo ${pesos(respuesta.saldoCop)}` : `Cuesta ${pesos(precioCop)}`}
        </span>
      }
      acciones={
        respuesta ? (
          <>
            <button type="button" onClick={() => setRespuesta(null)} className="btn-neutral btn-sm">
              Revisar otro
            </button>
            <button type="button" onClick={() => void copiar()} className="btn-primary btn-sm">
              <Copy className="h-3.5 w-3.5" />
              {copiado ? 'Copiado' : 'Copiar informe'}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onCerrar} className="btn-neutral btn-sm" disabled={ocupado}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void revisar()}
              disabled={!hayEscrito || ocupado || sinActuacion}
              className="btn-primary btn-sm disabled:opacity-50"
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              {ocupado ? (subiendo !== null ? `Enviando · ${subiendo}%` : 'Revisando…') : `Revisar · ${pesos(precioCop)}`}
            </button>
          </>
        )
      }
    >
      {!respuesta ? (
        <div className="space-y-4">
          {/* ─── EL ESCRITO: archivo o texto ─────────────────────────────── */}
          <div>
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">El escrito</p>
            {archivo ? (
              <div className="mt-1.5 flex items-center gap-2 rounded-control border border-line-200 bg-canvas px-3 py-2">
                <FileText className="h-4 w-4 shrink-0 text-ink-400" />
                <span className="min-w-0 flex-1 truncate text-ui text-ink-900">{archivo.name}</span>
                <span className="shrink-0 font-mono text-[11px] text-ink-400">{(archivo.size / 1024).toFixed(0)} KB</span>
                <button type="button" onClick={() => setArchivo(null)} className="text-ink-400 hover:text-danger" aria-label="Quitar archivo">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-control border border-dashed border-line-200 bg-canvas py-3 hover:bg-brand-50">
                  <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={elegirArchivo} className="hidden" />
                  <UploadCloud className="h-4 w-4 text-ink-400" />
                  <span className="text-meta font-medium text-ink-500">Subir PDF, Word o texto (hasta 15 MB, con anexos)</span>
                </label>
                <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-400">o pegue el texto</p>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={6}
                  placeholder="Pegue aquí el texto completo del escrito…"
                  className="field-area mt-1.5 w-full resize-y"
                />
              </>
            )}
            <p className="mt-1.5 text-[11px] leading-snug text-ink-500">
              Un PDF escaneado no trae texto: si el archivo es una imagen, pegue el texto. Se revisan hasta 300.000 caracteres, unas 75 páginas;
              lo que pase de ahí se declara recortado.
            </p>
          </div>

          {/* ─── LA PREGUNTA ─────────────────────────────────────────────── */}
          <div>
            <label htmlFor="pregunta-revision" className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
              Qué quiere saber
            </label>
            <textarea
              id="pregunta-revision"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              rows={2}
              className="field-area mt-1.5 w-full resize-none"
            />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPregunta(s)}
                  className={`rounded-control border px-2 py-1 text-left text-[11px] leading-snug ${
                    pregunta === s ? 'border-brand-700 bg-brand-50 text-brand-700' : 'border-line-200 bg-canvas text-ink-700 hover:border-brand-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/*
            POR QUE EL BOTON ESTA APAGADO, escrito junto a lo que falta. El
            usuario adjunto el PDF, escribio la pregunta y el boton siguio gris:
            faltaba la actuacion, que se elige ARRIBA, fuera del dialogo, y el
            subtitulo que lo decia paso inadvertido. Un boton mudo se lee como
            un defecto; un boton que dice que le falta se obedece.
          */}
          {!error && sinActuacion && (
            <p className="rounded-control border border-line-200 bg-canvas px-3 py-2 text-[12px] leading-snug text-ink-900">
              <span className="font-semibold">Falta elegir la actuación.</span> Está en la barra de arriba, en «Elegir
              actuación…», después de la rama. La revisión objetiva se hace contra la ficha verificada de esa actuación; sin
              ella no hay contra qué revisar.
            </p>
          )}
          {!error && !sinActuacion && !hayEscrito && (
            <p className="text-[12px] leading-snug text-ink-500">Suba el archivo o pegue el texto para habilitar el botón.</p>
          )}
          {error && <p className="text-[12px] leading-snug text-danger">{error}</p>}

          <p className="text-meta text-ink-400">
            El informe no cita sentencias: cuando un punto necesite precedente, lo dirá y usted lo verifica. No reescribe el escrito;
            señala y propone la corrección.
          </p>
        </div>
      ) : (
        <Informe respuesta={respuesta} documentType={documentType} />
      )}
    </Dialog>
  );
};

/* ─── EL INFORME ──────────────────────────────────────────────────────────── */

const Seccion: React.FC<{ titulo: string; items: string[]; tono?: 'ok' | 'aviso' | 'neutro' }> = ({ titulo, items, tono = 'neutro' }) => {
  if (items.length === 0) return null;
  const Icono = tono === 'ok' ? CheckCircle2 : tono === 'aviso' ? AlertTriangle : null;
  return (
    <section>
      <h4 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">{titulo}</h4>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-ui leading-snug text-ink-900">
            {Icono ? (
              <Icono className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tono === 'ok' ? 'text-verified' : 'text-danger'}`} />
            ) : (
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-400" />
            )}
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

const Informe: React.FC<{ respuesta: RespuestaDeRevision; documentType: string }> = ({ respuesta, documentType }) => {
  const i = respuesta.informe;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
        <span className={`rounded-control border px-2 py-0.5 ${respuesta.conFicha ? 'border-line-200 text-verified' : 'border-line-200 text-ink-500'}`}>
          {respuesta.conFicha ? `Revisado contra la ficha de «${documentType}»` : 'Sin ficha verificada: lo objetivo va con menos respaldo'}
        </span>
        <span>{respuesta.caracteres.toLocaleString('es-CO')} caracteres{respuesta.truncado ? ' · recortado a 300.000' : ''}</span>
      </div>

      {!i ? (
        <pre className="whitespace-pre-wrap font-sans text-ui leading-relaxed text-ink-900">{respuesta.informeLibre}</pre>
      ) : (
        <>
          <p className="text-[14px] leading-relaxed text-ink-900">{i.resumen}</p>
          <Seccion titulo="Secciones que la norma exige y faltan" items={i.seccionesFaltantes} tono="aviso" />
          <Seccion titulo="Fortalezas" items={i.fortalezas} tono="ok" />
          <Seccion titulo="Debilidades" items={i.debilidades} tono="aviso" />
          {i.erroresDeAplicacion.length > 0 && (
            <section>
              <h4 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">Errores de aplicación</h4>
              <div className="mt-1.5 space-y-2">
                {i.erroresDeAplicacion.map((e, k) => (
                  <div key={k} className="rounded-control border border-line-200 bg-canvas px-3 py-2">
                    <p className="font-mono text-[10.5px] font-semibold text-ink-500">{e.donde}</p>
                    <p className="mt-0.5 text-ui leading-snug text-ink-900">{e.problema}</p>
                    {e.correccion && <p className="mt-1 text-ui leading-snug text-brand-700">Corrección: {e.correccion}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
          <Seccion titulo="Recomendaciones" items={i.recomendaciones} />
        </>
      )}

      <p className="border-t border-line-100 pt-3 text-meta text-ink-400">
        Lo marcado como exigencia de la norma sale de la ficha verificada; lo demás es criterio profesional del revisor y usted decide.
        Este informe no se guarda: cópielo si quiere conservarlo.
      </p>
    </div>
  );
};
