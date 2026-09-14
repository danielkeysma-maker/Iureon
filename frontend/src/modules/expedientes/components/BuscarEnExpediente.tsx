import React from 'react';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import { expedientesApi, type PasajeDelExpediente } from '../services/expedientes.api';
import { relevanciaEnPalabras } from '../services/casoEnPantalla';
import type { ExpedienteConDetalle } from '../types';

/**
 * BUSCAR DENTRO DEL CASO.
 *
 * Derivado de «Buscar dentro» de `app-carpetas-y-vista-previa.html` (:336),
 * que la maqueta pone en el lector; aquí vive sobre las carpetas porque la
 * búsqueda lee TODO el caso, no un documento.
 *
 * ─── POR QUÉ ESTO ANTES QUE LAS CARPETAS ───────────────────────────────────
 *
 * Un expediente de trescientas páginas no se navega: se pregunta. El abogado
 * no recuerda en qué carpeta guardó el párrafo, recuerda lo que decía.
 *
 * ─── NO BUSCA POR PALABRA EXACTA, Y ESO HAY QUE DECIRLO ────────────────────
 *
 * Es búsqueda por SIGNIFICADO: «no entregó el inmueble» encuentra un pasaje que
 * dice «se abstuvo de restituir el bien». Quien espera la palabra literal y no
 * la encuentra concluye que la búsqueda está rota, así que se dice antes.
 *
 * ─── LO QUE LA MAQUETA DIBUJA Y AQUÍ NO ESTÁ ───────────────────────────────
 *
 * «Página 3» en cada resultado y «Citar la página 3»: el índice guarda
 * fragmentos sin página, y no hay camino para llevar un pasaje a un borrador.
 *
 * ─── NO CUESTA SALDO ───────────────────────────────────────────────────────
 *
 * Es la consulta contra un índice que ya está pagado; no llama a ningún modelo
 * de lenguaje. Se dice, porque en la pestaña de al lado el interrogatorio sí
 * cobra y el abogado no tiene por qué adivinar cuál es cuál.
 */
export const BuscarEnExpediente: React.FC<{ expediente: ExpedienteConDetalle }> = ({ expediente }) => {
  const [consulta, setConsulta] = React.useState('');
  const [buscando, setBuscando] = React.useState(false);
  const [error, setError] = React.useState('');
  const [pasajes, setPasajes] = React.useState<PasajeDelExpediente[] | null>(null);

  const buscar = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (consulta.trim().length < 3) return;
    setBuscando(true);
    setError('');
    try {
      const r = await expedientesApi.buscar(expediente.id, consulta.trim());
      /*
       * «No se pudo buscar» NO es «no hay resultados». Sin proveedor o sin
       * índice, decir «nada coincide» dejaría al abogado creyendo que su
       * expediente no habla de lo que preguntó.
       */
      if (r.estado !== 'OK') {
        setPasajes(null);
        setError(r.razon ?? 'La búsqueda no está disponible en este momento.');
        return;
      }
      setPasajes(r.pasajes);
    } catch (err) {
      setPasajes(null);
      setError((err as Error).message);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <section className="cn-exp-buscar" aria-label="Buscar dentro del caso">
      <h2 className="cn-exp-h3">Buscar dentro del caso</h2>
      <p className="cn-exp-bajada-2">
        Por significado, no por palabra exacta: «no entregó el inmueble» encuentra un pasaje que dice «se abstuvo de
        restituir el bien». No consume saldo.
      </p>

      <form onSubmit={buscar} className="cn-exp-buscar-form">
        <div className="cn-exp-filtro">
          <Search className="cn-exp-filtro-icono h-4 w-4" aria-hidden="true" />
          <label className="sr-only" htmlFor="buscar-expediente">
            Qué busca
          </label>
          <input
            id="buscar-expediente"
            className="cn-exp-entrada cn-exp-entrada--con-icono"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="la entrega del inmueble, el pago de los cánones…"
          />
        </div>
        <button
          type="submit"
          className="cn-ini-boton cn-ini-boton--primario cn-exp-boton"
          disabled={buscando || consulta.trim().length < 3}
        >
          {buscando ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Buscando" /> : 'Buscar'}
        </button>
      </form>

      {error && (
        <p className="cn-error" role="alert">
          <AlertCircle className="h-4 w-4" />
          <span className="min-w-0 [overflow-wrap:anywhere]">{error}</span>
        </p>
      )}

      {pasajes !== null && pasajes.length === 0 && (
        <p className="cn-exp-nota">
          Nada en este caso habla de eso. Si el documento no está agregado, la búsqueda no lo ve: revise abajo qué hay
          dentro.
        </p>
      )}

      {pasajes !== null && pasajes.length > 0 && (
        <ul className="cn-exp-pasajes">
          {pasajes.map((p, i) => (
            <li key={i} className="cn-exp-pasaje">
              {/*
                EL DOCUMENTO VA PRIMERO Y NO AL PIE. Un pasaje sin saber de dónde
                sale no se puede usar: el abogado necesita poder abrir ESE
                documento y leer alrededor.
              */}
              <p className="cn-exp-pasaje-cabeza">
                <span className="cn-exp-fuerte [overflow-wrap:anywhere]">{p.documento}</span>
                <span className="cn-exp-pasaje-relevancia">{relevanciaEnPalabras(p.similitud)}</span>
              </p>
              <p className="cn-exp-pasaje-texto font-legal [overflow-wrap:anywhere]">«{p.texto}»</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
