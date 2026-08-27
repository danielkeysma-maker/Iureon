import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, CircleDashed, MinusCircle, Search, X } from 'lucide-react';
import { useActuacionLookup } from '../../catalog/hooks/useActuacion';
import { useBranchActuacionesState } from '../../catalog/hooks/useBranchActuaciones';
import { useCatalogBranches } from '../../catalog/hooks/useCatalogBranches';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import type { ActuacionRole } from '../../catalog/types';

/**
 * "De qué se trata este escrito", como una barra y no como una columna.
 *
 * EL PROBLEMA QUE RESUELVE. El panel apilaba el rol, la rama, el tipo de
 * documento, dos avisos, el área de instrucción, los adjuntos y el botón de
 * generar — todo con el mismo peso visual, todas las etiquetas del mismo tamaño
 * y el mismo gris, y los tres selectores del mismo ancho. La acción principal y
 * una configuración que se toca UNA VEZ pesaban igual.
 *
 * LA SEPARACIÓN SE RESUELVE POR EJE, NO POR JERARQUÍA TIPOGRÁFICA. "De qué se
 * trata" es esta barra horizontal —rol → rama → tipo, en ese orden de
 * dependencia, leída como una sola frase—; "qué hacer" es la columna izquierda
 * entera. Un control que se toca una vez no merece una columna permanente.
 *
 * COLAPSADA OCUPA 42px Y SIGUE SIENDO LEGIBLE, y eso es lo que la justifica: es
 * la única forma de que el abogado que retoma el escrito a las seis de la tarde
 * sepa con qué está generando sin abrir nada.
 *
 * LOS CAMBIOS SE APLICAN JUNTOS, no uno por uno. La hoja tiene Cancelar y
 * Aplicar porque rama y tipo son dependientes: cambiar la rama sola deja un tipo
 * de documento que ya no pertenece a ella, y ese estado intermedio es
 * exactamente el que perdía la actuación elegida en Orientación.
 */

const ROLES: { role: ActuacionRole; label: string; hint: string }[] = [
  { role: 'LITIGANTE', label: 'Firma / Litigante', hint: 'Escritos de parte' },
  { role: 'DESPACHO', label: 'Juez / Despacho', hint: 'Providencias que firma el juez' },
  { role: 'SECRETARIA', label: 'Secretaría', hint: 'Actos que firma el secretario' }
];

interface WorkshopConfigBarProps {
  userRole: ActuacionRole;
  setUserRole: (role: ActuacionRole) => void;
  legalBranch: string;
  setLegalBranch: (branch: string) => void;
  documentType: string;
  setDocumentType: (type: string) => void;
}

/** Un dato de la barra: fondo canvas, borde, radio de control. */
const Pieza: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-control border border-line-200 bg-canvas px-2.5 py-1 text-[12.5px] font-medium text-ink-900">
    {children}
  </span>
);

export const WorkshopConfigBar: React.FC<WorkshopConfigBarProps> = ({
  userRole,
  setUserRole,
  legalBranch,
  setLegalBranch,
  documentType,
  setDocumentType
}) => {
  const [abierta, setAbierta] = useState(false);

  const lookup = useActuacionLookup(documentType, legalBranch);
  const actuacion = lookup.actuacion;

  const ramaLabel = BRANCH_LABELS[legalBranch] ?? legalBranch;

  /**
   * El ícono del estado, con silueta propia.
   *
   * Círculo cerrado / círculo discontinuo / barra: los tres se distinguen sin
   * color, que es la regla de redundancia del sistema. Un abogado que no
   * distingue verde de ámbar sigue viendo cuál es cuál.
   */
  const Estado = () => {
    if (lookup.estado === 'CARGANDO') return null;
    if (lookup.estado === 'SIN_CATALOGAR')
      return <CircleDashed className="h-3 w-3 shrink-0 text-unverified" strokeWidth={2.6} />;
    if (actuacion?.term.status === 'NO_CADUCA')
      return <MinusCircle className="h-3 w-3 shrink-0 text-neutral-fact" strokeWidth={2.6} />;
    if (actuacion?.term.status === 'NO_VERIFICADO')
      return <CircleDashed className="h-3 w-3 shrink-0 text-unverified" strokeWidth={2.6} />;
    return <CheckCircle2 className="h-3 w-3 shrink-0 text-verified" strokeWidth={2.6} />;
  };

  return (
    <>
      <div className="flex h-[42px] shrink-0 items-center gap-2 border-b border-line-200 bg-surface px-5">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
          Este escrito
        </span>

        {/* Rol → rama → tipo. El orden es el de dependencia, y se lee como frase. */}
        <div className="ml-1 flex min-w-0 items-center gap-1.5">
          <Pieza>{ROLES.find((r) => r.role === userRole)?.label ?? userRole}</Pieza>
          <ChevronRight className="h-3 w-3 shrink-0 text-ink-400" strokeWidth={2.4} />
          <Pieza>{ramaLabel}</Pieza>
          <ChevronRight className="h-3 w-3 shrink-0 text-ink-400" strokeWidth={2.4} />
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-control border border-line-200 bg-canvas px-2.5 py-1 text-[12.5px] font-medium text-ink-900">
            <span className="truncate">{documentType}</span>
            <Estado />
          </span>
        </div>

        <button onClick={() => setAbierta(true)} className="btn-ghost btn-sm shrink-0 px-2">
          Cambiar
        </button>

        {/*
          El término va a la derecha y en mono: es lo que se vence mientras
          alguien decide qué hacer, y es dato citable. La autoridad competente lo
          acompaña porque son la misma pregunta — cuándo y ante quién.
        */}
        <div className="ml-auto flex shrink-0 items-center gap-3.5">
          {lookup.estado === 'ENCONTRADA' && actuacion && (
            <span className="inline-flex items-center gap-1.5">
              <Estado />
              <span className="text-meta text-ink-700">
                {actuacion.term.status === 'NO_CADUCA' ? (
                  'No caduca'
                ) : actuacion.term.status === 'NO_VERIFICADO' ? (
                  <span className="text-unverified">Término sin verificar</span>
                ) : (
                  <>
                    Término{' '}
                    <b className="font-mono font-semibold text-ink-900">
                      {actuacion.term.description}
                    </b>
                  </>
                )}
              </span>
            </span>
          )}
          {actuacion?.competentAuthority && (
            <span className="hidden text-meta text-ink-500 xl:inline">
              {actuacion.competentAuthority}
            </span>
          )}
        </div>
      </div>

      {abierta && (
        <HojaConfiguracion
          userRole={userRole}
          legalBranch={legalBranch}
          documentType={documentType}
          onCancelar={() => setAbierta(false)}
          onAplicar={(rol, rama, tipo) => {
            setUserRole(rol);
            setLegalBranch(rama);
            setDocumentType(tipo);
            setAbierta(false);
          }}
        />
      )}
    </>
  );
};

/**
 * La hoja: tres pasos numerados, sobre el documento y no junto a él.
 *
 * ES UNA HOJA Y NO UNA COLUMNA porque se abre, se decide y se cierra. Ocupar
 * ancho permanente para eso le quita al documento lo único que de verdad
 * necesita, que es sitio.
 */
const HojaConfiguracion: React.FC<{
  userRole: ActuacionRole;
  legalBranch: string;
  documentType: string;
  onCancelar: () => void;
  onAplicar: (rol: ActuacionRole, rama: string, tipo: string) => void;
}> = ({ userRole, legalBranch, documentType, onCancelar, onAplicar }) => {
  const [rol, setRol] = useState<ActuacionRole>(userRole);
  const [rama, setRama] = useState(legalBranch);
  const [tipo, setTipo] = useState(documentType);
  const [filtro, setFiltro] = useState('');

  const ramas = useCatalogBranches();
  const catalogo = useBranchActuacionesState(rama, rol);

  /*
   * Al cambiar de rama el tipo deja de pertenecer, pero NO se reemplaza por el
   * primero: se vacía y se pide elegir. Reemplazarlo en silencio es lo que hacía
   * llegar al abogado con un documento que nadie escogió, y aquí ni siquiera
   * hace falta adivinar — la hoja está abierta y él está mirando.
   */
  useEffect(() => {
    // Solo con lista en mano. En CARGANDO no se sabe, y en VACIA la lista está
    // vacía por construcción — el tipo lo dice, y comprobarlo ahí sería teatro.
    if (catalogo.estado !== 'LISTA') return;
    if (!catalogo.nombres.includes(tipo)) setTipo('');
  }, [catalogo, tipo]);

  const opciones = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    return q
      ? catalogo.actuaciones.filter((a) => a.exactName.toLowerCase().includes(q))
      : catalogo.actuaciones;
  }, [catalogo.actuaciones, filtro]);

  /*
   * Cuántas de la rama están verificadas, dicho ANTES de elegir.
   *
   * Es la cifra que le permite al abogado saber en qué terreno está pisando:
   * una rama con 86 actuaciones de las cuales 12 no tienen término comprobado no
   * es la misma rama que una con las 86 verificadas, y hasta ahora nada se lo
   * decía.
   */
  const verificadas = catalogo.actuaciones.filter((a) => a.term.status === 'VERIFICADO').length;

  return (
    <div className="relative z-20">
      <div className="surface-raised absolute left-0 right-0 top-0 max-h-[70vh] overflow-y-auto border-x-0 border-t-0 p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            Este escrito
          </span>
          <span className="text-meta text-ink-500">Configurando…</span>
          <button
            onClick={onCancelar}
            aria-label="Cerrar"
            className="ml-auto rounded-control p-1 text-ink-400 hover:bg-canvas hover:text-ink-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 1 · QUIÉN ESCRIBE */}
        <Paso n={1} titulo="Quién escribe" nota="Cambia el tono y las secciones obligatorias del escrito.">
          <div className="inline-flex rounded-control border border-line-200 bg-canvas p-0.5">
            {ROLES.map((r) => (
              <button
                key={r.role}
                onClick={() => setRol(r.role)}
                title={r.hint}
                className={`rounded-[3px] px-3 py-1.5 text-meta font-medium transition-colors ${
                  rol === r.role ? 'bg-brand-700 text-on-brand' : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </Paso>

        {/* 2 · RAMA */}
        <Paso
          n={2}
          titulo="Rama"
          nota="22 ramas. La rama decide qué actuaciones se ofrecen y con qué término."
        >
          <div className="flex flex-wrap gap-1.5">
            {ramas.map((b) => (
              <button
                key={b}
                onClick={() => setRama(b)}
                className={`rounded-control border px-2.5 py-1 text-meta transition-colors ${
                  rama === b
                    ? 'border-brand-700 bg-brand-50 font-medium text-brand-700'
                    : 'border-line-200 bg-surface text-ink-700 hover:bg-canvas'
                }`}
              >
                {BRANCH_LABELS[b] ?? b}
              </button>
            ))}
          </div>
        </Paso>

        {/* 3 · TIPO DE DOCUMENTO */}
        <Paso
          n={3}
          titulo="Tipo de documento"
          nota="Se aplica a este escrito y se recuerda para el siguiente del mismo proceso."
        >
          {/*
            NO ES UN `<select>`, y esa es la diferencia que importa. Con hasta
            noventa opciones por rama, un desplegable nativo obliga a recorrerlas
            todas; y sobre todo no puede mostrar el ESTADO DE VERIFICACIÓN de
            cada una, que es lo que el abogado necesita saber ANTES de elegir.
          */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Escriba para filtrar…"
              className="field pl-8"
              autoFocus
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-ink-400">
              {opciones.length} de {catalogo.nombres.length}
            </span>
          </div>

          {catalogo.estado === 'LISTA' && (
            <p className="mt-1.5 text-meta text-ink-500">
              <b className="font-mono font-semibold text-ink-900">{verificadas}</b> de{' '}
              <b className="font-mono font-semibold text-ink-900">{catalogo.nombres.length}</b>{' '}
              actuaciones de esta rama tienen su término verificado contra la norma.
            </p>
          )}

          <div className="mt-2 max-h-[240px] overflow-y-auto rounded-control border border-line-200">
            {catalogo.estado === 'CARGANDO' && (
              <p className="px-3 py-4 text-meta text-ink-400">Cargando el catálogo de la rama…</p>
            )}

            {catalogo.estado !== 'CARGANDO' && opciones.length === 0 && (
              <p className="px-3 py-4 text-meta text-ink-500">
                {catalogo.nombres.length === 0
                  ? 'Esta rama aún no tiene catálogo verificado. El borrador se redactará sin norma ni término confirmados.'
                  : 'Ninguna actuación coincide con ese texto.'}
              </p>
            )}

            {/*
              CADA OPCIÓN LLEVA SU ESTADO REAL, y ese es el punto del selector.
              Un `<select>` nativo no puede decir si una actuación está
              verificada; y pintar un visto verde en todas —como llegó a estar
              escrito aquí— afirma una verificación que el catálogo no respalda,
              justo sobre el dato que el abogado usa para decidir.
            */}
            {opciones.map((a) => {
              const sinVerificar = a.term.status === 'NO_VERIFICADO';
              const noCaduca = a.term.status === 'NO_CADUCA';

              return (
                <button
                  key={a.id}
                  onClick={() => setTipo(a.exactName)}
                  className={`flex w-full items-center gap-2 border-b border-line-100 px-3 py-2 text-left last:border-0 ${
                    tipo === a.exactName ? 'bg-brand-50' : 'hover:bg-canvas'
                  }`}
                >
                  <span
                    className={`flex-1 truncate text-ui ${
                      tipo === a.exactName ? 'font-medium text-brand-700' : 'text-ink-900'
                    }`}
                  >
                    {a.exactName}
                  </span>

                  <span className="shrink-0 font-mono text-[11px] text-ink-500">
                    {noCaduca ? 'No caduca' : sinVerificar ? 'sin dato' : a.term.description}
                  </span>

                  {noCaduca ? (
                    <MinusCircle className="h-3.5 w-3.5 shrink-0 text-neutral-fact" strokeWidth={2.4} />
                  ) : sinVerificar ? (
                    <CircleDashed className="h-3.5 w-3.5 shrink-0 text-unverified" strokeWidth={2.4} />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-verified" strokeWidth={2.4} />
                  )}
                </button>
              );
            })}
          </div>
        </Paso>

        <div className="mt-5 flex items-center gap-2 border-t border-line-100 pt-4">
          <button onClick={onCancelar} className="btn-ghost ml-auto">
            Cancelar
          </button>
          <button
            onClick={() => onAplicar(rol, rama, tipo)}
            disabled={!tipo}
            className="btn-primary"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

const Paso: React.FC<{ n: number; titulo: string; nota: string; children: React.ReactNode }> = ({
  n,
  titulo,
  nota,
  children
}) => (
  <section className="mb-5">
    <div className="mb-2 flex items-baseline gap-2">
      <span className="font-mono text-[11px] font-semibold text-ink-400">{n} ·</span>
      <h3 className="text-subtitle text-ink-900">{titulo}</h3>
    </div>
    {children}
    <p className="mt-2 text-meta leading-[1.5] text-ink-500">{nota}</p>
  </section>
);
