import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { estiloApi } from '../services/estilo.api';
import {
  MENSAJE_GUARDADO,
  MENSAJE_SOLO_SOCIO,
  QUE_NO_SE_GUARDA,
  QUE_SE_GUARDA,
  TEXTO_BOTON_ENSENAR,
  TEXTO_BOTON_LEER,
  TEXTO_ENLACE_AJUSTES,
  contenidoConLoMarcado,
  itemsDeLaLectura,
  motivoLegible,
  pieDelDialogo,
  subtituloDelDialogo
} from '../estiloEnPantalla';
import { irAlEstiloDeLaFirma } from '../irAlEstilo';
import type { ItemDescartado, LecturaDelFormato, RolDelEstilo } from '../types';

/**
 * «Enseñar este formato». Artboard de `public/handoff/app-redaccion-revision.html`
 * (líneas ~436–462).
 *
 * ─── DOS PASOS, Y SOLO EL SEGUNDO GUARDA ───────────────────────────────────
 *
 * «Leer el formato» cobra $100, sanea el escrito en el servidor ANTES de que lo
 * lea el motor y devuelve una vista previa: lo que se guardaría, con una
 * casilla por elemento, y lo que la guarda descartó, con su motivo. Nada queda
 * guardado hasta «Guardar el formato». El artboard pasa de la explicación al
 * botón de guardar sin mostrar qué se guarda; aquí la vista previa va en medio
 * porque el socio está enseñando algo que usará TODA la firma, y tiene derecho
 * a ver exactamente qué es antes de que lo usen sus colegas.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ CAMBIA, con la razón ───────────────────
 *
 * · El subtítulo nombra el rol y la rama: el formato no es de «los próximos
 *   borradores», es de los de ese rol en esa rama.
 * · «Qué se guarda» añade el vocabulario y «Qué no se guarda» el texto del
 *   escrito: los dos son verdad y el socio los tiene que leer.
 * · «Aprendido» no aparece en ninguna parte. El éxito dice «Guardado».
 */

type Paso = 'INICIO' | 'LEYENDO' | 'VISTA' | 'GUARDANDO' | 'GUARDADO';

interface EnsenarFormatoDialogProps {
  abierto: boolean;
  onCerrar: () => void;
  /** El texto del escrito tal como está en el lienzo. Se manda a leer; no se guarda. */
  texto: string;
  documentType: string;
  rol: RolDelEstilo;
  rama: string | null;
  puedeEnsenar: boolean;
  /** Tras cobrar la lectura, para que la barra lateral relea el saldo. */
  onSaldoCambiado?: () => void;
}

export const EnsenarFormatoDialog: React.FC<EnsenarFormatoDialogProps> = ({
  abierto,
  onCerrar,
  texto,
  documentType,
  rol,
  rama,
  puedeEnsenar,
  onSaldoCambiado
}) => {
  const [paso, setPaso] = useState<Paso>('INICIO');
  const [lectura, setLectura] = useState<LecturaDelFormato | null>(null);
  const [desmarcadas, setDesmarcadas] = useState<Set<string>>(new Set());
  const [descartadosAlGuardar, setDescartadosAlGuardar] = useState<ItemDescartado[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    setPaso('INICIO');
    setLectura(null);
    setDesmarcadas(new Set());
    setDescartadosAlGuardar([]);
    setError(null);
  }, [abierto]);

  /* El servidor resuelve rol y rama con la ficha; tras leer, se dicen los suyos. */
  const rolMostrado = lectura?.rol ?? rol;
  const ramaMostrada = lectura ? lectura.rama : rama;

  const items = useMemo(() => (lectura ? itemsDeLaLectura(lectura.contenido) : []), [lectura]);
  const grupos = useMemo(() => {
    const orden: string[] = [];
    const porGrupo = new Map<string, typeof items>();
    for (const item of items) {
      if (!porGrupo.has(item.grupo)) {
        porGrupo.set(item.grupo, []);
        orden.push(item.grupo);
      }
      porGrupo.get(item.grupo)!.push(item);
    }
    return orden.map((g) => ({ grupo: g, items: porGrupo.get(g)! }));
  }, [items]);
  const marcadas = items.filter((i) => !desmarcadas.has(i.clave)).length;

  const leer = async () => {
    setError(null);
    setPaso('LEYENDO');
    try {
      const resultado = await estiloApi.leer({ texto, rol, rama, documentType });
      setLectura(resultado);
      setDesmarcadas(new Set());
      setPaso('VISTA');
      onSaldoCambiado?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el formato. No se descontó saldo.');
      setPaso('INICIO');
    }
  };

  const guardar = async () => {
    if (!lectura) return;
    setError(null);
    setPaso('GUARDANDO');
    try {
      const r = await estiloApi.guardar({
        contenido: contenidoConLoMarcado(lectura.contenido, desmarcadas),
        rol: lectura.rol,
        rama: lectura.rama,
        documentType,
        fuente: 'BORRADOR'
      });
      setDescartadosAlGuardar(r.descartados);
      setPaso('GUARDADO');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el formato.');
      setPaso('VISTA');
    }
  };

  const alternar = (clave: string) =>
    setDesmarcadas((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(clave)) siguiente.delete(clave);
      else siguiente.add(clave);
      return siguiente;
    });

  const acciones =
    paso === 'GUARDADO' ? (
      <button type="button" onClick={onCerrar} className="cn-est-boton cn-est-boton--primario">
        Cerrar
      </button>
    ) : (
      <>
        <button type="button" onClick={onCerrar} className="cn-est-boton" disabled={paso === 'LEYENDO' || paso === 'GUARDANDO'}>
          Cancelar
        </button>
        {paso === 'INICIO' || paso === 'LEYENDO' ? (
          <button
            type="button"
            onClick={() => void leer()}
            disabled={!puedeEnsenar || paso === 'LEYENDO' || texto.trim().length === 0}
            className="cn-est-boton cn-est-boton--primario"
          >
            {paso === 'LEYENDO' ? (
              <>
                <Loader2 className="cn-est-girando" strokeWidth={2} aria-hidden /> Leyendo el formato…
              </>
            ) : (
              TEXTO_BOTON_LEER
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={marcadas === 0 || paso === 'GUARDANDO'}
            className="cn-est-boton cn-est-boton--primario"
          >
            {paso === 'GUARDANDO' ? 'Guardando…' : 'Guardar el formato'}
          </button>
        )}
      </>
    );

  const nota = <p className="cn-est-nota">{pieDelDialogo(rolMostrado, ramaMostrada)}</p>;
  /*
   * LA PROMESA DEL PIE, CON SU PUERTA. Solo antes de leer y después de guardar:
   * en la vista previa la lectura ya se cobró y salir la descartaría.
   */
  const enlaceAjustes = (
    <button
      type="button"
      className="cn-est-enlace"
      onClick={() => {
        onCerrar();
        irAlEstiloDeLaFirma();
      }}
    >
      {TEXTO_ENLACE_AJUSTES}
    </button>
  );

  return (
    <div className="cn-est-dialogos">
      <Dialog
        abierto={abierto}
        onCerrar={onCerrar}
        titulo={TEXTO_BOTON_ENSENAR}
        subtitulo={subtituloDelDialogo(rolMostrado, ramaMostrada)}
        tamano="M"
        hayCambiosSinGuardar={paso === 'VISTA' || paso === 'LEYENDO' || paso === 'GUARDANDO'}
        onIntentoDeCerrarConCambios={() => setError('Guarde el formato o pulse «Cancelar» para descartar esta lectura.')}
        pieIzquierda="Se aplica a toda la firma"
        acciones={acciones}
      >
        <div className="cn-est-cuerpo">
          {(paso === 'INICIO' || paso === 'LEYENDO') && (
            <>
              <section>
                <h3 className="cn-est-titulo">Qué se guarda</h3>
                <ul className="cn-est-lista">
                  {QUE_SE_GUARDA.map((t) => (
                    <li key={t} className="cn-est-fila">
                      <Check className="cn-est-icono cn-est-icono--si" strokeWidth={2.2} aria-hidden />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="cn-est-titulo">Qué no se guarda</h3>
                <ul className="cn-est-lista">
                  {QUE_NO_SE_GUARDA.map((t) => (
                    <li key={t} className="cn-est-fila cn-est-fila--no">
                      <X className="cn-est-icono cn-est-icono--no" strokeWidth={2} aria-hidden />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </section>
              {!puedeEnsenar && <p className="cn-est-aviso">{MENSAJE_SOLO_SOCIO}</p>}
              {nota}
              {paso === 'INICIO' && enlaceAjustes}
            </>
          )}

          {(paso === 'VISTA' || paso === 'GUARDANDO') && lectura && (
            <>
              <section>
                <h3 className="cn-est-titulo">Esto es lo que se guardaría</h3>
                <p className="cn-est-ayuda">
                  Desmarque lo que no quiera guardar.
                  {lectura.cobrado > 0 && <> La lectura descontó ${lectura.cobrado.toLocaleString('es-CO')} de su saldo.</>}
                </p>
                <div className="cn-est-grupos">
                  {grupos.map(({ grupo, items: delGrupo }) => (
                    <fieldset key={grupo} className="cn-est-grupo">
                      <legend className="cn-est-grupo-titulo">{grupo}</legend>
                      {delGrupo.map((item) => (
                        <label key={item.clave} className="cn-est-casilla">
                          <input
                            type="checkbox"
                            checked={!desmarcadas.has(item.clave)}
                            onChange={() => alternar(item.clave)}
                            disabled={paso === 'GUARDANDO'}
                          />
                          <span className="cn-est-casilla-texto">{item.texto}</span>
                        </label>
                      ))}
                    </fieldset>
                  ))}
                </div>
              </section>
              {lectura.descartados.length > 0 && (
                <section>
                  <h3 className="cn-est-titulo">No se guardó</h3>
                  <ul className="cn-est-lista">
                    {lectura.descartados.map((d, i) => (
                      <li key={`${d.campo}-${i}`} className="cn-est-descartado">
                        <span className="cn-est-descartado-texto">«{d.texto}»</span>
                        <span className="cn-est-descartado-motivo">{motivoLegible(d)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {nota}
            </>
          )}

          {paso === 'GUARDADO' && (
            <>
              <p className="cn-est-exito" role="status">
                <Check className="cn-est-icono cn-est-icono--si" strokeWidth={2.2} aria-hidden />
                {MENSAJE_GUARDADO}
              </p>
              {enlaceAjustes}
              {descartadosAlGuardar.length > 0 && (
                <section>
                  <h3 className="cn-est-titulo">No se guardó</h3>
                  <ul className="cn-est-lista">
                    {descartadosAlGuardar.map((d, i) => (
                      <li key={`${d.campo}-${i}`} className="cn-est-descartado">
                        <span className="cn-est-descartado-texto">«{d.texto}»</span>
                        <span className="cn-est-descartado-motivo">{motivoLegible(d)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {error && (
            <p className="cn-est-alerta" role="alert">
              {error}
            </p>
          )}
        </div>
      </Dialog>
    </div>
  );
};
