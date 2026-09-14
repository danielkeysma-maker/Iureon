import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  HelpCircle,
  MinusCircle,
  PenLine,
  Sparkles
} from 'lucide-react';
import { EstadoDeLaFicha, SelectorEnCascada, type OpcionEnCascada } from './SelectorEnCascada';
import { estadoDeLaFicha, ordenarParaLaLista } from '../services/fichaEnLaLista';
import { rotuloDeExpediente, useExpedientes } from '../../expedientes/useExpedientes';
import { useActuacionLookup } from '../../catalog/hooks/useActuacion';
import { useBranchActuacionesState } from '../../catalog/hooks/useBranchActuaciones';
import { useCatalogBranchesState } from '../../catalog/hooks/useCatalogBranches';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import { GuiaEligeActuacionDialog } from './GuiaEligeActuacionDialog';
import { ActuacionPropiaDialog } from './ActuacionPropiaDialog';
import { EscritoSinNombreDialog } from './EscritoSinNombreDialog';
import { esTituloDeTrabajo } from '../../catalog/tituloDeTrabajo';
import type { Actuacion, ActuacionRole } from '../../catalog/types';

/*
 * LAS DOS OPCIONES QUE NO SON ACTUACIONES.
 *
 * Viven en la misma lista porque es donde se busca la actuación: quien no la
 * encuentra ya está mirando aquí, y mandarlo a otro sitio a pedir ayuda es
 * pedirle que sepa que la ayuda existe. Nunca llegan a `documentType` — el
 * `onChange` las intercepta y abre su diálogo—, así que no pueden viajar al
 * motor como si fueran el nombre de un escrito.
 *
 * La de la guía va PRIMERA y la de escribir el nombre, ÚLTIMA. El orden es el
 * de la conversación real: primero «no sé cuál es», al final «no está».
 */
const OPCION_GUIA = '__QUE_LA_GUIA_ELIJA__';
const OPCION_PROPIA = '__ESCRIBIR_EL_NOMBRE__';
/*
 * LA TERCERA SALIDA, y la que faltaba: no sé cómo se llama.
 *
 * Las otras dos suponen que existe un nombre y que alguien lo sabe — la
 * guía lo busca en el catálogo, «escribir el nombre» se lo pide al abogado.
 * Quien no lo sabe se quedaba sin puerta, y es justo el abogado para el que
 * se construyó esta aplicación. Va DESPUÉS de «escribir el nombre» porque el
 * orden sigue siendo el de la conversación: «no sé cuál es» → «no está» →
 * «ni sé cómo se llama».
 */
const OPCION_SIN_NOMBRE = '__SIN_NOMBRE_DE_ACTUACION__';

/*
 * LAS TRES SALIDAS VAN ANTES DE TODA ACTUACIÓN, en un bloque propio.
 *
 * Estaban mezcladas con las fichas —la guía primera y las otras dos al final
 * de noventa renglones—, así que quien no encontraba su actuación tenía que
 * llegar al fondo de la lista para descubrir que había otra puerta. Ahora se
 * pintan encima de la lista, bajo «Si no está en la lista», y la lupa no las
 * filtra: justo cuando la búsqueda no encuentra nada es cuando hacen falta.
 * El orden sigue siendo el de la conversación: «no sé cuál es» → «ni sé cómo se
 * llama» → «no está».
 */
const SERVICIOS: { valor: string; etiqueta: string; detalle: string; Icono: typeof Sparkles }[] = [
  {
    valor: OPCION_GUIA,
    etiqueta: 'Que la guía proponga la actuación',
    detalle: 'a partir de los hechos que usted escribió',
    Icono: Sparkles
  },
  {
    valor: OPCION_SIN_NOMBRE,
    etiqueta: 'No sé cómo se llama: describir qué debe lograr…',
    detalle: 'se redacta sin nombre de actuación y sin norma verificada',
    Icono: HelpCircle
  },
  {
    valor: OPCION_PROPIA,
    etiqueta: 'Ninguna de estas: escribir el nombre…',
    detalle: 'quedará en esta rama, sin norma verificada',
    Icono: PenLine
  }
];

/**
 * "De qué se trata este escrito": rol → rama → tipo, en una barra de 42px.
 *
 * LA SEPARACIÓN SE RESUELVE POR EJE. "De qué se trata" es esta barra; "qué
 * hacer" es la columna izquierda entera. Un control que se toca una vez no
 * merece una columna permanente.
 *
 * TRES DESPLEGABLES, NO TRES ETIQUETAS CON UN BOTÓN "CAMBIAR". La primera
 * versión pintaba los nombres como piezas fijas y abría una hoja aparte para
 * editarlos. Tenía dos defectos que un abogado encontró de inmediato:
 *
 *  1. SE DESBORDABA. Los nombres iban sin límite de ancho en una fila de 42px,
 *     así que "Civil & Comercial (CGP)" se montaba sobre el término y sobre el
 *     botón de al lado. Ahora cada control trunca, y el nombre completo vive en
 *     su `title` y en la lista.
 *
 *  2. NO DEJABA VER QUÉ HAY. Para saber qué actuaciones existen había que abrir
 *     una hoja modal, y no saberlo es el problema real: nadie recuerda noventa
 *     nombres de actuaciones, y buscarlos era lo que costaba el tiempo.
 *
 * LA LUPA VA TAMBIÉN EN LA RAMA. Veintidós no parecen muchas hasta que hay que
 * encontrar "Superintendencias (SIC, Salud, Financiera, SSPD)" leyendo una por
 * una: escribir "super" es más rápido que buscar con la vista.
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
  /**
   * DE QUE CASO ES ESTE ESCRITO.
   *
   * Va aqui y no en el panel de la izquierda porque es configuracion del
   * escrito, como la rama y la actuacion, y porque el estado de esa
   * configuracion vive arriba: el panel lo lee y no lo cambia.
   *
   * Y va A LA VISTA a proposito. Se penso en heredarlo en silencio del puente
   * «Redactar esta actuacion» y se descarto: ataria el borrador a un caso que
   * el abogado no ve, y el siguiente escrito de la sesion heredaria uno viejo
   * sin que nada lo diga. Una atadura que no se ve no se puede corregir.
   */
  expedienteId: string;
  setExpedienteId: (id: string) => void;
  /*
   * Los hechos que el abogado ya escribió en el cuadro de instrucción.
   *
   * Bajan hasta aquí porque «que la guía elija» orienta sobre ESOS hechos y no
   * sobre otros: pedirlos otra vez en el diálogo obligaría a escribir dos veces
   * lo mismo, y quien lo hiciera acabaría orientando sobre un resumen y
   * redactando sobre el original.
   */
  hechos: string;
  setHechos: (texto: string) => void;
}

/**
 * El ícono del estado de una actuación, con SILUETA PROPIA.
 *
 * Círculo cerrado, círculo discontinuo y barra: los tres se distinguen sin
 * color, que es la regla de redundancia del sistema. Un abogado que no distingue
 * verde de ámbar sigue viendo cuál es cuál.
 */
const IconoEstado: React.FC<{ actuacion?: Actuacion | null; sinCatalogar?: boolean }> = ({
  actuacion,
  sinCatalogar
}) => {
  if (sinCatalogar)
    return <CircleDashed className="cn-red-termino-icono cn-red-termino-icono--sin" strokeWidth={2.2} />;
  if (!actuacion) return null;
  if (actuacion.term.status === 'NO_CADUCA')
    return <MinusCircle className="cn-red-termino-icono cn-red-termino-icono--neutro" strokeWidth={2.2} />;
  if (actuacion.term.status === 'NO_VERIFICADO')
    return <CircleDashed className="cn-red-termino-icono cn-red-termino-icono--sin" strokeWidth={2.2} />;
  return <CheckCircle2 className="cn-red-termino-icono cn-red-termino-icono--ok" strokeWidth={2.2} />;
};

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
  expedienteId,
  setExpedienteId,
  hechos,
  setHechos
}) => {
  const [guiaAbierta, setGuiaAbierta] = useState(false);
  const [propiaAbierta, setPropiaAbierta] = useState(false);
  const [sinNombreAbierto, setSinNombreAbierto] = useState(false);
  /** Sube al crear una actuación propia: obliga a releer la lista de la rama. */
  const [recarga, setRecarga] = useState(0);

  const ramasEstado = useCatalogBranchesState();
  const ramas = ramasEstado.ramas;
  const catalogo = useBranchActuacionesState(legalBranch, userRole, recarga);
  const lookup = useActuacionLookup(documentType, legalBranch);
  const actuacion = lookup.actuacion;

  /*
   * La lista viene del gancho compartido: esta barra no cabe en
   * `SelectorDeExpediente` —su control es un `Combobox` horizontal con su
   * busqueda y su pie— pero los DATOS son los mismos que en las otras cinco
   * pantallas, y eso es lo que no puede estar copiado.
   */
  const expedientes = useExpedientes();

  const opcionesExpediente: OpcionEnCascada[] = useMemo(
    () => [
      { valor: '', etiqueta: 'Sin expediente' },
      ...expedientes.map((e) => ({ valor: e.id, etiqueta: rotuloDeExpediente(e) }))
    ],
    [expedientes]
  );

  const opcionesRama: OpcionEnCascada[] = useMemo(
    () => ramas.map((b) => ({ valor: b, etiqueta: BRANCH_LABELS[b] ?? b })),
    [ramas]
  );

  /*
   * CADA ACTUACIÓN LLEVA SU TÉRMINO Y SU ESTADO REAL en la lista.
   *
   * Es lo que convierte el desplegable en algo mejor que un `<select>`: el
   * abogado ve, antes de elegir, si esa actuación tiene término verificado, si
   * no caduca, o si nadie la comprobó. Pintar un visto verde en todas —como
   * llegó a estar escrito aquí— afirma una verificación que el catálogo no
   * respalda, justo sobre el dato que decide.
   */
  const opcionesTipo: OpcionEnCascada[] = useMemo(
    () =>
      /*
       * SOLO FICHAS DEL CATÁLOGO, en orden alfabético español y en dos bloques:
       * las de la rama y, debajo, las prestadas por remisión. Las tres salidas
       * de servicio no están aquí: van en su bloque, encima (ver SERVICIOS).
       *
       * LO PRESTADO SE DICE UNA VEZ, en la cabecera del bloque y con los dos
       * textos que manda el servidor (`marca` y `aviso`), para que la pantalla y
       * el motor digan lo mismo. Repetido en cada renglón, catorce veces, dejaba
       * de leerse.
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
        /* El término sigue a la vista antes de elegir: es el dato que decide. */
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
   * Las dos opciones de servicio NUNCA se guardan como tipo de documento: abren
   * su diálogo y el selector se queda como estaba. Si una llegara a `documentType`
   * viajaría al motor como el nombre de un escrito y el catálogo no resolvería
   * nada, que es exactamente el estado que este selector existe para impedir.
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
  };

  const verificadas = catalogo.actuaciones.filter((a) => a.term.status === 'VERIFICADO').length;

  /*
   * CUÁNTAS HAY EN LA RAMA CON LOS OTROS ROLES.
   *
   * La lista está filtrada por quién firma, y eso confunde: Constitucional tiene
   * 35 actuaciones pero un litigante ve 20, y la pantalla no decía por qué —
   * parecía que faltaban. Ahora se dice, y se dice dónde están las otras.
   */
  const todasDeLaRama = useBranchActuacionesState(legalBranch, undefined, recarga);
  const otrosRoles = Math.max(0, todasDeLaRama.nombres.length - catalogo.nombres.length);

  /*
   * UNA ACTUACIÓN NO SOBREVIVE A SU RAMA.
   *
   * Nada soltaba el tipo elegido al cambiar de rama, así que quedaba huérfano:
   * reproducido en producción, con la rama en «Constitucional & Tutelas» el
   * selector mostraba «Elegir actuación…» mientras el estado seguía valiendo
   * «Contestación de Demanda», el título del documento la anunciaba y el aviso
   * de «no está en el catálogo verificado» ya estaba encendido. Generar ahí
   * redacta con la norma que el modelo recuerde — exactamente lo que el
   * catálogo existe para impedir — y el abogado no tenía cómo verlo, porque el
   * control decía estar vacío.
   *
   * Se espera a que la lista de la rama esté CARGADA antes de soltar nada: en
   * CARGANDO todavía no se sabe si pertenece, y limpiar por adelantado borraría
   * la elección legítima de quien acaba de llegar desde Orientación.
   *
   * Y se compara contra la rama COMPLETA, no contra la lista filtrada por rol:
   * las 18 fichas transversales del derecho de petición viven en todas las
   * ramas, y una actuación que sigue siendo válida no debe perderse por cambiar
   * de rama. Si el rol es el que la esconde, de eso ya habla el pie del
   * selector.
   */
  useEffect(() => {
    if (!documentType) return;
    if (todasDeLaRama.estado !== 'LISTA') return;
    if (todasDeLaRama.nombres.includes(documentType)) return;
    setDocumentType('');
  }, [documentType, todasDeLaRama, setDocumentType]);

  return (
    <>
    {/*
      LOS DIÁLOGOS CUELGAN DE LA BARRA, no del panel de instrucción, porque es
      la barra la que ofrece las dos opciones y la que recibe su resultado: el
      nombre elegido o el nombre escrito acaban los dos en este selector.
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
          tiene plazos distintos en dos ramas: dejar la del selector redactaría
          contra la ficha equivocada, o contra ninguna.
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

    {/*
      SIN NOMBRE, MISMO CIRCUITO. Lo que se guarda es un título de trabajo con
      su marca, por el mismo endpoint de actuaciones de la firma: después se
      puede curar en «Catálogo» con su norma al lado y dejar de ser un título
      para volverse una ficha.
    */}
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
        /* Mismo orden que arriba: primero la lista, después la elección. */
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

    {/*
      SIN `overflow` Y SIN `flex-wrap`, y las dos ausencias son deliberadas.
      
      `flex-wrap` haría que la barra creciera a 84px y empujara el documento
      hacia abajo cada vez que alguien elige una rama de nombre largo.
      
      Y `overflow-x-auto` —que fue lo primero que escribí— habría sido peor:
      CSS no permite recortar un eje y dejar el otro visible, así que el
      contenedor recortaría también los desplegables por arriba y por abajo.
      Habría cambiado un desbordamiento por una lista de noventa actuaciones
      cortada a la mitad.
      
      La solución es que los controles se ENCOJAN: cada uno trunca su texto y el
      nombre completo vive en su `title` y en la lista.
    */}
    {/*
      EN MOVIL LA FILA SE DESPLAZA DENTRO DE SI MISMA, no ensancha la pagina.
      Son selectores de ancho fijo —170, 150, 110px— que a 375px suman mas que
      la pantalla; sin contenerlos, el desbordamiento se lo comia el documento y
      la aplicacion entera se leia «como en PC y cortada».

      PENDIENTE DECLARADO: 4d no quiere esta barra desplazandose sino COMPRIMIDA
      EN DOS CHIPS con el termino y la fecha de vencimiento visibles en 390px.
      Eso es rehacer la barra, no contenerla; mientras tanto esto evita que rompa
      el resto, que es un defecto distinto y peor.
    */}
    {/*
      LA CARA NUEVA SUMA ALTO A PROPÓSITO: cada caja lleva su rótulo encima y
      mide 44 px, porque la cascada tiene que leerse —quién firma, luego la
      rama, luego la actuación— y un rótulo dentro del botón desaparece en
      cuanto hay algo elegido. Sigue sin `flex-wrap` por la razón de arriba.
    */}
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
           * UN FALLO NO ES UNA CARGA. El hook devolvia [] en ambos casos, asi
           * que una peticion caida dejaba el selector diciendo «Cargando…»
           * para siempre y el pie anunciando «0 ramas».
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
                  La lista muestra solo las que firma{' '}
                  <b className="cn-red-cifra">
                    {ROLES.find((r) => r.valor === userRole)?.etiqueta}
                  </b>
                  ; hay <b className="cn-red-cifra">{otrosRoles}</b> más en
                  esta rama con otro rol.
                </>
              )}
            </>
          ) : catalogo.estado === 'CARGANDO' ? (
            'Consultando el catálogo de esta rama…'
          ) : otrosRoles > 0 ? (
            /*
             * VACÍA POR EL ROL NO ES VACÍA POR LA RAMA, y decir lo segundo es
             * mentir sobre el catálogo. Solo CIVIL (14) y ARBITRAJE (2) tienen
             * fichas de secretaría, así que en las otras veinte ramas un
             * secretario leía «esta rama aún no tiene catálogo verificado»
             * sobre ramas con decenas de actuaciones comprobadas.
             */
            <>
              Ninguna actuación de esta rama la firma{' '}
              <b className="cn-red-cifra">
                {ROLES.find((r) => r.valor === userRole)?.etiqueta}
              </b>
              ; hay <b className="cn-red-cifra">{otrosRoles}</b> con otro rol.
            </>
          ) : (
            'Esta rama aún no tiene catálogo verificado.'
          )
        }
      />

      {/*
        EL CASO VA AL FINAL, y es una decisión de riesgo y no de importancia.
        Ponerlo primero leería mejor —el caso contiene al escrito— pero movería
        de sitio los tres controles que el abogado ya tiene en la mano, sobre
        la pantalla más usada, a cambio de nada funcional.

        Solo se pinta si la firma tiene expedientes: un desplegable con «Sin
        expediente» y nada más no ofrece nada.
      */}
      {/*
        El caso no depende de la actuación, así que no lleva flecha: una raya lo
        separa de la cascada en vez de encadenarlo a ella.
      */}
      {expedientes.length > 0 && (
        <>
          <span className="cn-red-raya" aria-hidden />
          <SelectorEnCascada
            etiqueta="De qué caso"
            valor={expedienteId}
            opciones={opcionesExpediente}
            onChange={setExpedienteId}
            vacio="Sin expediente"
            anchoCampo="cn-red-campo--caso"
            pie="El borrador queda contado dentro del caso, y si el caso tiene documentos cargados el escrito nace con lo que ellos dicen. Sin esto nace suelto y hay que jalarlo después desde Expedientes."
          />
        </>
      )}

      {/*
        El término va a la derecha y en mono: es lo que se vence mientras alguien
        decide qué hacer, y es dato citable. La autoridad lo acompaña porque son
        la misma pregunta — cuándo y ante quién.

        Ambos se OCULTAN antes de empujar los controles: saber con qué se está
        redactando importa más, y el término además está en la ficha y en el
        propio escrito.
      */}
      {/*
        EL TÉRMINO VA CON ANCHO DURO, no solo con `min-w-0`.

        Un `inline-flex` no cede ancho como un bloque, así que el truncado no
        llegaba a aplicarse y el texto seguía empujando la página: los términos
        de este catálogo son párrafos —«La Sala de Selección, integrada por dos
        magistrados designados por sorteo, selecciona sin motivación expresa…»—,
        no etiquetas de tres palabras.

        Con `max-w` explícito el corte ocurre siempre, y el texto completo vive
        en el `title` y en la ficha de la izquierda, donde sí se puede leer.
      */}
      <div className="cn-red-termino-caja">
        {lookup.estado !== 'CARGANDO' && (
          <span className="cn-red-termino" title={actuacion?.term.description ?? undefined}>
            <IconoEstado actuacion={actuacion} sinCatalogar={lookup.estado === 'SIN_CATALOGAR'} />
            <span className="cn-red-termino-texto">
              {lookup.estado === 'SIN_CATALOGAR' ? (
                <span className="cn-red-termino-sin">Sin catalogar</span>
              ) : actuacion?.term.status === 'NO_CADUCA' ? (
                'No caduca'
              ) : actuacion?.term.status === 'NO_VERIFICADO' ? (
                <span className="cn-red-termino-sin">Término sin verificar</span>
              ) : (
                <>
                  <span className="cn-red-termino-rotulo">Término </span>
                  <span className="cn-red-mono">{actuacion?.term.description}</span>
                </>
              )}
            </span>
          </span>
        )}
      </div>
    </div>
    </>
  );
};
