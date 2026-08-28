import React, { useEffect, useMemo } from 'react';
import { CheckCircle2, ChevronRight, CircleDashed, MinusCircle } from 'lucide-react';
import { Combobox, type OpcionCombobox } from './Combobox';
import { useActuacionLookup } from '../../catalog/hooks/useActuacion';
import { useBranchActuacionesState } from '../../catalog/hooks/useBranchActuaciones';
import { useCatalogBranchesState } from '../../catalog/hooks/useCatalogBranches';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import type { Actuacion, ActuacionRole } from '../../catalog/types';

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

const ROLES: OpcionCombobox[] = [
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
    return <CircleDashed className="h-3.5 w-3.5 shrink-0 text-unverified" strokeWidth={2.4} />;
  if (!actuacion) return null;
  if (actuacion.term.status === 'NO_CADUCA')
    return <MinusCircle className="h-3.5 w-3.5 shrink-0 text-neutral-fact" strokeWidth={2.4} />;
  if (actuacion.term.status === 'NO_VERIFICADO')
    return <CircleDashed className="h-3.5 w-3.5 shrink-0 text-unverified" strokeWidth={2.4} />;
  return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-verified" strokeWidth={2.4} />;
};

const Flecha = () => <ChevronRight className="h-3 w-3 shrink-0 text-ink-400" strokeWidth={2.4} />;

export const WorkshopConfigBar: React.FC<WorkshopConfigBarProps> = ({
  userRole,
  setUserRole,
  legalBranch,
  setLegalBranch,
  documentType,
  setDocumentType
}) => {
  const ramasEstado = useCatalogBranchesState();
  const ramas = ramasEstado.ramas;
  const catalogo = useBranchActuacionesState(legalBranch, userRole);
  const lookup = useActuacionLookup(documentType, legalBranch);
  const actuacion = lookup.actuacion;

  const opcionesRama: OpcionCombobox[] = useMemo(
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
  const opcionesTipo: OpcionCombobox[] = useMemo(
    () =>
      catalogo.actuaciones.map((a) => ({
        valor: a.exactName,
        etiqueta: a.exactName,
        detalle:
          a.term.status === 'NO_CADUCA'
            ? 'No caduca'
            : a.term.status === 'NO_VERIFICADO'
            ? 'sin dato'
            : a.term.description ?? '',
        icono: <IconoEstado actuacion={a} />
      })),
    [catalogo.actuaciones]
  );

  const verificadas = catalogo.actuaciones.filter((a) => a.term.status === 'VERIFICADO').length;

  /*
   * CUÁNTAS HAY EN LA RAMA CON LOS OTROS ROLES.
   *
   * La lista está filtrada por quién firma, y eso confunde: Constitucional tiene
   * 35 actuaciones pero un litigante ve 20, y la pantalla no decía por qué —
   * parecía que faltaban. Ahora se dice, y se dice dónde están las otras.
   */
  const todasDeLaRama = useBranchActuacionesState(legalBranch);
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
    /*
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
    */
    <div className="flex h-[42px] shrink-0 items-center gap-2 border-b border-line-200 bg-surface px-5">
      <span className="shrink-0 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
        Este escrito
      </span>

      <Combobox
        etiqueta="Quién escribe"
        valor={userRole}
        opciones={ROLES}
        onChange={(v) => setUserRole(v as ActuacionRole)}
        conBusqueda={false}
        anchoBoton="max-w-[150px]"
        pie="Cambia el tono y las secciones obligatorias del escrito."
      />

      <Flecha />

      <Combobox
        etiqueta="Rama"
        valor={legalBranch}
        opciones={opcionesRama}
        onChange={setLegalBranch}
        anchoBoton="max-w-[190px]"
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

      <Combobox
        etiqueta="Tipo de documento"
        valor={documentType}
        opciones={opcionesTipo}
        onChange={setDocumentType}
        vacio="Elegir actuación…"
        anchoBoton="max-w-[280px]"
        cargando={catalogo.estado === 'CARGANDO'}
        pie={
          catalogo.estado === 'LISTA' ? (
            <>
              <b className="font-mono font-semibold text-ink-900">{verificadas}</b> de{' '}
              <b className="font-mono font-semibold text-ink-900">{catalogo.nombres.length}</b> con
              término verificado contra la norma.
              {otrosRoles > 0 && (
                <>
                  {' '}
                  La lista muestra solo las que firma{' '}
                  <b className="font-semibold text-ink-700">
                    {ROLES.find((r) => r.valor === userRole)?.etiqueta}
                  </b>
                  ; hay <b className="font-mono font-semibold text-ink-900">{otrosRoles}</b> más en
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
              <b className="font-semibold text-ink-700">
                {ROLES.find((r) => r.valor === userRole)?.etiqueta}
              </b>
              ; hay <b className="font-mono font-semibold text-ink-900">{otrosRoles}</b> con otro rol.
            </>
          ) : (
            'Esta rama aún no tiene catálogo verificado.'
          )
        }
      />

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
      <div className="ml-auto flex min-w-0 items-center gap-3 pl-3">
        {lookup.estado !== 'CARGANDO' && (
          <span
            className="hidden max-w-[280px] items-center gap-1.5 xl:flex"
            title={actuacion?.term.description ?? undefined}
          >
            <IconoEstado actuacion={actuacion} sinCatalogar={lookup.estado === 'SIN_CATALOGAR'} />
            <span className="min-w-0 truncate text-meta text-ink-700">
              {lookup.estado === 'SIN_CATALOGAR' ? (
                <span className="text-unverified">Sin catalogar</span>
              ) : actuacion?.term.status === 'NO_CADUCA' ? (
                'No caduca'
              ) : actuacion?.term.status === 'NO_VERIFICADO' ? (
                <span className="text-unverified">Término sin verificar</span>
              ) : (
                <>
                  <span className="text-ink-500">Término </span>
                  <span className="font-mono font-semibold text-ink-900">
                    {actuacion?.term.description}
                  </span>
                </>
              )}
            </span>
          </span>
        )}
      </div>
    </div>
  );
};
