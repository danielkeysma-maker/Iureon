import React from 'react';
import { adminApi, type FirmDetail, type FirmSummary, type FirmUserDetail } from '../admin.api';
import { RequestSupportAccessDialog } from './RequestSupportAccessDialog';
import { PlanDeLaFirmaDialog } from './FirmPlanSection';
import { FirmDangerZone } from './FirmDangerZone';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { RechargeFirmDialog } from './RechargeFirmDialog';
import { NO_SE_PUDO_LEER, cifra, describirPlan, estadoDeFirma, hace, pesos } from '../consolaEnPantalla';

/**
 * Ficha de la firma, dentro de la consola.
 * Cara nueva: `public/handoff/app-consola-de-operacion.html`, artboard 2
 * («‹ Firmas», nombre grande, NIT y alta en mono, tres acciones arriba —Recargar
 * saldo, Cambiar plan, Pedir acceso al contenido—, cuatro datos Plan · Vence ·
 * Saldo · Usuarios, la tabla de usuarios y el registro de operación).
 *
 * ─── YA NO ES UN DIÁLOGO, AUNQUE EL ARCHIVO CONSERVE SU NOMBRE ─────────────
 *
 * El artboard la dibuja en el lugar de la lista, con «‹ Firmas» para volver.
 * Como diálogo L encima de otro diálogo L, la consola quedaba a la vista detrás
 * y ninguno de los dos se leía entero en el teléfono.
 *
 * ─── LO QUE OPERACIÓN NO PUEDE VER, ESCRITO EN LA PANTALLA ─────────────────
 *
 * Es la promesa que Privacidad le hace al cliente, escrita donde la lee quien
 * tiene el poder. Y es cierta por construcción: `getFirmDetail` no lee ni un
 * campo de ese material, así que la pantalla no tendría qué pintar aunque
 * quisiera. La única puerta es «Pedir acceso al contenido», que no abre nada:
 * le hace una pregunta a un socio de la firma.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ──────────────────
 *
 * · El «Motivo: …» separado en cada entrada del registro: el servidor guarda el
 *   hecho y su motivo en una sola línea (`resource`), así que se muestra entera.
 * · Reenviar invitaciones y exportar datos: no tienen endpoint.
 *
 * ─── Y LO QUE SE AÑADIÓ (derivado) ─────────────────────────────────────────
 *
 * Consumo de 30 días, cuentas activas en 14 días, catálogo curado y
 * transcripciones: el servidor ya los calcula y la ficha anterior los mostraba.
 * Van en una fila discreta bajo los cuatro datos del artboard, para no perderlos.
 */

const ROL: Record<string, string> = {
  FIRM_ADMIN: 'Socio · administrador',
  LAWYER: 'Abogado litigante',
  SUPER_ADMIN: 'Operación Iureon'
};

const fechaCorta = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

const fechaYHora = (iso: string): string => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })}`;
};

/** Lo que operación no alcanza. Va en la pantalla, no en una nota al pie. */
const FUERA_DE_ALCANCE: readonly string[] = [
  'Escritos, borradores y documentos adjuntos',
  'Clientes, expedientes y radicados',
  'Grabaciones y transcripciones',
  'El catálogo curado por la firma'
];

/** Cuántas entradas del registro caben antes de cortar; el resto se cuenta, no se esconde. */
const REGISTRO_VISIBLE = 12;

/** Mono solo cuando lo que se pinta es la cifra: «no se pudo leer» no es un valor citable. */
const claseDeCifra = (texto: string): string => (texto === NO_SE_PUDO_LEER ? '' : 'cn-ope-mono');

interface FichaDeFirmaProps {
  firmId: string;
  onVolver: () => void;
  /** La firma ya no existe: la consola vuelve a la lista, la relee y avisa. */
  onEliminada: (resultado: { nombre: string; usuariosEliminados: number; advertencias: string[] }) => void;
}

const Volver: React.FC<{ onVolver: () => void }> = ({ onVolver }) => (
  <button type="button" className="cn-ope-volver" onClick={onVolver}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
    Firmas
  </button>
);

const Dato: React.FC<{ rotulo: string; valor: string; mono?: boolean; nota?: string }> = ({ rotulo, valor, mono = false, nota }) => (
  <div className="cn-ope-cifra cn-ope-cifra--dato">
    <p className="cn-ope-dato-rotulo">{rotulo}</p>
    <p className={`cn-ope-dato-valor ${mono ? claseDeCifra(valor) : ''}`}>{valor}</p>
    {nota && <p className="cn-ope-dato-nota">{nota}</p>}
  </div>
);

export const FichaDeFirma: React.FC<FichaDeFirmaProps> = ({ firmId, onVolver, onEliminada }) => {
  const [firma, setFirma] = React.useState<FirmDetail | null>(null);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  /* Sube cuando operación cambia algo: la ficha se relee, no se parchea a mano. */
  const [recarga, setRecarga] = React.useState(0);
  const [pidiendoAcceso, setPidiendoAcceso] = React.useState(false);
  const [planAbierto, setPlanAbierto] = React.useState(false);
  const [porRecargar, setPorRecargar] = React.useState(false);
  const [recargando, setRecargando] = React.useState(false);
  const [errorDeRecarga, setErrorDeRecarga] = React.useState('');
  const [cuentaAReiniciar, setCuentaAReiniciar] = React.useState<FirmUserDetail | null>(null);

  React.useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);
    adminApi
      .firmDetail(firmId)
      .then((d) => {
        if (vigente) setFirma(d);
      })
      .catch((e: unknown) => {
        if (vigente) setError(e instanceof Error ? e.message : 'No se pudo leer la firma.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [firmId, recarga]);

  /*
   * El monto que manda es el del SERVIDOR, no una suma en pantalla: el saldo
   * que importa es el que quedó en la base. Luego se relee la ficha para que el
   * registro de operación traiga la recarga recién hecha, sin tapar la ficha.
   */
  const recargar = async (f: FirmSummary, monto: number, motivo: string) => {
    setRecargando(true);
    setErrorDeRecarga('');
    try {
      const { creditsBalance } = await adminApi.addCredits(f.id, monto, motivo);
      setFirma((actual) => (actual ? { ...actual, creditsBalance } : actual));
      setPorRecargar(false);
      setRecarga((n) => n + 1);
    } catch (err) {
      setErrorDeRecarga(err instanceof Error ? err.message : 'No se pudo aplicar la recarga.');
    } finally {
      setRecargando(false);
    }
  };

  if (!firma) {
    return (
      <div className="cn-ope-cuerpo cn-ope-ficha">
        <Volver onVolver={onVolver} />
        {cargando ? (
          <p className="cn-ope-vacio">Leyendo la firma…</p>
        ) : (
          <div role="alert" className="cn-ope-error">
            <p>{error ?? 'No se pudo leer la firma.'}</p>
            <button type="button" className="cn-ope-boton cn-ope-boton--suave" onClick={() => setRecarga((n) => n + 1)}>
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    );
  }

  const estado = estadoDeFirma(firma);
  const curado = firma.catalogoTotal > 0 ? Math.round((firma.catalogoCuradas / firma.catalogoTotal) * 100) : null;
  const consumo = pesos(firma.consumo30dCop);

  return (
    <div className="cn-ope-cuerpo cn-ope-ficha">
      <header className="cn-ope-ficha-cabeza">
        <div className="cn-ope-ficha-identidad">
          <Volver onVolver={onVolver} />
          <h1 className="cn-ope-ficha-nombre">{firma.name}</h1>
          <p className="cn-ope-ficha-meta">
            {firma.nit ? (
              <>
                NIT <span className="cn-ope-mono">{firma.nit}</span>
              </>
            ) : (
              'Sin NIT'
            )}{' '}
            · creada el <span className="cn-ope-mono">{fechaCorta(firma.createdAt)}</span>{' '}
            <span className={`cn-ope-estado cn-ope-estado--${estado.tono}`}>{estado.etiqueta}</span>
          </p>
        </div>
        <div className="cn-ope-ficha-acciones">
          <button
            type="button"
            className="cn-ope-boton cn-ope-boton--suave"
            onClick={() => {
              setErrorDeRecarga('');
              setPorRecargar(true);
            }}
          >
            Recargar saldo
          </button>
          <button type="button" className="cn-ope-boton cn-ope-boton--suave" onClick={() => setPlanAbierto(true)}>
            Cambiar plan
          </button>
          <button type="button" className="cn-ope-boton cn-ope-boton--primario" onClick={() => setPidiendoAcceso(true)}>
            Pedir acceso al contenido
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="cn-ope-error">
          {error}
        </p>
      )}

      <section className="cn-ope-cifras cn-ope-cifras--ficha" aria-label="Resumen de la firma">
        <Dato rotulo="Plan" valor={describirPlan(firma)} />
        <Dato
          rotulo="Vence"
          valor={firma.planValidUntil ? fechaCorta(firma.planValidUntil) : 'Sin vencimiento'}
          mono={firma.planValidUntil !== null}
        />
        <Dato
          rotulo="Saldo"
          valor={pesos(firma.creditsBalance)}
          mono
          nota={
            firma.diasDeSaldo === null
              ? 'Sin consumo en 30 días: no hay ritmo del cual contar días.'
              : `≈ ${cifra(firma.diasDeSaldo)} días al ritmo actual`
          }
        />
        <Dato
          rotulo="Usuarios"
          valor={
            firma.planMaxUsers !== null ? `${cifra(firma.users)} de ${cifra(firma.planMaxUsers)}` : `${cifra(firma.users)} · sin tope`
          }
        />
      </section>

      <dl className="cn-ope-hechos">
        <div>
          <dt>Consumo · 30 días</dt>
          <dd className={claseDeCifra(consumo)}>{consumo}</dd>
        </div>
        <div>
          <dt>Entraron en 14 días</dt>
          <dd>
            {cifra(firma.usuariosActivos14d)} de {cifra(firma.users)}
          </dd>
        </div>
        <div>
          <dt>Catálogo curado</dt>
          <dd>
            {curado === null ? 'sin catálogo que contar' : `${curado} %`} ({cifra(firma.catalogoCuradas)} de{' '}
            {cifra(firma.catalogoTotal)})
          </dd>
        </div>
        <div>
          <dt>Transcripciones</dt>
          <dd>{cifra(firma.transcriptions)}</dd>
        </div>
      </dl>

      <section className="cn-ope-seccion" aria-labelledby="ope-usuarios">
        <h2 id="ope-usuarios" className="cn-ope-titulo">
          Usuarios
        </h2>
        <p className="cn-ope-texto">
          Correo, rol y actividad, sin acceso a sus casos. La firma los administra desde su propia pantalla; operación puede
          fijar una contraseña nueva cuando la firma lo pide.
        </p>
        <div className="cn-ope-tabla cn-ope-tabla--usuarios">
          <div className="cn-ope-tabla-cabeza" aria-hidden="true">
            <span>Correo</span>
            <span>Rol</span>
            <span className="cn-ope-derecha">Consumo mes</span>
            <span className="cn-ope-derecha">Últ. sesión</span>
            <span />
          </div>
          {firma.usuarios.length === 0 ? (
            <p className="cn-ope-vacio">La firma no tiene cuentas.</p>
          ) : (
            <ul className="cn-ope-filas">
              {firma.usuarios.map((u) => (
                <li key={u.id} className={`cn-ope-fila cn-ope-fila--usuario ${u.desactivado ? 'cn-ope-fila--retirada' : ''}`}>
                  <span className="cn-ope-celda-principal">
                    <span className="cn-ope-principal">{u.email}</span>
                    {u.desactivado && <span className="cn-ope-secundario">Cuenta desactivada</span>}
                  </span>
                  <span className={`cn-ope-rol ${u.role === 'FIRM_ADMIN' ? 'cn-ope-rol--socio' : ''}`}>{ROL[u.role] ?? u.role}</span>
                  <span className="cn-ope-derecha">
                    <span className="cn-ope-rotulo-movil">Consumo del mes</span>
                    <span className={claseDeCifra(pesos(u.consumoMesCop))}>{pesos(u.consumoMesCop)}</span>
                  </span>
                  <span className="cn-ope-derecha cn-ope-apagado">
                    <span className="cn-ope-rotulo-movil">Última sesión</span>
                    {hace(u.ultimoAcceso)}
                  </span>
                  <span className="cn-ope-fila-acciones">
                    <button type="button" className="cn-ope-boton cn-ope-boton--terciario" onClick={() => setCuentaAReiniciar(u)}>
                      Nueva contraseña
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="cn-ope-seccion" aria-labelledby="ope-registro">
        <h2 id="ope-registro" className="cn-ope-titulo">
          Registro de operación
        </h2>
        <p className="cn-ope-texto">
          Lo que el equipo de Iureon hizo sobre esta firma. <strong>La firma ve este mismo registro</strong> en su auditoría.
        </p>
        {firma.registroDeOperacion.length === 0 ? (
          <p className="cn-ope-vacio">Operación no ha actuado sobre esta firma.</p>
        ) : (
          <>
            <ol className="cn-ope-registro">
              {firma.registroDeOperacion.slice(0, REGISTRO_VISIBLE).map((e) => (
                <li key={e.id} className="cn-ope-registro-item">
                  <p className="cn-ope-registro-cabeza">
                    <span className="cn-ope-registro-hecho">{e.resource || e.action}</span>
                    <time className="cn-ope-registro-fecha cn-ope-mono" dateTime={e.timestamp}>
                      {fechaYHora(e.timestamp)}
                    </time>
                  </p>
                  <p className="cn-ope-registro-quien">{e.userEmail}</p>
                </li>
              ))}
            </ol>
            {firma.registroDeOperacion.length > REGISTRO_VISIBLE && (
              <p className="cn-ope-texto cn-ope-texto--pie">
                Se muestran las {REGISTRO_VISIBLE} más recientes de {cifra(firma.registroDeOperacion.length)}. El resto está en la
                auditoría de la firma.
              </p>
            )}
          </>
        )}
      </section>

      <section className="cn-ope-nota" aria-labelledby="ope-fuera">
        <h2 id="ope-fuera" className="cn-ope-nota-titulo">
          Lo que operación no puede ver
        </h2>
        <ul className="cn-ope-fuera">
          {FUERA_DE_ALCANCE.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <p className="cn-ope-texto">
          La restricción es del servidor, no de la pantalla: esta ficha no lee ni un campo de ese material. Para ver algo
          concreto hay que pedir acceso, y lo decide un socio de la firma.
        </p>
      </section>

      {/* Al final y aparte: es lo único de la ficha que no se deshace. */}
      <FirmDangerZone firma={firma} onEliminada={onEliminada} />

      <RechargeFirmDialog
        firm={porRecargar ? firma : null}
        ocupado={recargando}
        errorDelServidor={errorDeRecarga}
        onCerrar={() => setPorRecargar(false)}
        onConfirmar={recargar}
      />
      <PlanDeLaFirmaDialog
        abierto={planAbierto}
        firma={firma}
        onCerrar={() => setPlanAbierto(false)}
        /*
          Con la ficha ya releída por el servidor (módulos) se aplica tal cual;
          sin ella (plan, suspensión) se relee, sin tapar la ficha.
        */
        onGuardado={(yaLeida) => (yaLeida ? setFirma(yaLeida) : setRecarga((n) => n + 1))}
      />
      <RequestSupportAccessDialog
        firmId={pidiendoAcceso ? firma.id : null}
        firmName={firma.name}
        onCerrar={() => setPidiendoAcceso(false)}
        onEnviada={() => setRecarga((n) => n + 1)}
      />
      <ResetPasswordDialog
        firmId={firma.id}
        usuario={cuentaAReiniciar}
        onCerrar={() => setCuentaAReiniciar(null)}
        onHecho={() => setRecarga((n) => n + 1)}
      />
    </div>
  );
};
