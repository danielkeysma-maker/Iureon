import React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import type { ExpedienteEnLista } from '../types';
import { documentosEnPalabras, esUrgente, plazoEnPalabras } from '../services/casoEnPantalla';
import {
  agruparPorClienteYRama,
  clienteYRama,
  filtrarCasos,
  gruposAbiertosPorDefecto,
  resumenDelCliente
} from '../services/agruparCasos';

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
 */

interface PropsDeLista {
  casos: ExpedienteEnLista[];
  busqueda: string;
  abriendo: string | null;
  onAbrir: (id: string) => void;
  onBorrarBusqueda: () => void;
}

/* ─── LA TARJETA ──────────────────────────────────────────────────────────── */

const TarjetaDeCaso: React.FC<{
  caso: ExpedienteEnLista;
  conClienteYRama: boolean;
  cerrado: boolean;
  abriendo: boolean;
  onAbrir: () => void;
}> = ({ caso, conClienteYRama, cerrado, abriendo, onAbrir }) => {
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

const NingunoCoincide: React.FC<{ busqueda: string; onBorrarBusqueda: () => void }> = ({ busqueda, onBorrarBusqueda }) => (
  <div className="cn-exp-vacio" role="status">
    <p className="cn-exp-vacio-titulo">Ninguno coincide</p>
    <p className="cn-exp-vacio-texto [overflow-wrap:anywhere]">
      Ningún caso de esta pestaña tiene «{busqueda.trim()}» en el cliente, el nombre, el radicado o el despacho.
    </p>
    <button type="button" className="cn-ini-boton cn-ini-boton--suave cn-exp-boton" onClick={onBorrarBusqueda}>
      Borrar la búsqueda
    </button>
  </div>
);

/* ─── «ESTA SEMANA»: PLANA ────────────────────────────────────────────────── */

export const ListaDeLaSemana: React.FC<PropsDeLista> = ({ casos, busqueda, abriendo, onAbrir, onBorrarBusqueda }) => {
  const visibles = filtrarCasos(casos, busqueda);
  if (visibles.length === 0) return <NingunoCoincide busqueda={busqueda} onBorrarBusqueda={onBorrarBusqueda} />;
  return (
    <ul className="cn-exp-tarjetas">
      {visibles.map((caso) => (
        <li key={caso.id}>
          <TarjetaDeCaso
            caso={caso}
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
  casos,
  busqueda,
  cerrados,
  abriendo,
  onAbrir,
  onBorrarBusqueda
}) => {
  const base = React.useId();
  const hayBusqueda = busqueda.trim() !== '';
  const grupos = React.useMemo(() => agruparPorClienteYRama(casos, busqueda), [casos, busqueda]);
  const porDefecto = React.useMemo(() => gruposAbiertosPorDefecto(grupos, hayBusqueda), [grupos, hayBusqueda]);
  const [preferencias, setPreferencias] = React.useState(leerAbiertos);
  /*
   * CON BÚSQUEDA TODO SE ABRE, aunque el abogado hubiera cerrado ese cliente:
   * si no, buscaría un radicado y no lo vería. Lo que cierre mientras busca no
   * se guarda —dura hasta que cambie la búsqueda— para no esconderle ese
   * cliente la próxima vez que entre sin buscar.
   */
  const [cerradosAlBuscar, setCerradosAlBuscar] = React.useState<ReadonlySet<string>>(new Set());
  React.useEffect(() => {
    setCerradosAlBuscar(new Set());
  }, [busqueda]);

  const estaAbierto = (clave: string): boolean =>
    hayBusqueda ? !cerradosAlBuscar.has(clave) : preferencias[clave] ?? porDefecto.has(clave);

  const alternar = (clave: string): void => {
    if (hayBusqueda) {
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

  if (grupos.length === 0) return <NingunoCoincide busqueda={busqueda} onBorrarBusqueda={onBorrarBusqueda} />;

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
