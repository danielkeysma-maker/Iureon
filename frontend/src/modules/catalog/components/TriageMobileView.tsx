import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  IconoNoAplica,
  IconoSinVerificar,
  IconoVerificado
} from '../../../design/ArtboardIcons';
import { triageApi, type TriageResponse } from '../services/catalog.api';
import { BRANCH_LABELS } from '../branchLabels';
import type { Actuacion } from '../types';

/**
 * Orientación en móvil. Artboard 4d, con las medidas COPIADAS de su HTML.
 *
 * ─── LO QUE DICE LA MAQUETA, CITADO ─────────────────────────────────────────
 *
 *     contenedor:  padding:14px 16px; gap:10px
 *     tarjeta:     border:1px solid #E3E7EC; border-radius:8px; padding:12px 14px
 *     borde izq.:  3px — #14653F verificada · #4A566B no caduca · #8A5A12 sin verificar
 *     título:      600 14px/1.35 #101822, con el ícono de estado a la derecha
 *     banda:       gap:10px; padding:9px 11px; background:#F7F8FA; radius:6
 *                  rótulo 600 9.5px MONO tracking .1em · valor 600 15px MONO
 *     artículo:    400 12px/1.5 MONO #667487
 *     primario:    100% × 44px, 600 13.5px, blanco sobre #17456B, radius 6
 *     secundario:  500 13.5px #17456B sobre blanco con borde #CBD9E4
 *
 * Todos esos colores ya son tokens: verified, neutral-fact, unverified, ink-900,
 * ink-500, line-200, canvas, brand-700, brand-line.
 *
 * ─── EL BORDE IZQUIERDO ES LA REDUNDANCIA DEL SISTEMA, NO ADORNO ────────────
 *
 * En pantalla pequeña el estado tiene que leerse sin depender del color: por eso
 * la maqueta pone además el ÍCONO junto al título y, en la que no está
 * catalogada, un fondo RAYADO y un borde punteado. Tres señales distintas para
 * el mismo hecho, que es la regla de este sistema — el estado nunca viaja solo
 * en color.
 *
 * ─── UN SOLO PRIMARIO ───────────────────────────────────────────────────────
 *
 * Solo la primera tarjeta —término más corto y verificada— lleva el botón
 * relleno; las demás quedan en secundario. Seis primarios equivalen a ninguno,
 * y aquí lo que ordena la lista es el reloj: lo que se vence primero va primero.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · «VENCE · 3 may 2025». Calcular la fecha exige saber DESDE CUÁNDO corre el
 *   término —la notificación, el despido, la estructuración— y eso no está en
 *   unos hechos escritos en prosa. Una fecha de vencimiento inventada es lo más
 *   peligroso que esta pantalla podría mostrar, así que la banda trae solo el
 *   plazo, a todo el ancho. Es la misma decisión que ya tomó la de escritorio.
 * · El historial de consultas. Es de la pantalla grande: en el teléfono se
 *   orienta un caso que se tiene delante, no se revisa lo de la semana pasada.
 */

const MINIMO = 40;

type Estado = 'VERIFICADO' | 'NO_CADUCA' | 'NO_VERIFICADO';

const BORDE: Record<Estado, string> = {
  VERIFICADO: 'rgb(var(--verified))',
  NO_CADUCA: 'rgb(var(--neutral-fact))',
  NO_VERIFICADO: 'rgb(var(--unverified))'
};

const ICONO: Record<Estado, React.FC<{ className?: string; strokeWidth?: number }>> = {
  VERIFICADO: IconoVerificado,
  NO_CADUCA: IconoNoAplica,
  NO_VERIFICADO: IconoSinVerificar
};

const TINTA: Record<Estado, string> = {
  VERIFICADO: 'text-verified',
  NO_CADUCA: 'text-neutral-fact',
  NO_VERIFICADO: 'text-unverified'
};

/** Los mismos milímetros para las tres tarjetas: 12px 14px, radio 8, borde 3. */
const Tarjeta: React.FC<{ estado: Estado; children: React.ReactNode; rayada?: boolean }> = ({
  estado,
  children,
  rayada
}) => (
  <article
    className={`rounded-[8px] px-3.5 py-3 ${
      rayada
        ? 'border border-dashed border-[rgb(var(--unverified-line))]'
        : 'border border-line-200 bg-surface'
    }`}
    style={{
      borderLeft: `3px solid ${BORDE[estado]}`,
      /*
       * EL RAYADO DE LA MAQUETA, CON DOS TONOS OPACOS Y NO CON ALFA.
       *
       * 5d es explícito: «la trama diagonal del sin verificar se rehace con los
       * dos tonos oscuros en vez de aclararse — la textura se conserva, el
       * brillo no». Con transparencia el resultado depende de lo que haya
       * detrás, así que la misma tarjeta se veía distinta sobre el lienzo que
       * sobre una superficie, y en oscuro se aclaraba justo lo que debía
       * oscurecerse.
       *
       * `color-mix` da el tono claro MEZCLANDO el ámbar con la superficie del
       * tema: opaco, y sigue al modo oscuro sin fijar hexadecimales.
       */
      ...(rayada
        ? {
            background:
              'repeating-linear-gradient(135deg, color-mix(in srgb, rgb(var(--unverified-surf)) 50%, rgb(var(--surface))) 0 6px, rgb(var(--unverified-surf)) 6px 12px)'
          }
        : {})
    }}
  >
    {children}
  </article>
);

interface TriageMobileViewProps {
  /*
   * Convierte una sugerencia en borrador SIN volver a escribir los hechos: el
   * abogado ya los escribio aqui, y pedirlos otra vez convierte un flujo de dos
   * pantallas en dos transcripciones de la misma historia — la segunda siempre
   * mas corta que la primera.
   *
   * El nombre viaja TAL CUAL vino del catalogo: es el contrato con el motor de
   * redaccion, y cualquier otra cadena resuelve a una plantilla generica.
   */
  onDraft: (actuacionName: string, branch: string, hechos: string) => void;
}

export const TriageMobileView: React.FC<TriageMobileViewProps> = ({ onDraft }) => {
  const [hechos, setHechos] = React.useState('');
  const [cargando, setCargando] = React.useState(false);
  const [resultado, setResultado] = React.useState<TriageResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const orientar = async () => {
    if (hechos.trim().length < MINIMO || cargando) return;
    setCargando(true);
    setError(null);
    try {
      setResultado(await triageApi.orientar(hechos.trim()));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo orientar.');
    } finally {
      setCargando(false);
    }
  };

  const sugerencias = resultado?.status === 'OK' ? resultado.suggestions : [];
  const faltan = Math.max(0, MINIMO - hechos.trim().length);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-canvas">
      <div className="flex flex-col gap-2.5 px-4 py-3.5">
        {/* La tarjeta de los hechos: 12px 14px, rótulo 600 12px, prosa 13/1.6. */}
        <section className="rounded-[8px] border border-line-200 bg-surface px-3.5 py-3">
          <h2 className="text-[12px] font-semibold text-ink-700">Los hechos</h2>
          <textarea
            value={hechos}
            onChange={(e) => setHechos(e.target.value)}
            rows={4}
            placeholder="Despido sin justa causa el 3 de febrero, estando incapacitado y sin permiso del inspector."
            className="mt-1.5 w-full resize-none border-0 bg-transparent p-0 text-[13px] leading-[1.6] text-ink-700 placeholder:text-ink-400 focus:outline-none"
          />

          {resultado?.senales && (
            <div className="mt-2 flex flex-wrap gap-[5px]">
              {[
                resultado.senales.rama ? BRANCH_LABELS[resultado.senales.rama] ?? resultado.senales.rama : null,
                ...(resultado.senales.elementos ?? [])
              ]
                .filter(Boolean)
                .map((chip) => (
                  <span
                    key={chip as string}
                    className="rounded-full border border-line-200 bg-canvas px-2 py-0.5 text-[11.5px] text-ink-700"
                  >
                    {chip}
                  </span>
                ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => void orientar()}
            disabled={faltan > 0 || cargando}
            className="btn-primary mt-3 h-11 w-full disabled:opacity-50"
          >
            {cargando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Orientando…
              </>
            ) : (
              'Orientar'
            )}
          </button>
          {faltan > 0 && (
            <p className="mt-1.5 text-[11px] text-ink-500">
              Faltan {faltan} caracteres: con menos, el catálogo no tiene con qué proponer.
            </p>
          )}
        </section>

        {error && (
          <p className="rounded-[8px] border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.06)] px-3.5 py-3 text-[12px] leading-snug text-danger">
            {error}
          </p>
        )}

        {resultado?.status === 'SIN_COINCIDENCIA' && (
          <section className="rounded-[8px] border border-line-200 bg-surface px-3.5 py-3">
            <h2 className="text-[13px] font-semibold text-ink-900">
              El catálogo no reconoce una actuación para estos hechos
            </h2>
            <p className="mt-1.5 text-justify text-[12px] leading-snug text-ink-500 [text-wrap:pretty]">
              No es un error: ninguna de las actuaciones verificadas encaja con lo descrito. Puede
              ser una materia que aún no catalogamos, o puede faltar un dato que define la vía.
            </p>
            {resultado.preguntas && resultado.preguntas.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {resultado.preguntas.map((p, i) => (
                  <li key={p} className="flex gap-2 text-[12px] leading-snug text-ink-700">
                    <span className="shrink-0 font-mono text-[10px] text-ink-400">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-justify [text-wrap:pretty]">{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {sugerencias.length > 0 && (
          <>
            {/* El rótulo con su filete, como en el HTML. */}
            <div className="flex items-center gap-[7px]">
              <span className="shrink-0 font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Término más corto primero
              </span>
              <div className="h-px flex-1 bg-line-200" />
            </div>

            {sugerencias.map(({ actuacion, razon }, i) => {
              const a = actuacion as Actuacion;
              const estado = a.term.status as Estado;
              const Icono = ICONO[estado];
              /*
               * SOLO LA PRIMERA VERIFICADA LLEVA EL PRIMARIO. Seis rellenos
               * equivalen a ninguno, y lo que ordena la lista es el reloj.
               */
              const esPrimario = i === 0 && estado !== 'NO_VERIFICADO';

              return (
                <Tarjeta key={a.id} estado={estado} rayada={estado === 'NO_VERIFICADO'}>
                  <div className="flex items-start gap-2">
                    <h3 className="min-w-0 flex-1 text-[14px] font-semibold leading-[1.35] text-ink-900">
                      {a.exactName}
                    </h3>
                    <Icono
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${TINTA[estado]}`}
                      strokeWidth={2.6}
                    />
                  </div>

                  {estado === 'NO_VERIFICADO' ? (
                    <p className="mt-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-unverified">
                      Sin verificar · el término no está comprobado
                    </p>
                  ) : (
                    <div className="mt-2.5 rounded-[6px] bg-canvas px-[11px] py-[9px]">
                      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                        Término
                      </p>
                      <p className="mt-0.5 font-mono text-[15px] font-semibold leading-tight text-ink-900">
                        {estado === 'NO_CADUCA' ? 'No aplica término' : a.term.description}
                      </p>
                    </div>
                  )}

                  <p className="mt-2 font-mono text-[12px] leading-[1.5] text-ink-500">
                    {a.legalBasis}
                  </p>

                  {razon && (
                    <p className="mt-1.5 text-justify text-[11.5px] italic leading-snug text-ink-500 [text-wrap:pretty]">
                      {razon}
                    </p>
                  )}

                  {estado !== 'NO_VERIFICADO' && (
                    <button
                      type="button"
                      onClick={() => onDraft(a.exactName, a.branch, hechos.trim())}
                      className={`mt-[11px] h-11 w-full rounded-[6px] text-[13.5px] ${
                        esPrimario
                          ? 'bg-brand-700 font-semibold text-on-brand'
                          : 'border border-brand-line bg-surface font-medium text-brand-700'
                      }`}
                    >
                      Redactar esta
                    </button>
                  )}
                </Tarjeta>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
