import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, FileQuestion, PenLine, Sparkles } from 'lucide-react';
import { EstadoDeLaFicha, SelectorEnCascada, type OpcionEnCascada } from './SelectorEnCascada';
import { ActuacionElegida } from './ActuacionElegida';
import { estadoDeLaFicha, ordenarParaLaLista } from '../services/fichaEnLaLista';
import { desacuerdoDeRama, ramaAlElegirCaso } from '../services/ramaDelCaso';
import { rotuloDeExpediente, useExpedientes } from '../../expedientes/useExpedientes';
import { useActuacionLookup } from '../../catalog/hooks/useActuacion';
import { useBranchActuacionesState } from '../../catalog/hooks/useBranchActuaciones';
import { useCatalogBranchesState } from '../../catalog/hooks/useCatalogBranches';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import { GuiaEligeActuacionDialog } from './GuiaEligeActuacionDialog';
import { ActuacionPropiaDialog } from './ActuacionPropiaDialog';
import { EscritoSinNombreDialog } from './EscritoSinNombreDialog';
import { esTituloDeTrabajo } from '../../catalog/tituloDeTrabajo';
import type { ActuacionRole } from '../../catalog/types';

/*
 * LAS TRES OPCIONES QUE NO SON ACTUACIONES.
 *
 * Viven en la misma lista porque es donde se busca la actuación: quien no la
 * encuentra ya está mirando aquí, y mandarlo a otro sitio a pedir ayuda es
 * pedirle que sepa que la ayuda existe. Nunca llegan a `documentType` — el
 * `onChange` las intercepta y abre su diálogo—, así que no pueden viajar al
 * motor como si fueran el nombre de un escrito.
 */
const OPCION_GUIA = '__QUE_LA_GUIA_ELIJA__';
const OPCION_PROPIA = '__ESCRIBIR_EL_NOMBRE__';
const OPCION_SIN_NOMBRE = '__SIN_NOMBRE_DE_ACTUACION__';

/*
 * LAS TRES SALIDAS VAN ANTES DE TODA ACTUACIÓN, en un bloque propio, y cada una
 * dice en su nombre QUÉ HACE, no qué le falta al abogado.
 *
 * Los rótulos anteriores —«No sé cómo se llama: describir qué debe lograr…»,
 * «Ninguna de estas: escribir el nombre…»— se parecían tanto que había que abrir
 * los dos diálogos para saber cuál era cuál. Los nombres nuevos los aprobó el
 * titular el 14 de septiembre de 2026.
 *
 * EL ORDEN VA DE MÁS A MENOS RESPALDO: la guía propone fichas verificadas; la
 * actuación escrita a mano conserva al menos un nombre; redactar sin actuación
 * renuncia a las dos cosas, y por eso va la última.
 */
const SERVICIOS: { valor: string; etiqueta: string; detalle: string; Icono: typeof Sparkles }[] = [
  {
    valor: OPCION_GUIA,
    etiqueta: 'No sé cuál es: que la guía la proponga',
    detalle: 'Cuente los hechos y la guía le propone actuaciones del catálogo.',
    Icono: Sparkles
  },
  {
    valor: OPCION_PROPIA,
    etiqueta: 'No está en la lista: la escribo yo',
    detalle: 'Usted pone el nombre; el escrito dirá que no tiene norma verificada.',
    Icono: PenLine
  },
  {
    valor: OPCION_SIN_NOMBRE,
    etiqueta: 'Redactar sin actuación',
    detalle: 'Describa qué debe lograr el escrito; saldrá sin norma ni término verificados.',
    Icono: FileQuestion
  }
];

/**
 * «Qué va a presentar»: quién firma → rama → actuación, el paso 1 del asistente
 * de Redactar. Artboards de selectores (líneas 78–154) y paso 1 del asistente
 * (676–755) de `public/handoff/app-redaccion-revision.html`.
 *
 * ─── DE BARRA A PASO ────────────────────────────────────────────────────────
 *
 * Esto era una barra de 42 px a todo lo ancho, sobre la instrucción y el papel.
 * El titular vio en producción que la pantalla era la vieja recoloreada: el
 * artboard pide una columna con pasos, y la cascada es el primero. Los tres
 * selectores siguen en fila y con flechas —la dependencia se sigue viendo—, y
 * cuando la actuación queda elegida se pliegan en la tarjeta `ActuacionElegida`.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · Dos tarjetas para quién firma («Firma litigante», «Juzgado o despacho»).
 *   Los roles son TRES —la secretaría firma sus propios actos— y el selector ya
 *   los trae con su pie; dos tarjetas dejarían fuera a quien firma como
 *   secretario.
 * · «$300» junto a la guía. La orientación desde Redacción es gratis diez veces
 *   al día y después se cobra del saldo; el componente no conoce el cupo de la
 *   firma, y un precio fijo sería falso la mayoría de las veces.
 * · El conteo de actuaciones por rama («148»). La lista de ramas no lo trae.
 */

const ROLES: OpcionEnCascada[] = [
  { valor: 'LITIGANTE', etiqueta: 'Firma / Litigante' },
  { valor: 'DESPACHO', etiqueta: 'Juez / Despacho' },
  { valor: 'SECRETARIA', etiqueta: 'Secretaría' }
];

interface WorkshopConfigBarProps {
  userRole: ActuacionRole;
  setUserRole: (role: ActuacionRole) => void;
  legalBranch: string;
  setLegalBranch: (branch: string) => void;
  documentType: string;
  setDocumentType: (type: string) => void;
  /*
   * Los hechos que el abogado ya escribió en el cuadro de instrucción.
   *
   * Bajan hasta aquí porque «que la guía la proponga» orienta sobre ESOS hechos
   * y no sobre otros: pedirlos otra vez en el diálogo obligaría a escribir dos
   * veces lo mismo.
   */
  hechos: string;
  setHechos: (texto: string) => void;
}

/*
 * LA FLECHA ENTRE CAJAS DICE QUE LO DE LA DERECHA DEPENDE DE LO DE LA IZQUIERDA
 * (README-app §2). Con tres listas sueltas nadie entiende por qué la actuación
 * se vació al cambiar la rama; con la flecha, la dependencia se ve antes.
 */
const Flecha = () => (
  <span className="cn-red-flecha" aria-hidden>
    <ChevronRight className="cn-red-flecha-icono" strokeWidth={1.8} />
  </span>
);

export const WorkshopConfigBar: React.FC<WorkshopConfigBarProps> = ({
  userRole,
  setUserRole,
  legalBranch,
  setLegalBranch,
  documentType,
  setDocumentType,
  hechos,
  setHechos
}) => {
  const [guiaAbierta, setGuiaAbierta] = useState(false);
  const [propiaAbierta, setPropiaAbierta] = useState(false);
  const [sinNombreAbierto, setSinNombreAbierto] = useState(false);
  /** Sube al crear una actuación propia: obliga a releer la lista de la rama. */
  const [recarga, setRecarga] = useState(0);
  /** «Cambiar» en la tarjeta: la cascada vuelve a abrirse con la actuación puesta. */
  const [cambiando, setCambiando] = useState(false);

  const ramasEstado = useCatalogBranchesState();
  const ramas = ramasEstado.ramas;
  const catalogo = useBranchActuacionesState(legalBranch, userRole, recarga);
  const lookup = useActuacionLookup(documentType, legalBranch);

  /*
   * Elegir una actuación —en la lista o desde un diálogo— pliega la cascada.
   * Se ancla al TIPO y no a la actuación resuelta: la resolución cambia al
   * cambiar la rama sin que nadie haya elegido nada.
   */
  useEffect(() => {
    setCambiando(false);
  }, [documentType]);

  const opcionesRama: OpcionEnCascada[] = useMemo(
    () => ramas.map((b) => ({ valor: b, etiqueta: BRANCH_LABELS[b] ?? b })),
    [ramas]
  );

  /*
   * CADA ACTUACIÓN LLEVA SU TÉRMINO Y SU ESTADO REAL en la lista.
   *
   * Pintar un visto verde en todas —como llegó a estar escrito aquí— afirma una
   * verificación que el catálogo no respalda, justo sobre el dato que decide.
   */
  const opcionesTipo: OpcionEnCascada[] = useMemo(
    () =>
      /*
       * SOLO FICHAS DEL CATÁLOGO, en orden alfabético español y en dos bloques:
       * las de la rama y, debajo, las prestadas por remisión. Las tres salidas
       * de servicio no están aquí: van en su bloque, encima (ver SERVICIOS).
       *
       * LO PRESTADO SE DICE UNA VEZ, en la cabecera del bloque y con los dos
       * textos que manda el servidor (`marca` y `aviso`).
       */
      ordenarParaLaLista(catalogo.actuaciones).map((a): OpcionEnCascada => {
        if (a.porRemision) {
          return {
            valor: a.exactName,
            etiqueta: a.exactName,
            detalleTexto: a.porRemision.marca,
            grupo: { titulo: a.porRemision.marca, aviso: a.porRemision.aviso }
          };
        }
        const estado = estadoDeLaFicha(a, esTituloDeTrabajo(a.exactName));
        const termino = a.term.status === 'VERIFICADO' ? a.term.description ?? '' : '';
        return {
          valor: a.exactName,
          etiqueta: a.exactName,
          detalle: (
            <>
              <EstadoDeLaFicha estado={estado} />
              {termino && <span className="cn-red-fila-termino">{termino}</span>}
            </>
          ),
          detalleTexto: [estado.articulo, estado.texto, termino].filter(Boolean).join(' · ')
        };
      }),
    [catalogo.actuaciones]
  );

  /*
   * Las opciones de servicio NUNCA se guardan como tipo de documento: abren su
   * diálogo y el selector se queda como estaba.
   */
  const elegirTipo = (valor: string) => {
    if (valor === OPCION_GUIA) {
      setGuiaAbierta(true);
      return;
    }
    if (valor === OPCION_PROPIA) {
      setPropiaAbierta(true);
      return;
    }
    if (valor === OPCION_SIN_NOMBRE) {
      setSinNombreAbierto(true);
      return;
    }
    setDocumentType(valor);
    setCambiando(false);
  };

  const verificadas = catalogo.actuaciones.filter((a) => a.term.status === 'VERIFICADO').length;

  /*
   * CUÁNTAS HAY EN LA RAMA CON LOS OTROS ROLES. La lista está filtrada por quién
   * firma: Constitucional tiene 35 actuaciones pero un litigante ve 20, y sin
   * decirlo parecía que faltaban.
   */
  const todasDeLaRama = useBranchActuacionesState(legalBranch, undefined, recarga);
  const otrosRoles = Math.max(0, todasDeLaRama.nombres.length - catalogo.nombres.length);

  /*
   * UNA ACTUACIÓN NO SOBREVIVE A SU RAMA.
   *
   * Nada soltaba el tipo elegido al cambiar de rama, así que quedaba huérfano:
   * el selector mostraba «Elegir actuación…» mientras el estado seguía valiendo
   * otra cosa, y generar ahí redactaba con la norma que el modelo recordara.
   *
   * Se espera a que la lista de la rama esté CARGADA antes de soltar nada: en
   * CARGANDO todavía no se sabe si pertenece, y limpiar por adelantado borraría
   * la elección legítima de quien acaba de llegar desde Orientación.
   *
   * Y se compara contra la rama COMPLETA, no contra la lista filtrada por rol:
   * las fichas transversales viven en todas las ramas.
   *
   * ESTE COMPONENTE NO SE DESMONTA AL GENERAR: el asistente se oculta, no se
   * quita, así que la regla sigue vigilando mientras la rama pueda cambiar.
   */
  useEffect(() => {
    if (!documentType) return;
    if (todasDeLaRama.estado !== 'LISTA') return;
    if (todasDeLaRama.nombres.includes(documentType)) return;
    setDocumentType('');
  }, [documentType, todasDeLaRama, setDocumentType]);

  const plegada = Boolean(documentType) && !cambiando;
  const rolEtiqueta = ROLES.find((r) => r.valor === userRole)?.etiqueta ?? userRole;

  return (
    <>
    {/*
      LOS DIÁLOGOS CUELGAN DE LA CASCADA porque es la cascada la que ofrece las
      salidas y la que recibe su resultado. Se montan también con la tarjeta
      plegada: cerrar uno a medias no puede perder lo escrito.
    */}
    <GuiaEligeActuacionDialog
      abierto={guiaAbierta}
      onCerrar={() => setGuiaAbierta(false)}
      legalBranch={legalBranch}
      hechos={hechos}
      setHechos={setHechos}
      onElegir={(exactName, branch) => {
        /*
          LA RAMA QUE MANDA ES LA DE LA CANDIDATA. Buscando en todo el catálogo
          la actuación propuesta puede vivir en otra rama, y un mismo rótulo
          tiene plazos distintos en dos ramas.
        */
        if (branch) setLegalBranch(branch);
        setDocumentType(exactName);
        setGuiaAbierta(false);
      }}
      onEscribirNombre={() => {
        setGuiaAbierta(false);
        setPropiaAbierta(true);
      }}
      onSinNombre={() => {
        setGuiaAbierta(false);
        setSinNombreAbierto(true);
      }}
    />

    <EscritoSinNombreDialog
      abierto={sinNombreAbierto}
      onCerrar={() => setSinNombreAbierto(false)}
      legalBranch={legalBranch}
      userRole={userRole}
      onEscribirNombre={() => {
        setSinNombreAbierto(false);
        setPropiaAbierta(true);
      }}
      onCreada={(exactName) => {
        /* Mismo orden que abajo: primero la lista, después la elección. */
        setRecarga((n) => n + 1);
        setDocumentType(exactName);
        setSinNombreAbierto(false);
      }}
    />

    <ActuacionPropiaDialog
      abierto={propiaAbierta}
      onCerrar={() => setPropiaAbierta(false)}
      legalBranch={legalBranch}
      userRole={userRole}
      onCreada={(exactName) => {
        /*
         * El orden importa: primero se pide la lista de nuevo y después se
         * elige. Al revés, el efecto que suelta una actuación ajena a la rama
         * la encontraría ausente de una lista todavía vieja y la borraría en
         * el acto — el abogado la vería aparecer y desaparecer.
         */
        setRecarga((n) => n + 1);
        setDocumentType(exactName);
        setPropiaAbierta(false);
      }}
    />

    {plegada ? (
      <ActuacionElegida
        quienFirma={rolEtiqueta}
        rama={BRANCH_LABELS[legalBranch] ?? legalBranch}
        documentType={documentType}
        ficha={lookup}
        onCambiar={() => setCambiando(true)}
      />
    ) : (
      <div className="cn-red-cascada">
        <div className="cn-red-barra">
          <SelectorEnCascada
            etiqueta="Quién firma"
            valor={userRole}
            opciones={ROLES}
            onChange={(v) => setUserRole(v as ActuacionRole)}
            conBusqueda={false}
            anchoCampo="cn-red-campo--rol"
            pie="Cambia el tono y las secciones obligatorias del escrito."
          />

          <Flecha />

          <SelectorEnCascada
            etiqueta="Rama"
            valor={legalBranch}
            opciones={opcionesRama}
            onChange={setLegalBranch}
            anchoCampo="cn-red-campo--rama"
            cargando={ramasEstado.estado === 'CARGANDO'}
            pie={
              /*
               * UN FALLO NO ES UNA CARGA. El hook devolvía [] en ambos casos,
               * así que una petición caída dejaba el selector diciendo
               * «Cargando…» para siempre.
               */
              ramasEstado.estado === 'ERROR'
                ? 'No se pudo leer el catálogo. Revise la conexión y vuelva a intentarlo.'
                : ramasEstado.estado === 'CARGANDO'
                ? 'Consultando las ramas del catálogo…'
                : `${ramas.length} ramas. La rama decide qué actuaciones se ofrecen y con qué término.`
            }
          />

          <Flecha />

          <SelectorEnCascada
            etiqueta="Actuación"
            valor={documentType}
            opciones={opcionesTipo}
            onChange={elegirTipo}
            vacio="Elegir actuación…"
            anchoCampo="cn-red-campo--actuacion"
            cargando={catalogo.estado === 'CARGANDO'}
            antesDeLaLista={(cerrar) => (
              <div className="cn-red-servicios">
                <p className="cn-red-servicios-titulo">Si no está en la lista</p>
                {SERVICIOS.map(({ valor, etiqueta, detalle, Icono }) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => {
                      cerrar();
                      elegirTipo(valor);
                    }}
                    className="cn-red-servicio"
                  >
                    <Icono className="cn-red-servicio-icono" strokeWidth={1.8} aria-hidden />
                    <span className="cn-red-fila-textos">
                      <span className="cn-red-servicio-nombre">{etiqueta}</span>
                      <span className="cn-red-fila-detalle">{detalle}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            pie={
              catalogo.estado === 'LISTA' ? (
                <>
                  <b className="cn-red-cifra">{verificadas}</b> de{' '}
                  <b className="cn-red-cifra">{catalogo.nombres.length}</b> con
                  término verificado contra la norma.
                  {otrosRoles > 0 && (
                    <>
                      {' '}
                      La lista muestra solo las que firma <b className="cn-red-cifra">{rolEtiqueta}</b>; hay{' '}
                      <b className="cn-red-cifra">{otrosRoles}</b> más en esta rama con otro rol.
                    </>
                  )}
                </>
              ) : catalogo.estado === 'CARGANDO' ? (
                'Consultando el catálogo de esta rama…'
              ) : otrosRoles > 0 ? (
                /*
                 * VACÍA POR EL ROL NO ES VACÍA POR LA RAMA, y decir lo segundo
                 * es mentir sobre el catálogo.
                 */
                <>
                  Ninguna actuación de esta rama la firma <b className="cn-red-cifra">{rolEtiqueta}</b>; hay{' '}
                  <b className="cn-red-cifra">{otrosRoles}</b> con otro rol.
                </>
              ) : (
                'Esta rama aún no tiene catálogo verificado.'
              )
            }
          />
        </div>

        <div className="cn-red-cascada-pie">
          <p className="cn-red-nota">
            Cambiar la rama suelta la actuación si no existe en la nueva: la actuación es la que trae el artículo y el término.
          </p>
          {documentType && (
            <button type="button" onClick={() => setCambiando(false)} className="cn-red-listo">
              Dejar «{documentType}»
            </button>
          )}
        </div>
      </div>
    )}
    </>
  );
};

/**
 * «De qué caso»: el expediente al que queda atado el escrito, en escritorio.
 *
 * ─── POR QUÉ VA PRIMERO EN EL PASO 1 ───────────────────────────────────────
 *
 * Iba al final de la barra, después de la actuación, por no mover los controles
 * que el abogado ya tenía en la mano. Hoy el caso PROPONE LA RAMA —la rama de un
 * escrito es la del caso, no la del cliente—, y esa propuesta solo sirve antes
 * de elegir la actuación: preguntarlo después la dejaría sin efecto casi siempre.
 * Por eso encabeza el paso, encima de la cascada. No lleva flecha: no depende de
 * quién firma, lo contiene todo.
 *
 * Solo se pinta si la firma tiene expedientes: un desplegable con «Sin
 * expediente» y nada más no ofrece nada.
 */
interface SelectorDeCasoProps {
  expedienteId: string;
  setExpedienteId: (id: string) => void;
  legalBranch: string;
  setLegalBranch: (branch: string) => void;
  documentType: string;
}

export const SelectorDeCasoDeRedaccion: React.FC<SelectorDeCasoProps> = ({
  expedienteId,
  setExpedienteId,
  legalBranch,
  setLegalBranch,
  documentType
}) => {
  /*
   * La lista viene del gancho compartido: los DATOS son los mismos que en las
   * otras pantallas, y eso es lo que no puede estar copiado.
   */
  const expedientes = useExpedientes();

  const opcionesExpediente: OpcionEnCascada[] = useMemo(
    () => [
      { valor: '', etiqueta: 'Sin expediente' },
      ...expedientes.map((e) => ({ valor: e.id, etiqueta: rotuloDeExpediente(e) }))
    ],
    [expedientes]
  );

  if (expedientes.length === 0) return null;

  const caso = expedientes.find((e) => e.id === expedienteId) ?? null;
  const desacuerdo = caso ? desacuerdoDeRama(caso.rama, legalBranch, BRANCH_LABELS) : null;

  /*
   * SOLO REACCIONA A QUIEN CAMBIA EL CASO AQUÍ. Abrir un borrador, recargar o
   * llegar desde Orientación ponen el caso por otro camino y traen su propia
   * rama; pisarla sería contradecir una decisión ya tomada.
   */
  const elegirCaso = (id: string) => {
    setExpedienteId(id);
    const elegido = expedientes.find((e) => e.id === id);
    const rama = elegido ? ramaAlElegirCaso(elegido.rama, legalBranch, Boolean(documentType), BRANCH_LABELS) : null;
    if (rama) setLegalBranch(rama);
  };

  return (
    <div className="cn-red-caso">
      <SelectorEnCascada
        etiqueta="De qué caso"
        valor={expedienteId}
        opciones={opcionesExpediente}
        onChange={elegirCaso}
        vacio="Sin expediente"
        anchoCampo="cn-red-campo--caso"
        pie="El borrador queda contado dentro del caso, y si el caso tiene documentos cargados el escrito nace con lo que ellos dicen. Sin esto nace suelto y hay que jalarlo después desde Expedientes."
      />
      {desacuerdo && (
        <div className="cn-red-caso-aviso" role="status">
          <p className="cn-red-caso-aviso-texto">{desacuerdo.texto}</p>
          <button type="button" onClick={() => setLegalBranch(desacuerdo.delCaso)} className="cn-red-caso-aviso-boton">
            {desacuerdo.boton}
          </button>
        </div>
      )}
    </div>
  );
};
