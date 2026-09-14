import React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import type { ExpedienteEnLista } from '../types';
import { documentosEnPalabras, esUrgente, plazoEnPalabras } from '../services/casoEnPantalla';
import {
  agruparPorClienteYRama,
  clienteYRama,
  gruposAbiertosPorDefecto,
  resumenDelCliente
} from '../services/agruparCasos';
import type { MotivoDeCoincidencia, ResultadoDeBusqueda } from '../services/buscarCasos';

/**
 * LOS CASOS EN LA LISTA DE EXPEDIENTES: plana en «Esta semana», por cliente y
 * rama en «Activos» y «Cerrados».
 *
 * La maqueta (`app-expedientes.html` :65) dibuja tarjetas en «Esta semana» y
 * filas planas en las otras dos pestañas; el agrupado por cliente y rama NO
 * está en ninguna maqueta y lo pidió el dueño el 14 de septiembre. Se conserva
 * de la maqueta la tarjeta —carátula que manda, plazo en ámbar con peso— y se
 * deriva lo demás.
 *
 * «ESTA SEMANA» NO SE AGRUPA porque es una lista de pendientes: se lee de
 * arriba abajo por fecha, y partirla por cliente escondería el segundo término
 * más urgente dentro de un grupo cerrado. Por eso cada tarjeta dice ahí de
 * quién es el caso.
 *
 * LA LISTA LLEGA YA FILTRADA —pestaña, año, mes y búsqueda— desde la vista,
 * con el porqué de cada coincidencia. Aquí solo se pinta.
 */

interface PropsDeLista {
  resultados: ResultadoDeBusqueda[];
  /** Los filtros puestos, en palabras; vacío si no hay ninguno. */
  filtros: string[];
  abriendo: string | null;
  onAbrir: (id: string) => void;
  onLimpiarFiltros: () => void;
}

/* ─── LA TARJETA ──────────────────────────────────────────────────────────── */

const TarjetaDeCaso: React.FC<{
  caso: ExpedienteEnLista;
  porQue: MotivoDeCoincidencia | null;
  conClienteYRama: boolean;
  cerrado: boolean;
  abriendo: boolean;
  onAbrir: () => void;
}> = ({ caso, porQue, conClienteYRama, cerrado, abriendo, onAbrir }) => {
  /* Lo vencido manda sobre lo próximo, igual que en el aviso del caso. */
  const t = caso.terminoVencido ?? caso.proximoTermino;
  const docs = documentosEnPalabras(caso.documentos);

  return (
    <button
      type="button"
      onClick={onAbrir}
      disabled={abriendo}
      className={`cn-exp-tarjeta ${cerrado ? 'cn-exp-tarjeta--cerrado' : ''}`}
    >
      {conClienteYRama && <span className="cn-exp-tarjeta-quien">{clienteYRama(caso)}</span>}
      {/*
        UN RENGLÓN POR DATO, CORTADO CON PUNTOS SUSPENSIVOS y con el texto
        entero en `title`. El despacho y el radicado se pintan como el servidor
        los guardó; el radicado va en mono porque se copia a un escrito.
      */}
      <span className="cn-exp-tarjeta-nombre" title={caso.caratula}>
        {caso.caratula}
      </span>
      {(caso.despacho || caso.radicado) && (
        <span className="cn-exp-tarjeta-donde">
          {caso.despacho && (
            <span className="cn-exp-tarjeta-despacho" title={caso.despacho}>
              {caso.despacho}
            </span>
          )}
          {caso.radicado && (
            <span className="cn-exp-mono cn-exp-tarjeta-radicado" title={caso.radicado}>
              {caso.radicado}
            </span>
          )}
        </span>
      )}
      {/*
        POR QUÉ APARECE, cuando la tarjeta no lo deja ver: la cédula de la
        contraparte, una persona del caso, el año del radicado. Solo el campo
        que coincidió, y como se guardó.
      */}
      {porQue && (
        <span className="cn-exp-tarjeta-porque">
          Coincide con: {porQue.etiqueta}
          {porQue.conDosPuntos ? ': ' : ' '}
          <span className={porQue.mono ? 'cn-exp-mono' : undefined}>{porQue.valor}</span>
        </span>
      )}
      <span className="cn-exp-tarjeta-estado">
        {abriendo ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Abriendo el caso…
          </span>
        ) : t ? (
          <>
            <span
              className={`cn-exp-plazo ${esUrgente(t) ? 'cn-exp-plazo--urgente' : ''} ${
                t.verificado ? '' : 'cn-exp-plazo--sin-verificar'
              }`}
              title={t.verificado ? undefined : 'Término sin verificar en la agenda'}
            >
              {plazoEnPalabras(t.diasRestantes)}
            </span>
            <span>
              {t.que}
              {!t.verificado && ' · sin verificar'}
            </span>
          </>
        ) : caso.terminosLeidos ? (
          <span>Sin términos pendientes</span>
        ) : null}
        {caso.estado === 'SUSPENDIDO' && <span>Suspendido</span>}
        {docs && <span>{docs}</span>}
      </span>
    </button>
  );
};

const NingunoCoincide: React.FC<{ filtros: string[]; onLimpiarFiltros: () => void }> = ({ filtros, onLimpiarFiltros }) => (
  <div className="cn-exp-vacio" role="status">
    <p className="cn-exp-vacio-titulo">Ninguno coincide</p>
    <p className="cn-exp-vacio-texto [overflow-wrap:anywhere]">
      Ningún caso de esta pestaña coincide con {filtros.join(' · ')}. Se busca por nombre del cliente, del caso o de
      cualquier persona registrada, por cédula o NIT, por radicado y por despacho.
    </p>
    <button type="button" className="cn-ini-boton cn-ini-boton--suave cn-exp-boton" onClick={onLimpiarFiltros}>
      Limpiar filtros
    </button>
  </div>
);

/* ─── «ESTA SEMANA»: PLANA ────────────────────────────────────────────────── */

export const ListaDeLaSemana: React.FC<PropsDeLista> = ({ resultados, filtros, abriendo, onAbrir, onLimpiarFiltros }) => {
  if (resultados.length === 0) return <NingunoCoincide filtros={filtros} onLimpiarFiltros={onLimpiarFiltros} />;
  return (
    <ul className="cn-exp-tarjetas">
      {resultados.map(({ caso, porQue }) => (
        <li key={caso.id}>
          <TarjetaDeCaso
            caso={caso}
            porQue={porQue}
            conClienteYRama
            cerrado={false}
            abriendo={abriendo === caso.id}
            onAbrir={() => onAbrir(caso.id)}
          />
        </li>
      ))}
    </ul>
  );
};

/* ─── «ACTIVOS» Y «CERRADOS»: POR CLIENTE Y RAMA ──────────────────────────── */

/*
 * LO QUE CADA ABOGADO ABRIÓ O CERRÓ SE RECUERDA EN SU NAVEGADOR. Es una
 * comodidad de quien mira, no un dato de la firma: por eso `localStorage` y no
 * el servidor, y por eso todo acceso va dentro de `try` —una ventana privada o
 * un almacenamiento bloqueado lanzan, y la lista tiene que pintarse igual—.
 */
const LLAVE_DE_ABIERTOS = 'iureon.expedientes.clientesAbiertos';

const leerAbiertos = (): Record<string, boolean> => {
  try {
    const crudo = localStorage.getItem(LLAVE_DE_ABIERTOS);
    const valor: unknown = crudo ? JSON.parse(crudo) : null;
    return valor && typeof valor === 'object' && !Array.isArray(valor) ? (valor as Record<string, boolean>) : {};
  } catch {
    return {};
  }
};

const guardarAbiertos = (abiertos: Record<string, boolean>): void => {
  try {
    localStorage.setItem(LLAVE_DE_ABIERTOS, JSON.stringify(abiertos));
  } catch {
    /* Sin almacenamiento, la preferencia dura lo que dure la pantalla. */
  }
};

export const ListaPorCliente: React.FC<PropsDeLista & { cerrados: boolean }> = ({
  resultados,
  filtros,
  cerrados,
  abriendo,
  onAbrir,
  onLimpiarFiltros
}) => {
  const base = React.useId();
  const hayFiltros = filtros.length > 0;
  const grupos = React.useMemo(() => agruparPorClienteYRama(resultados.map((r) => r.caso), ''), [resultados]);
  const porQue = React.useMemo(() => new Map(resultados.map((r) => [r.caso.id, r.porQue])), [resultados]);
  const porDefecto = React.useMemo(() => gruposAbiertosPorDefecto(grupos, hayFiltros), [grupos, hayFiltros]);
  const [preferencias, setPreferencias] = React.useState(leerAbiertos);
  /*
   * CON UN FILTRO PUESTO TODO SE ABRE, aunque el abogado hubiera cerrado ese
   * cliente: si no, buscaría un radicado y no lo vería. Lo que cierre mientras
   * filtra no se guarda —dura hasta que cambien los filtros— para no esconderle
   * ese cliente la próxima vez que entre sin filtrar.
   */
  const claveDeFiltros = filtros.join('|');
  const [cerradosAlBuscar, setCerradosAlBuscar] = React.useState<ReadonlySet<string>>(new Set());
  React.useEffect(() => {
    setCerradosAlBuscar(new Set());
  }, [claveDeFiltros]);

  const estaAbierto = (clave: string): boolean =>
    hayFiltros ? !cerradosAlBuscar.has(clave) : preferencias[clave] ?? porDefecto.has(clave);

  const alternar = (clave: string): void => {
    if (hayFiltros) {
      setCerradosAlBuscar((previo) => {
        const siguiente = new Set(previo);
        if (siguiente.has(clave)) siguiente.delete(clave);
        else siguiente.add(clave);
        return siguiente;
      });
      return;
    }
    const siguiente = { ...preferencias, [clave]: !estaAbierto(clave) };
    setPreferencias(siguiente);
    guardarAbiertos(siguiente);
  };

  if (grupos.length === 0) return <NingunoCoincide filtros={filtros} onLimpiarFiltros={onLimpiarFiltros} />;

  return (
    <div className="cn-exp-clientes">
      {grupos.map((g, i) => {
        const abierto = estaAbierto(g.clave);
        const id = `${base}-cliente-${i}`;
        return (
          <section key={g.clave} className="cn-exp-cliente" aria-labelledby={`${id}-cabeza`}>
            <h2 className="cn-exp-cliente-h">
              <button
                type="button"
                id={`${id}-cabeza`}
                className={`cn-exp-cliente-cabeza ${g.sinCliente ? 'cn-exp-cliente-cabeza--sin' : ''}`}
                aria-expanded={abierto}
                aria-controls={id}
                onClick={() => alternar(g.clave)}
              >
                <ChevronDown className="cn-exp-cliente-flecha h-5 w-5" aria-hidden="true" />
                <span className="cn-exp-cliente-nombre" title={g.etiqueta}>
                  {g.etiqueta}
                </span>
                <span className="cn-exp-cliente-cuenta">{resumenDelCliente(g)}</span>
              </button>
            </h2>
            <div id={id} className="cn-exp-cliente-cuerpo" hidden={!abierto}>
              {g.ramas.map((r) => (
                <div key={r.clave} className="cn-exp-rama">
                  <h3 className={`cn-exp-rama-nombre ${r.sinRama ? 'cn-exp-rama-nombre--sin' : ''}`}>{r.etiqueta}</h3>
                  <ul className="cn-exp-tarjetas">
                    {r.casos.map((caso) => (
                      <li key={caso.id}>
                        <TarjetaDeCaso
                          caso={caso}
                          porQue={porQue.get(caso.id) ?? null}
                          conClienteYRama={false}
                          cerrado={cerrados}
                          abriendo={abriendo === caso.id}
                          onAbrir={() => onAbrir(caso.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
