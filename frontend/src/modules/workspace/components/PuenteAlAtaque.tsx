import React from 'react';
import { PenLine, Sparkles } from 'lucide-react';
import { Combobox, type OpcionCombobox } from './Combobox';
import { GuiaEligeActuacionDialog } from './GuiaEligeActuacionDialog';
import { ActuacionPropiaDialog } from './ActuacionPropiaDialog';
import { useCatalogBranchesState } from '../../catalog/hooks/useCatalogBranches';
import { useActuacionLookup } from '../../catalog/hooks/useActuacion';
import { PanelDeInstruccion } from '../../catalog/components/PanelDeInstruccion';
import { sugerenciasDeInstruccion } from '../../catalog/instruccionSugerida';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import type { ActuacionRole } from '../../catalog/types';
import type { InformeDeDocumentoRecibido } from '../services/review.api';
import { flancosParaLaInstruccion, hechosParaLaGuia, puntosDeAtaqueDe } from '../services/ataque';

/**
 * DE «POR DÓNDE SE ATACA» A UN BORRADOR EMPEZADO.
 *
 * ─── QUÉ DEFECTO CIERRA ─────────────────────────────────────────────────────
 *
 * El informe de un documento recibido señalaba los flancos y ahí se acababa
 * todo. Dos cosas faltaban, y las dos las reportó el dueño del producto:
 *
 *   1. El pie con el botón hacia la guía de actuaciones SOLO existía en el
 *      diálogo de revisión. En el taller —que es donde el abogado vuelve a leer
 *      el informe días después, desde «Revisiones»— no había ningún botón. Por
 *      eso esta pieza es un componente propio y no un fragmento del diálogo:
 *      dos copias del mismo pie divergen en la primera palabra que alguien
 *      cambie en una sola de ellas, y aquí lo que divergiría es qué se le puede
 *      hacer a un auto que corre un término.
 *
 *   2. Escogida la actuación, el camino MORÍA en un párrafo. Se le decía al
 *      abogado el nombre de lo que procede y no había forma de redactarlo. El
 *      salto a Redacción es todo el propósito de haber leído el documento.
 *
 * ─── LA REGLA QUE GOBIERNA ESTA PANTALLA ────────────────────────────────────
 *
 * EL NOMBRE DE LA ACTUACIÓN LO DA EL CATÁLOGO Y LO ESCOGE UNA PERSONA. Aquí no
 * se propone ninguna, no se elige por nadie y no se escribe una línea de
 * derecho: la guía resuelve contra su lista cerrada, las candidatas se ven con
 * su ficha —término, artículo, autoridad— y el botón de redactar no aparece
 * hasta que alguien escogió.
 *
 * ─── QUÉ VIAJA A REDACCIÓN, Y POR QUÉ ESAS TRES COSAS ───────────────────────
 *
 * · La actuación y su rama, TAL CUAL las devolvió el catálogo: ese nombre es el
 *   contrato con el motor, y la rama viaja con él porque un mismo rótulo existe
 *   en dos ramas con plazos distintos.
 * · Los hechos, que son los del propio documento con los flancos por delante
 *   (`hechosParaLaGuia`), los mismos que ya se le contaron a la guía.
 * · Una instrucción SUGERIDA y editable. Las que salen de la ficha las arma el
 *   catálogo; la primera de la lista la arma este módulo con los flancos y sus
 *   citas, porque el escrito que viene ataca precisamente eso. Se escoge, se
 *   edita, o se sigue sin ninguna: obligar a escoger convertiría una ayuda en
 *   un peaje, que es la misma decisión que ya tomó Orientación.
 */

export interface PuenteAlAtaqueProps {
  informe: InformeDeDocumentoRecibido;
  /** El texto del documento leído: viaja a la guía como respaldo de los flancos. */
  textoDelDocumento: string;
  /** Con qué rama nace el selector. Vacía cuando no se sabe, que es lo normal aquí. */
  ramaInicial?: string;
  /** Quién firma. Solo se usa para poder escribir una actuación propia de la firma. */
  userRole: ActuacionRole;
  /**
   * Lleva la actuación escogida, su rama, los hechos y la instrucción a
   * Redacción. SIN ESTA FUNCIÓN EL SALTO NO SE OFRECE: un botón que no lleva a
   * ninguna parte enseña a desconfiar de los que sí llevan.
   */
  onRedactar?: (exactName: string, rama: string, hechos: string, instruccion: string) => void;
}

export const PuenteAlAtaque: React.FC<PuenteAlAtaqueProps> = ({
  informe,
  textoDelDocumento,
  ramaInicial = '',
  userRole,
  onRedactar
}) => {
  const puntos = puntosDeAtaqueDe(informe);
  const [rama, setRama] = React.useState(ramaInicial);
  /*
   * «NO SÉ LA RAMA», y aquí es donde más falta hace: el abogado acaba de recibir
   * un documento que no redactó él. Con la rama equivocada el catálogo responde
   * «no reconozco nada» sobre una actuación que existe dos ramas más allá.
   */
  const [sinRama, setSinRama] = React.useState(false);
  const [guiaAbierta, setGuiaAbierta] = React.useState(false);
  const [propiaAbierta, setPropiaAbierta] = React.useState(false);
  const [hechos, setHechos] = React.useState('');
  /** Lo que la guía propuso y una persona escogió, con la rama de la que salió. */
  const [elegida, setElegida] = React.useState<{ exactName: string; rama: string } | null>(null);
  const [panelAbierto, setPanelAbierto] = React.useState(false);

  const ramasEstado = useCatalogBranchesState();
  const opcionesRama: OpcionCombobox[] = React.useMemo(
    () => ramasEstado.ramas.map((b) => ({ valor: b, etiqueta: BRANCH_LABELS[b] ?? b })),
    [ramasEstado.ramas]
  );

  const abrirLaGuia = () => {
    /*
     * LOS HECHOS SON LO QUE HALLÓ EL INFORME, Y DEBAJO EL TEXTO DEL DOCUMENTO.
     * Se componen aquí y no en cada llamador, para que el taller y el diálogo
     * le cuenten a la guía exactamente lo mismo.
     */
    setHechos(hechosParaLaGuia(informe, textoDelDocumento));
    setGuiaAbierta(true);
  };

  return (
    <section className="rounded-card border border-[rgb(var(--brand-line))] bg-brand-50 px-3 py-3 [overflow-wrap:anywhere]">
      <h4 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-brand-700">
        {puntos.length > 0 ? '¿Y con qué lo ataco?' : '¿Y qué puedo hacer?'}
      </h4>
      <p className="mt-1 text-[12px] leading-snug text-ink-700 text-justify [text-wrap:pretty]">
        {puntos.length > 0
          ? 'El nombre de la actuación no lo pone este informe: lo pone el catálogo. Los flancos de arriba, con sus citas, viajan a la guía de actuaciones junto al texto del documento, y ella propone candidatas para atacar eso, cada una con su término, su artículo y su autoridad verificados. Escoge usted; después ponga el vencimiento en la agenda de términos, desde el icono de calendario de esta revisión en «Revisiones».'
          : 'Eso ya no lo dice este documento: lo dice el catálogo. Lleve los hechos a la guía de actuaciones y le propondrá candidatas con su término, su artículo y su autoridad verificados; después ponga el vencimiento en la agenda de términos, desde el icono de calendario de esta revisión en «Revisiones».'}
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <Combobox
            etiqueta="Rama"
            valor={rama}
            opciones={opcionesRama}
            onChange={setRama}
            vacio="Elegir rama…"
            anchoBoton="max-w-full"
            pie={
              sinRama
                ? 'Se buscará en todo el catálogo: la rama queda sin usar.'
                : 'La guía propone dentro de una rama; si no la sabe, márquelo abajo.'
            }
          />
          <label className="mt-1.5 flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={sinRama}
              onChange={(e) => setSinRama(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[rgb(var(--brand-700))]"
            />
            <span className="min-w-0 text-justify text-[12px] leading-snug text-ink-700 [text-wrap:pretty] [overflow-wrap:anywhere]">
              No sé la rama: buscar en todo el catálogo.{' '}
              <span className="text-ink-500">
                Cada candidata dirá de cuál viene. Tarda entre diez y quince segundos —contra un par— y le cuesta a la
                plataforma unas cuatro veces más.
              </span>
            </span>
          </label>
        </div>
        <button
          type="button"
          onClick={abrirLaGuia}
          disabled={!rama && !sinRama}
          className="btn-secondary btn-sm shrink-0 disabled:opacity-50"
          title={
            puntos.length > 0
              ? 'Propone actuaciones del catálogo para atacar los flancos señalados arriba, con el texto del documento como respaldo'
              : 'Propone actuaciones del catálogo a partir del texto de este documento'
          }
        >
          <Sparkles className="h-3.5 w-3.5" />
          {puntos.length > 0 ? 'Llevar los flancos a la guía de actuaciones' : 'Llevar a la guía de actuaciones'}
        </button>
      </div>

      {elegida && (
        <div className="mt-2 rounded-control border border-line-200 bg-canvas">
          <p className="px-3 py-2 text-[12px] leading-snug text-ink-900 text-justify [text-wrap:pretty]">
            Usted reconoció la actuación <span className="font-semibold">«{elegida.exactName}»</span>. Su término, su
            artículo y su autoridad salen de la ficha del catálogo, no de este documento. Póngala en la agenda desde
            «Revisiones».
          </p>
          {/*
            EL SALTO A REDACCIÓN. Antes de esto el recorrido terminaba en el
            párrafo de arriba: el abogado sabía qué escrito procede y no tenía
            cómo empezarlo. El botón no elige nada —la actuación ya la escogió
            él— y solo existe si quien monta esta pieza sabe llevar a Redacción.
          */}
          {onRedactar &&
            (panelAbierto ? (
              <RedactarLaActuacion
                exactName={elegida.exactName}
                rama={elegida.rama}
                hechos={hechos}
                informe={informe}
                onLlevar={(instruccion) => {
                  setPanelAbierto(false);
                  onRedactar(elegida.exactName, elegida.rama, hechos, instruccion);
                }}
                onCancelar={() => setPanelAbierto(false)}
              />
            ) : (
              <div className="border-t border-line-100 px-3 py-2">
                <button type="button" onClick={() => setPanelAbierto(true)} className="btn-primary btn-sm">
                  <PenLine className="h-3 w-3" />
                  Redactar esta actuación
                </button>
              </div>
            ))}
        </div>
      )}

      <GuiaEligeActuacionDialog
        abierto={guiaAbierta}
        onCerrar={() => setGuiaAbierta(false)}
        legalBranch={rama}
        sinRamaInicial={sinRama}
        hechos={hechos}
        setHechos={setHechos}
        onElegir={(exactName, branch) => {
          /*
           * LA RAMA QUE MANDA ES LA DE LA CANDIDATA. Buscando en todo el
           * catálogo puede venir de otra distinta a la del selector, y un mismo
           * rótulo tiene plazos distintos en dos ramas: guardar la del selector
           * resolvería después contra la ficha equivocada.
           */
          setElegida({ exactName, rama: branch || rama });
          setPanelAbierto(false);
          setGuiaAbierta(false);
        }}
        onEscribirNombre={() => {
          setGuiaAbierta(false);
          setPropiaAbierta(true);
        }}
      />
      <ActuacionPropiaDialog
        abierto={propiaAbierta}
        onCerrar={() => setPropiaAbierta(false)}
        legalBranch={rama}
        userRole={userRole}
        onCreada={(exactName) => {
          setElegida({ exactName, rama });
          setPanelAbierto(false);
          setPropiaAbierta(false);
        }}
      />
    </section>
  );
};

/**
 * La ficha de la actuación escogida, y con ella la instrucción sugerida.
 *
 * ─── POR QUÉ ES UN COMPONENTE APARTE ────────────────────────────────────────
 *
 * Porque resolver la ficha es un hook, y un hook no se puede llamar dentro de
 * un condicional. Montarlo solo cuando hay actuación escogida evita además
 * pedirle al catálogo que resuelva una cadena vacía.
 *
 * ─── SIN FICHA TAMBIÉN SE REDACTA ───────────────────────────────────────────
 *
 * Una actuación propia de la firma no tiene norma verificada detrás, y el
 * catálogo puede tardar o no responder. En ninguno de esos casos se bloquea el
 * salto: se lleva la actuación y los hechos, sin instrucción, que es como
 * funcionaba el camino de Redacción antes de que existieran las sugerencias.
 */
const RedactarLaActuacion: React.FC<{
  exactName: string;
  rama: string;
  hechos: string;
  informe: InformeDeDocumentoRecibido;
  onLlevar: (instruccion: string) => void;
  onCancelar: () => void;
}> = ({ exactName, rama, hechos, informe, onLlevar, onCancelar }) => {
  const lookup = useActuacionLookup(exactName, rama || undefined);

  /*
   * LA SUGERENCIA QUE HACE ÚTIL EL SALTO, y la única que este módulo aporta:
   * el encargo con los flancos y sus citas debajo. Se compone SOBRE la primera
   * sugerencia de la ficha para no reescribir aquí la frase de apertura —el
   * nombre exacto es el contrato con el motor, y una segunda redacción de esa
   * línea divergiría el día que cambie una palabra en el catálogo—.
   */
  const flancos = React.useMemo(() => flancosParaLaInstruccion(informe), [informe]);
  const actuacion = lookup.actuacion;
  const extra = React.useMemo(() => {
    if (!flancos || !actuacion) return [];
    const [primera] = sugerenciasDeInstruccion(actuacion, hechos);
    if (!primera) return [];
    return [
      {
        id: 'con-flancos',
        titulo: 'Con los flancos que se atacan, citados',
        texto: `${primera.texto}\n\n${flancos}`
      }
    ];
  }, [flancos, actuacion, hechos]);

  if (lookup.estado === 'CARGANDO') {
    return (
      <p className="border-t border-line-100 px-3 py-2 text-[12px] leading-snug text-ink-500 text-justify">
        Leyendo la ficha del catálogo para proponerle qué pedirle al motor…
      </p>
    );
  }

  if (lookup.estado !== 'ENCONTRADA') {
    return (
      <div className="border-t border-line-100 px-3 py-2">
        <p className="text-[12px] leading-snug text-ink-700 text-justify [text-wrap:pretty]">
          El catálogo no devolvió la ficha de «{exactName}», así que no hay nada verificado con lo que armarle una
          instrucción. Puede redactar igual: viajan la actuación y los hechos, y usted escribe el encargo en Redacción.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" onClick={() => onLlevar('')} className="btn-primary btn-sm">
            <PenLine className="h-3 w-3" />
            Llevar a Redacción
          </button>
          <button type="button" onClick={onCancelar} className="btn-neutral btn-sm">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <PanelDeInstruccion
      actuacion={lookup.actuacion}
      hechos={hechos}
      sugerenciasExtra={extra}
      onLlevar={onLlevar}
      onCancelar={onCancelar}
    />
  );
};
