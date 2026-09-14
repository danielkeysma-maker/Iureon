import React from 'react';
import { Dialog } from '../../../design/Dialog';
import { branchLabel } from '../../catalog/branchLabels';
import { adminApi, type CatalogoMaestro } from '../admin.api';
import { cifra } from '../consolaEnPantalla';

/**
 * Catálogo maestro.
 * Cara nueva: `public/handoff/app-consola-de-operacion.html`, artboard 5 del
 * archivo (el de 900 px: cuatro cifras, «Reparto por rama» con las tres primeras
 * y «y N ramas más», «Reparto por rol · Quién firma el documento.», «Lo que
 * todavía no se puede hacer desde aquí» en tres tarjetas ámbar y la nota final
 * de lo que operación sabe y no sabe).
 *
 * ─── LO QUE LLEGA DEL SERVIDOR SON CUENTAS, NUNCA CONTENIDO ────────────────
 *
 * La consulta de la curaduría selecciona dos columnas —qué firma y qué
 * actuación— y ninguna de texto. Lo que no se lee no se puede filtrar por
 * descuido: la frontera vive en el `select`, no en este componente.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ ES DISTINTO, con la razón ──────────────
 *
 * · «con artículo comprobado / sin artículo confirmado»: el maestro cuenta
 *   TÉRMINOS verificados (`conTerminoVerificado`, `sinVerificar`), no artículos.
 *   Rotular una cifra con lo que no mide es exactamente el defecto que esta casa
 *   persigue en el catálogo.
 * · Las tres tarjetas ámbar se construyen como PENDIENTES DECLARADOS, no como
 *   botones: publicar no propaga nada (el maestro es un artefacto de
 *   compilación), la derogatoria no tiene campo, y las propuestas de las firmas
 *   no tienen tabla ni flujo. Un botón peligroso que no hace nada enseña a pulsarlo.
 *
 * ─── Y LO QUE SE AÑADIÓ (derivado) ─────────────────────────────────────────
 *
 * El alcance de la curaduría (cuántas firmas, cuántas verificaciones) y «las que
 * más firmas han corregido»: el servidor ya los calcula, y una ficha que varias
 * firmas corrigen por separado es una señal sobre el maestro.
 */

const ROL: Record<string, string> = {
  LITIGANTE: 'Firma litigante',
  DESPACHO: 'Juzgado o despacho',
  SECRETARIA: 'Secretaría'
};

/** Cuántas ramas se nombran antes de «y N ramas más», como el artboard. */
const RAMAS_VISIBLES = 3;

interface CatalogMasterDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CatalogMasterDialog: React.FC<CatalogMasterDialogProps> = ({ isOpen, onClose }) => {
  const [maestro, setMaestro] = React.useState<CatalogoMaestro | null>(null);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [intento, setIntento] = React.useState(0);
  const [todasLasRamas, setTodasLasRamas] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    let vigente = true;
    setCargando(true);
    setError(null);
    adminApi
      .catalogMaster()
      .then((m) => {
        if (vigente) setMaestro(m);
      })
      .catch((e: unknown) => {
        if (vigente) setError(e instanceof Error ? e.message : 'No se pudo leer el maestro.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [isOpen, intento]);

  const ramas = maestro ? [...maestro.reparticion.porRama].sort((a, b) => b.total - a.total) : [];
  const primeras = todasLasRamas ? ramas : ramas.slice(0, RAMAS_VISIBLES);
  const resto = ramas.slice(RAMAS_VISIBLES);
  const sumaDelResto = resto.reduce((t, r) => t + r.total, 0);

  return (
    <Dialog
      abierto={isOpen}
      onCerrar={onClose}
      titulo="Catálogo maestro"
      subtitulo="El catálogo que comparten todas las firmas. Lo que cada firma curó es suyo y no se toca desde aquí."
      tamano="L"
    >
      <div className="cn-ope-cuerpo">
        {cargando && !maestro && <p className="cn-ope-vacio">Leyendo el maestro…</p>}

        {error && (
          <div role="alert" className="cn-ope-error">
            <p>{error}</p>
            <button type="button" className="cn-ope-boton cn-ope-boton--suave" onClick={() => setIntento((n) => n + 1)}>
              Intentar de nuevo
            </button>
          </div>
        )}

        {maestro && (
          <>
            <section className="cn-ope-cifras" aria-label="El maestro en cifras">
              <div className="cn-ope-cifra">
                <p className="cn-ope-cifra-valor cn-ope-mono">{cifra(maestro.actuacionesBase)}</p>
                <p className="cn-ope-cifra-rotulo">
                  actuaciones · {cifra(maestro.transversales)} transversales, que aparecen en todas las ramas
                </p>
              </div>
              <div className="cn-ope-cifra cn-ope-cifra--ok">
                <p className="cn-ope-cifra-valor cn-ope-mono">{cifra(maestro.conTerminoVerificado)}</p>
                <p className="cn-ope-cifra-rotulo">
                  con término verificado, y {cifra(maestro.noCaduca)} que no caducan
                </p>
              </div>
              <div className="cn-ope-cifra cn-ope-cifra--aviso">
                <p className="cn-ope-cifra-valor cn-ope-mono">{cifra(maestro.sinVerificar)}</p>
                <p className="cn-ope-cifra-rotulo">sin verificar: publican advertencia en vez de un plazo</p>
              </div>
              <div className="cn-ope-cifra">
                <p className="cn-ope-cifra-valor cn-ope-mono">{cifra(maestro.ramas)}</p>
                <p className="cn-ope-cifra-rotulo">ramas</p>
              </div>
            </section>

            <div className="cn-ope-dos cn-ope-dos--tarjetas">
              <section className="cn-ope-tarjeta" aria-labelledby="ope-por-rama">
                <h3 id="ope-por-rama" className="cn-ope-tarjeta-titulo">
                  Reparto por rama
                </h3>
                <ul className="cn-ope-reparto">
                  {primeras.map((r) => (
                    <li key={r.branch}>
                      <span>{branchLabel(r.branch)}</span>
                      <span className="cn-ope-mono">{cifra(r.total)}</span>
                    </li>
                  ))}
                  {!todasLasRamas && resto.length > 0 && (
                    <li className="cn-ope-reparto-resto">
                      <span>
                        y {cifra(resto.length)} {resto.length === 1 ? 'rama más' : 'ramas más'}
                      </span>
                      <span className="cn-ope-mono">{cifra(sumaDelResto)}</span>
                    </li>
                  )}
                </ul>
                {resto.length > 0 && (
                  <button type="button" className="cn-ope-boton cn-ope-boton--terciario" onClick={() => setTodasLasRamas((v) => !v)}>
                    {todasLasRamas ? 'Ver solo las tres primeras' : `Ver las ${cifra(ramas.length)} ramas`}
                  </button>
                )}
              </section>

              <section className="cn-ope-tarjeta" aria-labelledby="ope-por-rol">
                <h3 id="ope-por-rol" className="cn-ope-tarjeta-titulo">
                  Reparto por rol
                </h3>
                <p className="cn-ope-tarjeta-nota">Quién firma el documento.</p>
                <ul className="cn-ope-reparto">
                  {maestro.reparticion.porRol.map((r) => (
                    <li key={r.role}>
                      <span>{ROL[r.role] ?? r.role}</span>
                      <span className="cn-ope-mono">{cifra(r.total)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="cn-ope-tarjeta cn-ope-tarjeta--suelta" aria-labelledby="ope-curaduria">
              <h3 id="ope-curaduria" className="cn-ope-tarjeta-titulo">
                Alcance de la curaduría de las firmas
              </h3>
              <p className="cn-ope-texto">
                <strong>{cifra(maestro.firmasQueCuraron)}</strong> {maestro.firmasQueCuraron === 1 ? 'firma ha' : 'firmas han'}{' '}
                corregido o confirmado alguna ficha, con <strong>{cifra(maestro.verificacionesDeFirmas)}</strong> verificaciones
                en total.
              </p>
              {maestro.masCuradas.length > 0 && (
                <>
                  <p className="cn-ope-tarjeta-nota">
                    Las que más firmas han corregido. Una ficha que varias firmas corrigen por separado probablemente nació
                    incompleta.
                  </p>
                  <ul className="cn-ope-reparto">
                    {maestro.masCuradas.map((a) => (
                      <li key={a.actuacionId}>
                        <span>{a.exactName ?? <span className="cn-ope-apagado">{a.actuacionId} · ya no está en este paquete</span>}</span>
                        <span>
                          {cifra(a.firmas)} {a.firmas === 1 ? 'firma' : 'firmas'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="cn-ope-seccion" aria-labelledby="ope-pendientes">
              <h3 id="ope-pendientes" className="cn-ope-subtitulo">
                Lo que todavía no se puede hacer desde aquí
              </h3>
              <ul className="cn-ope-pendientes">
                <li className="cn-ope-pendiente">
                  <p className="cn-ope-pendiente-titulo">Publicar un cambio normativo</p>
                  <p className="cn-ope-pendiente-texto">
                    El maestro no vive en base de datos: se compila desde los archivos de investigación y viaja dentro del
                    paquete, así que hoy un cambio se publica desplegando. Regla que deberá cumplirse: una{' '}
                    <strong>derogatoria no borra</strong> la verificación de una firma — la reetiqueta, para que no haya que
                    redescubrirla.
                  </p>
                </li>
                <li className="cn-ope-pendiente">
                  <p className="cn-ope-pendiente-titulo">Contar las fichas con norma derogada</p>
                  <p className="cn-ope-pendiente-texto">
                    Hoy no hay ese conteo: ninguna ficha declara si su norma sigue vigente, y un número estimado se leería igual
                    que uno medido.
                  </p>
                </li>
                <li className="cn-ope-pendiente">
                  <p className="cn-ope-pendiente-titulo">Recibir propuestas de las firmas</p>
                  <p className="cn-ope-pendiente-texto">
                    Una firma que añade una actuación propia no tiene cómo proponerla al maestro. Falta la tabla y el flujo: la
                    lista está vacía por inexistente, no por estar en cero.
                  </p>
                </li>
              </ul>
            </section>

            <p className="cn-ope-recuadro">
              Operación puede saber <strong>cuántas</strong> firmas corrigieron una actuación; nunca <strong>qué</strong> corrigió
              cada una. Publicar tampoco marcará como verificada una ficha que la firma no leyó: verificado significa «alguien de
              esta firma lo leyó».
            </p>
          </>
        )}
      </div>
    </Dialog>
  );
};
