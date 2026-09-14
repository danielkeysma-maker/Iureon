import React, { useMemo, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { usePerfilDeEstilo } from '../hooks/usePerfilDeEstilo';
import { nombreDelAlcance } from '../estiloEnPantalla';
import { branchLabel } from '../../catalog/branchLabels';
import {
  TEXTO_ERROR_GLOSARIO,
  TEXTO_PROTEGIDO,
  TEXTO_SELECCION_SIN_HALLAZGOS,
  TEXTO_SIN_GLOSARIO,
  TEXTO_SIN_HALLAZGOS,
  TITULO_JERGA,
  agruparHallazgos,
  buscarJerga,
  filtrarPorSeleccion,
  reemplazarTodas,
  reemplazarUno,
  vistoEnEscritos,
  type EntradaDeJerga,
  type HallazgoDeJerga,
  type SeleccionDelAbogado
} from '../jerga';
import type { RolDelEstilo } from '../types';

/**
 * «Jerga de su firma»: el panel de «Sugerir jerga».
 *
 * ─── SIN MODELO Y SIN COSTO ────────────────────────────────────────────────
 *
 * No llama a ningún motor. Lee el glosario que la firma ya enseñó —el perfil
 * de `GET /api/estilo` para el rol y la rama del escrito, con respaldo al
 * general del rol— y lo busca en el texto con `jerga.ts`, que es puro. El
 * glosario no es del socio: cualquier usuario de la firma lo lee.
 *
 * ─── EL REEMPLAZO ES POR POSICIÓN ──────────────────────────────────────────
 *
 * «Reemplazar» cambia ESA aparición, no la primera; «Reemplazar todas (N)»
 * cambia exactamente las N de la lista. El texto nuevo sube al visor por
 * `onReemplazar`, el mismo camino que la edición a mano: queda en el lienzo, se
 * guarda con «Guardar» y sale con keepalive si se abandona sin guardar.
 *
 * ─── LA SELECCIÓN MANDA ────────────────────────────────────────────────────
 *
 * Si el abogado seleccionó un pasaje, solo se listan las expresiones de ese
 * pasaje, y si no hay ninguna se dice así, no «este borrador ya usa la jerga».
 */

interface JergaDeLaFirmaProps {
  texto: string;
  /** Las providencias que el borrador declara citar: sus tramos no se tocan. */
  citas: readonly string[];
  rol: RolDelEstilo;
  rama: string | null;
  seleccion: SeleccionDelAbogado | null;
  onQuitarSeleccion: () => void;
  onReemplazar: (textoNuevo: string, aviso: string) => void;
  onCerrar: () => void;
}

export const JergaDeLaFirma: React.FC<JergaDeLaFirmaProps> = ({ texto, citas, rol, rama, seleccion, onQuitarSeleccion, onReemplazar, onCerrar }) => {
  const estado = usePerfilDeEstilo(rol, rama);
  const respuesta = estado.respuesta;
  const [error, setError] = useState<string | null>(null);

  const glosario: EntradaDeJerga[] = useMemo(
    () => (respuesta ? respuesta.perfil.glosario.map((g) => ({ preferido: g.preferido, variantes: g.variantes, vistoEn: g.vistoEn })) : []),
    [respuesta]
  );
  const hallazgos = useMemo(() => buscarJerga(texto, glosario, citas), [texto, glosario, citas]);
  const visibles = seleccion ? filtrarPorSeleccion(texto, hallazgos, seleccion) : hallazgos;
  const grupos = agruparHallazgos(visibles);

  const uno = (h: HallazgoDeJerga) => {
    const nuevo = reemplazarUno(texto, h);
    if (nuevo === null) {
      setError('Ese pasaje cambió desde que se buscó; la lista ya se actualizó.');
      return;
    }
    setError(null);
    onReemplazar(nuevo, `Se cambió «${h.encontrado}» por «${h.reemplazo}».`);
  };

  const todas = (lista: HallazgoDeJerga[]) => {
    const r = reemplazarTodas(texto, lista);
    if (r === null) {
      setError('El texto cambió desde que se buscó; no se reemplazó nada y la lista ya se actualizó.');
      return;
    }
    setError(null);
    onReemplazar(r.texto, `Se cambiaron ${r.reemplazados} apariciones de «${lista[0].variante}» por «${lista[0].preferido}».`);
  };

  return (
    <section id="cn-jer-panel" className="cn-jer-panel" aria-label={TITULO_JERGA}>
      <div className="cn-jer-cabeza">
        <h3 className="cn-jer-titulo">{TITULO_JERGA}</h3>
        <button type="button" className="cn-jer-cerrar" onClick={onCerrar} aria-label="Cerrar la jerga de su firma">
          <X className="cn-jer-cerrar-icono" strokeWidth={2} aria-hidden />
        </button>
      </div>

      {respuesta && (
        <p className="cn-jer-alcance">
          Glosario de {nombreDelAlcance(respuesta.rol, respuesta.rama)}
          {respuesta.ramaPedida && respuesta.rama === null && respuesta.perfil.lecciones > 0
            ? ` (su firma no tiene uno propio para ${branchLabel(respuesta.ramaPedida)})`
            : ''}
          . Sin costo: no consulta a ningún modelo.
        </p>
      )}
      <p className="cn-jer-nota">{TEXTO_PROTEGIDO}</p>

      {seleccion && (
        <div className="cn-jer-seleccion">
          <span>Solo lo seleccionado en el escrito.</span>
          <button type="button" className="cn-jer-accion" onClick={onQuitarSeleccion}>
            Ver todo el borrador
          </button>
        </div>
      )}

      {error && (
        <p className="cn-jer-error" role="alert">
          {error}
        </p>
      )}

      {estado.estado === 'CARGANDO' && (
        <p className="cn-jer-estado" role="status">
          <RefreshCw className="cn-aju-girando" aria-hidden="true" />
          Leyendo el glosario de su firma…
        </p>
      )}

      {estado.estado === 'ERROR' && (
        <div className="cn-jer-error" role="alert">
          <p>{TEXTO_ERROR_GLOSARIO}</p>
          <button type="button" className="cn-jer-accion" onClick={estado.recargar}>
            Volver a intentar
          </button>
        </div>
      )}

      {estado.estado === 'LISTO' && glosario.length === 0 && <p className="cn-jer-estado">{TEXTO_SIN_GLOSARIO}</p>}

      {estado.estado === 'LISTO' && glosario.length > 0 && grupos.length === 0 && (
        <p className="cn-jer-estado cn-jer-estado--ok">
          <Check className="cn-jer-ok-icono" strokeWidth={2.2} aria-hidden />
          {seleccion ? TEXTO_SELECCION_SIN_HALLAZGOS : TEXTO_SIN_HALLAZGOS}
        </p>
      )}

      {grupos.length > 0 && (
        <ul className="cn-jer-grupos">
          {grupos.map((g) => (
            <li key={g.clave} className="cn-jer-grupo">
              <p className="cn-jer-par">
                <span className="cn-jer-variante">«{g.variante}»</span>
                <span className="cn-jer-flecha" aria-label="se prefiere">
                  →
                </span>
                <span className="cn-jer-preferido">«{g.preferido}»</span>
              </p>
              <p className="cn-jer-visto">{vistoEnEscritos(g.vistoEn)}</p>
              <ol className="cn-jer-apariciones">
                {g.hallazgos.map((h) => (
                  <li key={`${h.inicio}-${h.fin}`} className="cn-jer-aparicion">
                    <p className="cn-jer-contexto">
                      {h.partes.antes}
                      <mark className="cn-jer-marca">{h.partes.encontrado}</mark>
                      {h.partes.despues}
                    </p>
                    <button type="button" className="cn-jer-accion" onClick={() => uno(h)}>
                      Reemplazar por «{h.reemplazo}»
                    </button>
                  </li>
                ))}
              </ol>
              {g.hallazgos.length > 1 && (
                <button type="button" className="cn-jer-accion cn-jer-accion--todas" onClick={() => todas(g.hallazgos)}>
                  {`Reemplazar todas (${g.hallazgos.length})`}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
