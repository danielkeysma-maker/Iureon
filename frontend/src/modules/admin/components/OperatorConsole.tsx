import React from 'react';
import { adminApi, type FirmSummary } from '../admin.api';
import { supportChatApi } from '../../support/supportChat.api';
import { FichaDeFirma } from './FirmDetailDialog';
import { CatalogMasterDialog } from './CatalogMasterDialog';
import { BandejaDeSoporte } from './BandejaDeSoporte';
import { CorreoSaliente } from './CorreoSaliente';
import { NuevaFirmaDialog } from './NuevaFirmaDialog';
import {
  cifra,
  describirPlan,
  diasDeSaldo,
  esperanRespuesta,
  estadoDeFirma,
  filtrarFirmas,
  ordenarPorRiesgo,
  pesos,
  rotuloDeSoporte
} from '../consolaEnPantalla';

/**
 * La operación de la plataforma: las firmas, sus planes y sus saldos.
 * Cara nueva: `public/handoff/app-consola-de-operacion.html`, artboard 1
 * (barra con Catálogo maestro · Soporte · Nueva firma, cuatro cifras, la tabla
 * FIRMA · PLAN · CONSUMO 30 D · SALDO · ESTADO con buscador por nombre o NIT, y
 * la fila que abre la ficha). La ficha (artboard 2) se abre EN SU LUGAR, con
 * «‹ Firmas» para volver, como la dibuja el artboard.
 *
 * ─── LO QUE MUESTRA Y LO QUE NO ─────────────────────────────────────────────
 *
 * Volúmenes (cuentas, transcritos, consumo), nunca contenido: gestionar un
 * inquilino y leer su material privilegiado son poderes distintos, y el
 * servidor solo concede el primero. Cada cambio se escribe en la auditoría de
 * la firma afectada, con el correo del operador.
 *
 * ─── LO QUE CAMBIÓ RESPECTO DE LA CONSOLA ANTERIOR, con la razón ────────────
 *
 * · El selector «Activa / En mora / Cancelada» de cada fila se retiró: escribe
 *   `subscription_status`, una columna que ninguna regla de acceso lee desde que
 *   existen los planes. Un control que cambia algo que no gobierna nada enseña a
 *   creer que se suspendió una firma. Suspender de verdad está en «Cambiar plan».
 * · La bandeja de soporte bajó a su propio diálogo, detrás de «Soporte · N»,
 *   como el artboard. N son las conversaciones que ESPERAN respuesta; si la
 *   bandeja no se pudo leer, el botón no lleva número en vez de decir cero.
 * · Recargar se hace desde la ficha, donde el artboard la pone: la fila entera
 *   abre la ficha y ya no carga botones propios.
 * · El correo saliente no está en el artboard; se conserva abajo (derivada),
 *   porque es la única forma de comprobar que las confirmaciones salen.
 */

type Aviso =
  | { tipo: 'alta'; nombre: string }
  | { tipo: 'borrado'; nombre: string; usuariosEliminados: number; advertencias: string[] };

/** La suma solo existe si todas sus partes se leyeron: una sola ausente la vuelve desconocida. */
const sumaLeida = (firmas: readonly FirmSummary[], campo: 'creditsBalance' | 'consumo30dCop'): number | null =>
  firmas.every((f) => Number.isFinite(f[campo])) ? firmas.reduce((t, f) => t + f[campo], 0) : null;

const Cifra: React.FC<{ valor: string; leida: boolean; aviso?: boolean; children: React.ReactNode }> = ({
  valor,
  leida,
  aviso = false,
  children
}) => (
  <div className={`cn-ope-cifra ${aviso ? 'cn-ope-cifra--aviso' : ''}`}>
    <p className={`cn-ope-cifra-valor ${leida ? 'cn-ope-mono' : 'cn-ope-cifra-valor--sin-leer'}`}>{valor}</p>
    <p className="cn-ope-cifra-rotulo">{children}</p>
  </div>
);

export const OperatorConsole: React.FC = () => {
  const [firms, setFirms] = React.useState<FirmSummary[]>([]);
  const [cargando, setCargando] = React.useState(true);
  /** Si alguna lectura de la lista salió bien: antes de eso no hay cifras que pintar. */
  const [leida, setLeida] = React.useState(false);
  const [error, setError] = React.useState('');
  const [busqueda, setBusqueda] = React.useState('');
  const [fichaAbierta, setFichaAbierta] = React.useState<string | null>(null);
  const [maestroAbierto, setMaestroAbierto] = React.useState(false);
  const [soporteAbierto, setSoporteAbierto] = React.useState(false);
  const [creando, setCreando] = React.useState(false);
  /** Conversaciones que esperan respuesta. `null` = la bandeja no se pudo leer. */
  const [esperan, setEsperan] = React.useState<number | null>(null);
  const [aviso, setAviso] = React.useState<Aviso | null>(null);

  const cargar = React.useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setFirms(await adminApi.listFirms());
      setLeida(true);
    } catch (err) {
      setLeida(false);
      setError(err instanceof Error ? err.message : 'No se pudieron leer las firmas de la plataforma.');
    } finally {
      setCargando(false);
    }
  }, []);

  const contarSoporte = React.useCallback(async () => {
    try {
      const r = await supportChatApi.bandeja();
      setEsperan(esperanRespuesta(r.conversaciones));
    } catch {
      setEsperan(null);
    }
  }, []);

  React.useEffect(() => {
    void cargar();
    void contarSoporte();
  }, [cargar, contarSoporte]);

  if (fichaAbierta) {
    return (
      <FichaDeFirma
        firmId={fichaAbierta}
        onVolver={() => {
          setFichaAbierta(null);
          void cargar();
        }}
        onEliminada={(resultado) => {
          setFichaAbierta(null);
          setAviso({ tipo: 'borrado', ...resultado });
          void cargar();
        }}
      />
    );
  }

  /* Sin lectura buena, las cifras de arriba dicen «no se pudo leer», nunca cero. */
  const saldoAgregado = leida ? sumaLeida(firms, 'creditsBalance') : null;
  const consumoAgregado = leida ? sumaLeida(firms, 'consumo30dCop') : null;
  const porAgotarse = leida
    ? firms.filter((f) => {
        const d = diasDeSaldo(f.creditsBalance, f.consumo30dCop);
        return d !== null && d <= 7;
      }).length
    : null;
  const visibles = ordenarPorRiesgo(filtrarFirmas(firms, busqueda));

  return (
    <div className="cn-ope-cuerpo">
      <div className="cn-ope-barra">
        {/*
          «Superusuario» en gris y no en dorado: el artboard lo pinta dorado,
          pero el dorado de la casa es solo del módulo activo.
        */}
        <span className="cn-ope-sello">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
          </svg>
          Superusuario
        </span>
        <div className="cn-ope-barra-acciones">
          {/*
            El maestro va en la barra de la consola y no dentro de una ficha: no
            es un dato DE una firma, es la base que reciben todas.
          */}
          <button type="button" className="cn-ope-boton cn-ope-boton--suave" onClick={() => setMaestroAbierto(true)}>
            Catálogo maestro
          </button>
          <button
            type="button"
            className="cn-ope-boton cn-ope-boton--suave"
            onClick={() => setSoporteAbierto(true)}
            aria-label={
              esperan === null
                ? 'Soporte: no se pudo leer cuántas conversaciones esperan respuesta'
                : `Soporte: ${esperan} ${esperan === 1 ? 'conversación espera' : 'conversaciones esperan'} respuesta`
            }
          >
            {rotuloDeSoporte(esperan)}
          </button>
          <button type="button" className="cn-ope-boton cn-ope-boton--primario" onClick={() => setCreando(true)}>
            Nueva firma
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="cn-ope-error">
          <p>{error}</p>
          <button type="button" className="cn-ope-boton cn-ope-boton--suave" onClick={() => void cargar()} disabled={cargando}>
            Intentar de nuevo
          </button>
        </div>
      )}

      {aviso && (
        <div role="status" className={`cn-ope-aviso ${aviso.tipo === 'borrado' && aviso.advertencias.length > 0 ? '' : 'cn-ope-aviso--ok'}`}>
          <div className="cn-ope-aviso-texto">
            {aviso.tipo === 'alta' ? (
              <p>
                La firma <strong>{aviso.nombre}</strong> quedó creada con la cuenta de su socio administrador, en Premium ·
                cortesía y sin vencimiento.
              </p>
            ) : (
              <>
                <p>
                  La firma <strong>{aviso.nombre}</strong> fue eliminada con todos sus datos · {cifra(aviso.usuariosEliminados)}{' '}
                  {aviso.usuariosEliminados === 1 ? 'cuenta eliminada' : 'cuentas eliminadas'}. Quedó en su auditoría de
                  operación.
                </p>
                {aviso.advertencias.length > 0 && (
                  <>
                    <p className="cn-ope-aviso-titulo">Quedó pendiente, por hacer a mano:</p>
                    <ul className="cn-ope-aviso-lista">
                      {aviso.advertencias.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>
          <button type="button" className="cn-ope-boton cn-ope-boton--terciario" onClick={() => setAviso(null)}>
            Cerrar
          </button>
        </div>
      )}

      {(leida || error) && (
        <section className="cn-ope-cifras" aria-label="La plataforma en cifras">
          <Cifra valor={pesos(saldoAgregado)} leida={saldoAgregado !== null}>
            Saldo agregado · <span className="cn-ope-cifra-pasivo">pasivo: trabajo ya vendido</span>
          </Cifra>
          <Cifra valor={pesos(consumoAgregado)} leida={consumoAgregado !== null}>
            Consumo · últimos 30 días
          </Cifra>
          <Cifra valor={cifra(porAgotarse)} leida={porAgotarse !== null} aviso={porAgotarse !== null && porAgotarse > 0}>
            Firmas con 7 días o menos de saldo
          </Cifra>
          <Cifra valor={leida ? cifra(firms.length) : cifra(null)} leida={leida}>
            Firmas en la plataforma
          </Cifra>
        </section>
      )}

      <section className="cn-ope-seccion" aria-labelledby="ope-firmas">
        <div className="cn-ope-seccion-cabeza">
          <h2 id="ope-firmas" className="cn-ope-titulo">
            Firmas en la plataforma
          </h2>
          <div className="cn-ope-buscar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Por nombre o NIT"
              aria-label="Buscar firmas por nombre o NIT"
              className="cn-ope-campo cn-ope-campo--buscar"
            />
          </div>
          <button type="button" className="cn-ope-boton cn-ope-boton--suave" onClick={() => void cargar()} disabled={cargando}>
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>

        <div className="cn-ope-tabla cn-ope-tabla--firmas">
          <div className="cn-ope-tabla-cabeza" aria-hidden="true">
            <span>Firma</span>
            <span>Plan</span>
            <span className="cn-ope-derecha">Consumo 30 d</span>
            <span className="cn-ope-derecha">Saldo</span>
            <span>Estado</span>
          </div>

          {visibles.length === 0 ? (
            <p className="cn-ope-vacio">
              {cargando && !leida
                ? 'Leyendo las firmas de la plataforma…'
                : !leida
                  ? 'La lista no se pudo leer.'
                  : firms.length === 0
                    ? 'Todavía no hay firmas en la plataforma. Cree la primera con «Nueva firma».'
                    : `Ninguna firma coincide con «${busqueda.trim()}».`}
            </p>
          ) : (
            <ul className="cn-ope-filas">
              {visibles.map((f) => {
                const estado = estadoDeFirma(f);
                const dias = diasDeSaldo(f.creditsBalance, f.consumo30dCop);
                const usuariosLeidos = Number.isFinite(f.users);
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      className="cn-ope-fila cn-ope-fila--firma"
                      onClick={() => setFichaAbierta(f.id)}
                      aria-label={`Abrir la ficha de ${f.name}`}
                    >
                      <span className="cn-ope-celda-principal">
                        <span className="cn-ope-principal">{f.name}</span>
                        <span className="cn-ope-secundario">
                          {f.nit ? (
                            <>
                              NIT <span className="cn-ope-mono">{f.nit}</span>
                            </>
                          ) : (
                            'Sin NIT'
                          )}{' '}
                          ·{' '}
                          {usuariosLeidos
                            ? `${cifra(f.users)} ${f.users === 1 ? 'usuario' : 'usuarios'}`
                            : `usuarios: ${cifra(null)}`}
                        </span>
                      </span>
                      <span className="cn-ope-celda-plan">{describirPlan(f)}</span>
                      <span className="cn-ope-derecha">
                        <span className="cn-ope-rotulo-movil">Consumo 30 días</span>
                        <span className={Number.isFinite(f.consumo30dCop) ? 'cn-ope-mono' : ''}>{pesos(f.consumo30dCop)}</span>
                      </span>
                      <span className="cn-ope-derecha">
                        <span className="cn-ope-rotulo-movil">Saldo</span>
                        <span className={Number.isFinite(f.creditsBalance) ? 'cn-ope-mono' : ''}>{pesos(f.creditsBalance)}</span>
                        <span className="cn-ope-secundario">{dias === null ? 'sin consumo' : `≈ ${cifra(dias)} días`}</span>
                      </span>
                      <span className="cn-ope-celda-estado">
                        <span className={`cn-ope-estado cn-ope-estado--${estado.tono}`}>{estado.etiqueta}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="cn-ope-texto cn-ope-texto--pie">
          «Saldo bajo» se calcula al ritmo de consumo de cada firma, no con un umbral fijo: siete días de su propio uso. Esta
          consola gestiona el negocio de cada firma —su plan, su saldo y sus cuentas— y no da acceso a sus escritos, audiencias
          ni expedientes. Cada cambio queda en la auditoría de la firma afectada, con su correo.
        </p>
      </section>

      <CorreoSaliente />

      <NuevaFirmaDialog
        abierto={creando}
        onCerrar={() => setCreando(false)}
        onCreada={(nombre) => {
          setCreando(false);
          setAviso({ tipo: 'alta', nombre });
          void cargar();
        }}
      />
      <CatalogMasterDialog isOpen={maestroAbierto} onClose={() => setMaestroAbierto(false)} />
      {soporteAbierto && (
        <BandejaDeSoporte
          onCerrar={() => {
            setSoporteAbierto(false);
            void contarSoporte();
          }}
          onCambio={setEsperan}
        />
      )}
    </div>
  );
};
