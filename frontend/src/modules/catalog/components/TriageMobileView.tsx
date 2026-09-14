import React from 'react';
import { AlertTriangle, FileText, Loader2, Paperclip, X } from 'lucide-react';
import {
  IconoNoAplica,
  IconoSinVerificar,
  IconoVerificado
} from '../../../design/ArtboardIcons';
import { AvisoDePlazoEnElAdjunto } from './AvisoDePlazoEnElAdjunto';
import { SelectorDeExpediente } from '../../expedientes/components/SelectorDeExpediente';
import { ARCHIVOS_DE_HECHOS, useHechosDesdeArchivo } from '../hechosDesdeArchivo';
import { triageApi, type TriageResponse } from '../services/catalog.api';
import { BRANCH_LABELS } from '../branchLabels';
import { PanelDeInstruccion } from './PanelDeInstruccion';
import type { Actuacion } from '../types';

/**
 * Orientación en móvil. Artboard 5 (375 px) de `public/handoff/app-orientacion.html`,
 * con la piel en `design/cara-nueva.css` bajo `.cara-nueva .cn-ori-*`.
 *
 * ─── LO QUE SE TOMÓ DE LA MAQUETA ───────────────────────────────────────────
 *
 *     título 28/34 · bajada 16/24 · campo gris sin contorno, radio 14, 16/26
 *     botón de orientar 52 px de alto, radio 14 · objetivos táctiles ≥ 44 px
 *     nada por debajo de 14 px · mono solo en la norma y el término
 *
 * ─── LO QUE NO SE TOMÓ, con la razón ────────────────────────────────────────
 *
 * · «Consultas parecidas de su firma». No hay búsqueda por parecido en el
 *   servidor; pintar dos filas «parecidas» sería inventarlas.
 * · «Dónde buscar» (una rama o todas). La orientación no ofrece ese control.
 * · El precio en el botón. El cobro depende del cupo gratuito del día, que
 *   esta pantalla no conoce antes de consultar.
 * · El botón pegado abajo. La barra de pestañas de 62 px ya vive ahí, como en
 *   Inicio: un pie fijo la taparía o se le montaría encima.
 *
 * ─── EL ESTADO VIAJA EN TRES SEÑALES, NO EN COLOR ───────────────────────────
 *
 * En pantalla pequeña el estado tiene que leerse sin depender del color: una
 * barra de 3 px a la izquierda (sombra interior, que respeta el radio), el
 * ÍCONO junto al título y, en la que no está verificada, el BORDE DISCONTINUO.
 *
 * ─── UN SOLO PRIMARIO ───────────────────────────────────────────────────────
 *
 * Solo la primera tarjeta —término más corto y verificada— lleva el botón
 * relleno; las demás quedan en secundario. Seis primarios equivalen a ninguno,
 * y aquí lo que ordena la lista es el reloj: lo que se vence primero va primero.
 *
 * ─── LO QUE EL ARTBOARD ANTERIOR PEDÍA Y AQUÍ NO ESTÁ ───────────────────────
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

const BARRA: Record<Estado, string> = {
  VERIFICADO: 'cn-ori-barra--ok',
  NO_CADUCA: 'cn-ori-barra--neutro',
  NO_VERIFICADO: 'cn-ori-barra--sin cn-ori-tarjeta--sin'
};

const ICONO: Record<Estado, React.FC<{ className?: string; strokeWidth?: number }>> = {
  VERIFICADO: IconoVerificado,
  NO_CADUCA: IconoNoAplica,
  NO_VERIFICADO: IconoSinVerificar
};

const TINTA: Record<Estado, string> = {
  VERIFICADO: 'cn-ori-icono--ok',
  NO_CADUCA: 'cn-ori-icono--neutro',
  NO_VERIFICADO: 'cn-ori-icono--sin'
};

/* El nombre accesible del ícono: el estado no puede quedar solo en el dibujo. */
const NOMBRE: Record<Estado, string> = {
  VERIFICADO: 'Verificado',
  NO_CADUCA: 'No caduca',
  NO_VERIFICADO: 'Sin verificar'
};

/** Las mismas medidas para las tres tarjetas: relleno 16, radio 14, barra de 3. */
const Tarjeta: React.FC<{ estado: Estado; children: React.ReactNode }> = ({ estado, children }) => (
  <article className={`cn-ori-tarjeta cn-ori-tarjeta--movil ${BARRA[estado]}`}>{children}</article>
);

interface TriageMobileViewProps {
  /**
   * Lleva el documento adjuntado a «Revisiones», ya leido, para que lo lea la
   * pantalla que si extrae plazos. Se ofrece SOLO cuando el documento anuncia
   * un termino; ver `AvisoDePlazoEnElAdjunto`.
   *
   * OPCIONAL, Y SU AUSENCIA ES UNA RESPUESTA: quien monte esta pantalla sin
   * saber navegar a Revisiones ve el aviso sin boton, en vez de un boton que
   * no hace nada.
   */
  onLeerRecibido?: (texto: string, nombre: string) => void;

  /*
   * Convierte una sugerencia en borrador SIN volver a escribir los hechos: el
   * abogado ya los escribio aqui, y pedirlos otra vez convierte un flujo de dos
   * pantallas en dos transcripciones de la misma historia — la segunda siempre
   * mas corta que la primera.
   *
   * El nombre viaja TAL CUAL vino del catalogo: es el contrato con el motor de
   * redaccion, y cualquier otra cadena resuelve a una plantilla generica.
   */
  /*
   * `instruccion` es lo que va al cuadro «Que debe hacer este escrito», APARTE
   * de los hechos. Puede llegar vacia: escoger una sugerencia es opcional.
   */
  onDraft: (actuacionName: string, branch: string, hechos: string, instruccion: string) => void;
}

export const TriageMobileView: React.FC<TriageMobileViewProps> = ({ onDraft, onLeerRecibido }) => {
  const [hechos, setHechos] = React.useState('');
  /*
   * DE QUE CASO SON ESTOS HECHOS. Opcional: quien orienta sobre un asunto que
   * todavia no es expediente lo deja vacio, que es el caso normal de esta
   * pantalla — se entra aqui justamente cuando no se sabe que es lo que se
   * tiene. Con caso escogido, la orientacion queda contada dentro de el.
   */
  const [expedienteId, setExpedienteId] = React.useState('');
  /*
   * ADJUNTAR, TAMBIÉN AQUÍ. En el teléfono es donde más pesa: nadie transcribe
   * un oficio con el pulgar. La regla del texto es la misma que en escritorio y
   * vive en el gancho compartido; lo que cambia es que aquí NO se arrastra —se
   * escoge del teléfono—, así que no hay zona de soltar.
   */
  const adjuntoHechos = useHechosDesdeArchivo(setHechos);
  const [cargando, setCargando] = React.useState(false);
  const [resultado, setResultado] = React.useState<TriageResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const orientar = async () => {
    if (hechos.trim().length < MINIMO || cargando) return;
    setCargando(true);
    setError(null);
    try {
      setResultado(await triageApi.orientar(hechos.trim(), undefined, expedienteId || undefined));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo orientar.');
    } finally {
      setCargando(false);
    }
  };

  const sugerencias = resultado?.status === 'OK' ? resultado.suggestions : [];

  /*
   * LA TARJETA CON EL PANEL DE INSTRUCCION ABIERTO. Una sola: en el telefono la
   * lista se recorre desplazando, y dos paneles abiertos con dos instrucciones a
   * medio escribir es como se lleva a Redaccion la de la ficha que no era. Se
   * cierra al llegar un resultado nuevo, o quedaria abierto sobre una actuacion
   * que ya no esta en la lista.
   */
  const [eligiendo, setEligiendo] = React.useState<string | null>(null);
  React.useEffect(() => {
    setEligiendo(null);
  }, [resultado]);
  const faltan = Math.max(0, MINIMO - hechos.trim().length);

  return (
    <div
      data-visita="vista-orientacion"
      className="cara-nueva cn-ori flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto"
    >
      <div className="cn-ori-movil-cuerpo">
        <header>
          <h1 className="cn-ori-h1">¿Qué actuación necesita?</h1>
          <p className="cn-ori-bajada">
            Cuente qué pasó y el catálogo propone candidatas con su término y su norma.
          </p>
        </header>

        <section className="cn-ori-form" aria-label="Los hechos del caso">
          <div>
            <label htmlFor="hechos-de-la-orientacion-movil" className="cn-ori-etiqueta">
              Los hechos
            </label>
            <textarea
              id="hechos-de-la-orientacion-movil"
              value={hechos}
              onChange={(e) => setHechos(e.target.value)}
              rows={5}
              placeholder="Cuente qué pasó, a quién y qué se busca. En lenguaje corriente."
              className="cn-ori-hechos"
            />
          </div>

          {/* El adjunto: una sola línea bajo el cuadro, sin robarle sitio. */}
          <div className="min-w-0">
            {adjuntoHechos.leyendo ? (
              /* Espera propia: la pantalla sigue viva mientras se lee el PDF. */
              <p className="cn-ori-adjunto-fila">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Leyendo el archivo…
              </p>
            ) : adjuntoHechos.adjunto ? (
              <div className="cn-ori-adjunto">
                <div className="cn-ori-adjunto-fila">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  {/*
                    Un nombre de archivo largo es una sola palabra: en 320px
                    partir por palabras no basta, la clase parte en cualquier
                    punto.
                  */}
                  <span className="cn-ori-adjunto-nombre">
                    {adjuntoHechos.adjunto.nombre}{' '}
                    <span className="cn-ori-adjunto-nota">
                      {adjuntoHechos.adjunto.caracteres} caracteres
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={adjuntoHechos.quitar}
                    aria-label="Quitar el archivo"
                    className="cn-ori-quitar"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                {adjuntoHechos.adjunto.recortado && (
                  <p className="cn-ori-adjunto-texto">
                    El documento es largo: se leyó el comienzo del documento.
                  </p>
                )}
                {adjuntoHechos.adjunto.plazo && (
                  <AvisoDePlazoEnElAdjunto
                    plazo={adjuntoHechos.adjunto.plazo}
                    onLeer={
                      onLeerRecibido && adjuntoHechos.adjunto
                        ? () => onLeerRecibido(adjuntoHechos.adjunto!.texto, adjuntoHechos.adjunto!.nombre)
                        : undefined
                    }
                  />
                )}
              </div>
            ) : (
              <label className="cn-ori-movil-adjuntar">
                <Paperclip className="h-4 w-4" aria-hidden="true" />
                <span className="min-w-0">Adjuntar el oficio o la demanda (PDF, Word o texto)</span>
                <input
                  type="file"
                  accept={ARCHIVOS_DE_HECHOS}
                  className="hidden"
                  onChange={(e) => {
                    void adjuntoHechos.leer(e.target.files?.[0]);
                    /* Sin esto, volver a escoger el MISMO archivo no dispara nada. */
                    e.target.value = '';
                  }}
                />
              </label>
            )}

            {adjuntoHechos.motivo && (
              /* No se pudo leer; lo escrito a mano sigue donde estaba. */
              <p className="cn-ori-aviso">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <span className="min-w-0">{adjuntoHechos.motivo}</span>
              </p>
            )}
          </div>

          {resultado?.senales && (
            <div className="cn-ori-chips">
              {[
                resultado.senales.rama ? BRANCH_LABELS[resultado.senales.rama] ?? resultado.senales.rama : null,
                ...(resultado.senales.elementos ?? [])
              ]
                .filter(Boolean)
                .map((chip) => (
                  <span key={chip as string} className="cn-ori-chip">
                    {chip}
                  </span>
                ))}
            </div>
          )}

          {/*
            EL CASO, OPCIONAL Y DESPUÉS DE LOS HECHOS. Ésta es la pantalla de
            quien NO sabe todavía qué tiene, así que pedirle el expediente
            antes de contar el caso sería pedirle lo que quizá no existe. Va
            debajo, y solo si la firma tiene expedientes.
          */}
          <div className="cn-ori-selector">
            <SelectorDeExpediente
              valor={expedienteId}
              onCambio={setExpedienteId}
              id="expediente-de-la-orientacion-movil"
              pie="La orientación queda contada dentro del caso. Déjelo vacío si el asunto todavía no es un expediente."
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => void orientar()}
              disabled={faltan > 0 || cargando}
              className="cn-ini-boton cn-ini-boton--primario cn-ori-orientar cn-ori-movil-orientar"
            >
              {cargando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Orientando…
                </>
              ) : (
                'Orientar'
              )}
            </button>
            {faltan > 0 && (
              <p className="cn-ori-adjunto-texto">
                Faltan {faltan} caracteres: con menos, el catálogo no tiene con qué proponer.
              </p>
            )}
          </div>
        </section>

        {error && (
          <p className="cn-error" role="alert">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span className="min-w-0">{error}</span>
          </p>
        )}

        {resultado?.status === 'SIN_COINCIDENCIA' && (
          <section className="cn-ori-estado cn-ori-estado--hueco">
            <h2 className="cn-ori-estado-titulo">
              El catálogo no reconoce una actuación para estos hechos
            </h2>
            <p className="cn-ori-estado-texto">
              No es un error: ninguna de las actuaciones verificadas encaja con lo descrito. Puede
              ser una materia que aún no catalogamos, o puede faltar un dato que define la vía.
            </p>
            {resultado.preguntas && resultado.preguntas.length > 0 && (
              <ul className="cn-ori-preguntas">
                {resultado.preguntas.map((p, i) => (
                  <li key={p}>
                    <span className="cn-ori-preguntas-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0">{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {sugerencias.length > 0 && (
          <>
            {/* El rótulo con su filete. */}
            <p className="cn-ori-movil-rotulo">Término más corto primero</p>

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
                <Tarjeta key={a.id} estado={estado}>
                  <div className="cn-ori-tarjeta-cabeza">
                    <h3 className="cn-ori-tarjeta-titulo">{a.exactName}</h3>
                    <span role="img" aria-label={NOMBRE[estado]} className="mt-1.5 shrink-0">
                      <Icono className={`h-4 w-4 ${TINTA[estado]}`} strokeWidth={2.6} />
                    </span>
                  </div>

                  {/*
                    Aquí la tarjeta no pinta la rama, así que sin esta línea la
                    ficha prestada se leería como propia de la rama elegida.
                  */}
                  {a.porRemision && <p className="cn-ori-tarjeta-remision">{a.porRemision.marca}</p>}

                  {estado === 'NO_VERIFICADO' ? (
                    <p className="cn-ori-sin-rotulo">Sin verificar · el término no está comprobado</p>
                  ) : (
                    <div className="cn-ori-banda">
                      <p className="cn-ori-banda-rotulo">Término</p>
                      <p className="cn-ori-banda-valor cn-ori-mono">
                        {estado === 'NO_CADUCA' ? 'No aplica término' : a.term.description}
                      </p>
                    </div>
                  )}

                  <p className="cn-ori-norma-movil cn-ori-mono">{a.legalBasis}</p>

                  {razon && <p className="cn-ori-razon">{razon}</p>}

                  {estado !== 'NO_VERIFICADO' && (
                    <button
                      type="button"
                      onClick={() => setEligiendo(eligiendo === a.id ? null : a.id)}
                      aria-expanded={eligiendo === a.id}
                      className={`cn-ini-boton cn-ori-redactar-movil ${
                        esPrimario ? 'cn-ini-boton--primario' : 'cn-ini-boton--suave'
                      }`}
                    >
                      Redactar esta
                    </button>
                  )}

                  {/*
                    PEGADO AL BOTON, y en el telefono eso pesa mas que en
                    escritorio: una tarjeta ocupa casi la pantalla, asi que un
                    panel montado al final de la lista responderia cientos de
                    pixeles bajo el pliegue y pareceria que el boton no hace
                    nada. Los margenes negativos devuelven el panel al borde de
                    la tarjeta, que trae su propio relleno.
                  */}
                  {eligiendo === a.id && (
                    <div className="cn-ori-panel">
                      <PanelDeInstruccion
                        movil
                        actuacion={a}
                        hechos={hechos}
                        onCancelar={() => setEligiendo(null)}
                        onLlevar={(instruccion) =>
                          onDraft(a.exactName, a.branch, hechos.trim(), instruccion)
                        }
                      />
                    </div>
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
