import React from 'react';
import { Sparkles } from 'lucide-react';
import { rotuloDeExpediente, useExpedientes } from '../../expedientes/useExpedientes';
import { useActuacionLookup } from '../../catalog/hooks/useActuacion';
import { useBranchActuacionesState } from '../../catalog/hooks/useBranchActuaciones';
import { GuiaEligeActuacionDialog } from './GuiaEligeActuacionDialog';
import { ActuacionPropiaDialog } from './ActuacionPropiaDialog';
import { EscritoSinNombreDialog } from './EscritoSinNombreDialog';
import { ActuacionElegida } from './ActuacionElegida';
import { useCatalogBranchesState } from '../../catalog/hooks/useCatalogBranches';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import type { ActuacionRole } from '../../catalog/types';
import { esTituloDeTrabajo } from '../../catalog/tituloDeTrabajo';
import { estadoDeLaFicha, ordenarParaLaLista } from '../services/fichaEnLaLista';
import { desacuerdoDeRama, ramaAlElegirCaso } from '../services/ramaDelCaso';

/**
 * «Qué va a presentar» en el teléfono. Artboard de 375 px (líneas 248–283 de
 * `public/handoff/app-redaccion-revision.html`).
 *
 * ─── LAS TRES LISTAS A LA VISTA, Y NATIVAS ──────────────────────────────────
 *
 * La versión anterior comprimía la configuración en dos chips con un «Cambiar»
 * que abría las listas. El artboard nuevo las pone a la vista, una debajo de la
 * otra, porque en el paso 1 del asistente elegir ES lo que se está haciendo. Son
 * `<select>` del sistema: se abren a pantalla completa, buscan con el teclado
 * del teléfono y agrupan «por remisión» con su cabecera.
 *
 * Con la actuación elegida se pliegan en la misma tarjeta que el escritorio.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · «$300» en «No sé cómo se llama». La orientación desde Redacción es gratis
 *   diez veces al día; este componente no conoce el cupo y no afirma un precio.
 * · «148 actuaciones en esta rama». La lista de ramas no trae el conteo.
 * · «Siguiente · qué pasó». El asistente es una sola columna que se desplaza;
 *   un botón que solo baja la página partiría en pantallas lo que es un
 *   formulario.
 */

interface WorkshopConfigMobileProps {
  userRole: ActuacionRole;
  setUserRole: (role: ActuacionRole) => void;
  legalBranch: string;
  setLegalBranch: (branch: string) => void;
  documentType: string;
  setDocumentType: (type: string) => void;
  /** Los hechos del cuadro de instrucción: la guía orienta sobre ESOS y no sobre otros. */
  hechos: string;
  setHechos: (texto: string) => void;
}

/*
 * LAS TRES SALIDAS DE SERVICIO TAMBIÉN AQUÍ, con los mismos diálogos que el
 * escritorio. La lista es un `<select>` del sistema, así que viajan como
 * opciones con un valor centinela que `elegirTipo` intercepta. Un centinela
 * NUNCA se guarda como tipo de documento.
 */
const OPCION_GUIA = '__QUE_LA_GUIA_ELIJA__';
const OPCION_PROPIA = '__ESCRIBIR_EL_NOMBRE__';
const OPCION_SIN_NOMBRE = '__SIN_NOMBRE_DE_ACTUACION__';

const ROL_CORTO: Record<ActuacionRole, string> = {
  LITIGANTE: 'Litigante',
  DESPACHO: 'Despacho',
  SECRETARIA: 'Secretaría'
};

export const WorkshopConfigMobile: React.FC<WorkshopConfigMobileProps> = ({
  userRole,
  setUserRole,
  legalBranch,
  setLegalBranch,
  documentType,
  setDocumentType,
  hechos,
  setHechos
}) => {
  const [cambiando, setCambiando] = React.useState(false);
  const [guiaAbierta, setGuiaAbierta] = React.useState(false);
  const [propiaAbierta, setPropiaAbierta] = React.useState(false);
  const [sinNombreAbierto, setSinNombreAbierto] = React.useState(false);
  /** Sube al crear una actuación propia: obliga a releer la lista de la rama. */
  const [recarga, setRecarga] = React.useState(0);
  const catalogo = useBranchActuacionesState(legalBranch, userRole, recarga);
  const ficha = useActuacionLookup(documentType, legalBranch);
  const ramasEstado = useCatalogBranchesState();

  /* Elegir pliega las listas; se ancla al tipo, que solo cambia cuando alguien elige. */
  React.useEffect(() => {
    setCambiando(false);
  }, [documentType]);

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

  /* Mismo orden y mismos bloques que el escritorio: alfabético, propias y luego prestadas. */
  const ordenadas = ordenarParaLaLista(catalogo.actuaciones);
  const propias = ordenadas.filter((a) => !a.porRemision);
  const prestadas = ordenadas.filter((a) => a.porRemision);

  const plegada = Boolean(documentType) && !cambiando;

  return (
    <div className="cn-red-movil">
      {plegada ? (
        <ActuacionElegida
          quienFirma={ROL_CORTO[userRole]}
          rama={BRANCH_LABELS[legalBranch] ?? legalBranch}
          documentType={documentType}
          ficha={ficha}
          onCambiar={() => setCambiando(true)}
        />
      ) : (
        <div className="cn-red-movil-campos">
          <label className="cn-red-movil-campo">
            <span className="cn-red-rotulo">Quién firma</span>
            <select value={userRole} onChange={(e) => setUserRole(e.target.value as ActuacionRole)} className="cn-red-select">
              {(Object.keys(ROL_CORTO) as ActuacionRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROL_CORTO[r]}
                </option>
              ))}
            </select>
          </label>

          <label className="cn-red-movil-campo">
            <span className="cn-red-rotulo">Rama</span>
            <select value={legalBranch} onChange={(e) => setLegalBranch(e.target.value)} className="cn-red-select">
              {ramasEstado.ramas.map((b) => (
                <option key={b} value={b}>
                  {BRANCH_LABELS[b] ?? b}
                </option>
              ))}
            </select>
          </label>

          <label className="cn-red-movil-campo">
            <span className="cn-red-rotulo">Actuación</span>
            <select value={documentType} onChange={(e) => elegirTipo(e.target.value)} className="cn-red-select">
              <option value="">Elija la actuación…</option>
              {/*
                LAS TRES SALIDAS, ANTES DE TODA FICHA y en su propio grupo, en el
                mismo orden que el escritorio: de más a menos respaldo.
              */}
              <optgroup label="Si no está en la lista">
                <option value={OPCION_GUIA}>No sé cuál es: que la guía la proponga…</option>
                <option value={OPCION_PROPIA}>No está en la lista: la escribo yo…</option>
                <option value={OPCION_SIN_NOMBRE}>Redactar sin actuación…</option>
              </optgroup>
              {/*
                EL ESTADO VA EN LA OPCIÓN, con el artículo cuando el fundamento lo
                trae. Un `<option>` no admite estilos, así que es texto.
              */}
              <optgroup label="Actuaciones de esta rama">
                {propias.map((a) => {
                  const estado = estadoDeLaFicha(a, esTituloDeTrabajo(a.exactName));
                  return (
                    <option key={a.id} value={a.exactName}>
                      {a.exactName} · {[estado.articulo, estado.texto].filter(Boolean).join(' · ')}
                    </option>
                  );
                })}
              </optgroup>
              {/*
                El <select> nativo trae <optgroup> de fábrica, así que el aviso de
                lo prestado va UNA vez encima del bloque, con la frase del servidor.
              */}
              {prestadas.length > 0 && (
                <optgroup label={prestadas[0].porRemision?.marca ?? 'por remisión del CGP'}>
                  {prestadas.map((a) => (
                    <option key={a.id} value={a.exactName}>
                      {a.exactName}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          {/*
            SIN ACTUACIÓN NO SE GENERA, y el aviso lo dice antes del botón. No
            promete que «se puede redactar igual»: el botón está apagado.
          */}
          {!documentType && (
            <p className="cn-red-sin-actuacion">
              Sin actuación elegida no se puede generar: es la que trae el artículo y el término verificados.
            </p>
          )}

          {/* La guía, a un toque: es la salida de quien no sabe qué elegir, y en una lista nativa queda escondida. */}
          <button type="button" onClick={() => setGuiaAbierta(true)} className="cn-red-servicio cn-red-servicio--suelto">
            <Sparkles className="cn-red-servicio-icono" strokeWidth={1.8} aria-hidden />
            <span className="cn-red-fila-textos">
              <span className="cn-red-servicio-nombre">No sé cuál es: que la guía la proponga</span>
              <span className="cn-red-fila-detalle">Cuente los hechos y la guía le propone actuaciones del catálogo.</span>
            </span>
          </button>

          {documentType && (
            <button type="button" onClick={() => setCambiando(false)} className="cn-red-listo">
              Dejar «{documentType}»
            </button>
          )}
        </div>
      )}

      <GuiaEligeActuacionDialog
        abierto={guiaAbierta}
        onCerrar={() => setGuiaAbierta(false)}
        legalBranch={legalBranch}
        hechos={hechos}
        setHechos={setHechos}
        onElegir={(exactName, branch) => {
          /* La rama que manda es la de la candidata; ver WorkshopConfigBar. */
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
          setRecarga((n) => n + 1);
          setDocumentType(exactName);
          setPropiaAbierta(false);
        }}
      />
    </div>
  );
};

/**
 * «De qué caso» en el teléfono. Mismo control que el escritorio y en el mismo
 * sitio del paso 1, y la misma regla: la rama del caso se propone solo al
 * cambiar el caso aquí y solo si no hay actuación elegida; si no coincide, se
 * avisa sin bloquear. Ver `SelectorDeCasoDeRedaccion`.
 */
interface SelectorDeCasoMovilProps {
  expedienteId: string;
  setExpedienteId: (id: string) => void;
  legalBranch: string;
  setLegalBranch: (branch: string) => void;
  documentType: string;
}

export const SelectorDeCasoMovil: React.FC<SelectorDeCasoMovilProps> = ({
  expedienteId,
  setExpedienteId,
  legalBranch,
  setLegalBranch,
  documentType
}) => {
  const expedientes = useExpedientes();
  if (expedientes.length === 0) return null;

  const caso = expedientes.find((e) => e.id === expedienteId) ?? null;
  const desacuerdo = caso ? desacuerdoDeRama(caso.rama, legalBranch, BRANCH_LABELS) : null;

  const elegirCaso = (id: string) => {
    setExpedienteId(id);
    const elegido = expedientes.find((e) => e.id === id);
    const rama = elegido ? ramaAlElegirCaso(elegido.rama, legalBranch, Boolean(documentType), BRANCH_LABELS) : null;
    if (rama) setLegalBranch(rama);
  };

  return (
    <div className="cn-red-caso">
      <label className="cn-red-movil-campo">
        <span className="cn-red-rotulo">De qué caso</span>
        <select value={expedienteId} onChange={(e) => elegirCaso(e.target.value)} className="cn-red-select">
          <option value="">Sin expediente</option>
          {expedientes.map((e) => (
            <option key={e.id} value={e.id}>
              {rotuloDeExpediente(e)}
            </option>
          ))}
        </select>
        <span className="cn-red-nota">
          El borrador queda contado dentro del caso, y si el caso tiene documentos cargados el escrito nace con lo que ellos dicen.
        </span>
      </label>
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
