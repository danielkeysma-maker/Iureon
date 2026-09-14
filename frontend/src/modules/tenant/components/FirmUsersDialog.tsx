import React, { useEffect, useMemo, useState } from 'react';
import { Dialog } from '../../../design/Dialog';
import { firmUsersApi, type UsuarioDeFirma } from '../services/firmUsers.api';
import type { PlanDeFirma } from '../../subscriptions/types';
import { NOMBRE_DE_PLAN } from '../../subscriptions/types';
import { usePlan } from '../../subscriptions/PlanContext';
import { useTenant } from '../TenantContext';
import {
  ROL_EN_PALABRAS,
  accionesPosibles,
  esLimiteDeUsuarios,
  puestosEnPalabras,
  quedanPuestos,
  ultimoIngreso
} from '../usuariosEnPantalla';

/**
 * «Su firma»: usuarios y roles. Pantalla de `app-administrar-y-saldo.html`
 * (artboard 1) con sus diálogos (artboard 2): agregar, retirar y «No quedan
 * puestos». Solo la abre un socio; el operador recibe la consola (App.tsx).
 *
 * ─── TODO LO QUE SE VE ES REAL ──────────────────────────────────────────────
 *
 * La lista sale de Supabase Auth —la misma fuente que decide quién entra— y el
 * consumo del mes de lo cobrado de verdad (`ai_usage`). Las acciones de cada
 * fila son las que el servidor admite (`accionesPosibles`): a uno mismo no se le
 * ofrece retirarse ni cambiarse el rol, porque el servidor lo rechaza.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ──────────────────
 *
 * · «Invitar a un abogado», «Invitación enviada», «La invitación no vence»: no
 *   sale ningún correo. La cuenta se crea con la contraseña que el socio
 *   entrega, y la pantalla lo dice así («Agregar un abogado»). Quien nunca ha
 *   entrado se muestra como «Todavía no ha entrado», no como invitación.
 * · «Retirarlo libera un puesto»: FALSO en este servidor. `contarUsuarios`
 *   cuenta todas las cuentas de la firma, también las desactivadas, así que
 *   la confirmación dice que el puesto sigue ocupado.
 * · En la explicación de roles, «recarga saldo» y «pone el membrete» como
 *   poderes del socio: el servidor no les pone puerta de rol —cualquier
 *   usuario puede recargar o guardar el membrete—, y decir lo contrario sería
 *   describir una frontera que no existe.
 * · «Última actividad»: lo que existe es el último INGRESO (Supabase Auth), y
 *   la columna se llama así.
 * · Tope de gasto, segundo factor, dominio de correo y los roles de
 *   dependiente y contabilidad: se declaran como pendientes en la nota final,
 *   igual que en el artboard, sin interruptores muertos.
 */

interface FirmUsersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  firmName: string;
  firmNit?: string;
  /**
   * El correo de la sesión: a uno mismo no se le ofrecen acciones que el
   * servidor rechaza. Opcional porque Ajustes también monta esta pantalla; sin
   * él se lee del contexto de la firma, que dice lo mismo.
   */
  correoPropio?: string;
  /** El plan, para los puestos. Sin él se lee del contexto del plan; `null` mientras no se lea. */
  plan?: PlanDeFirma | null;
  /** «Ver los planes» cuando no quedan puestos. */
  onVerPlanes?: () => void;
}

const pesos = (v: number): string => `$${Math.round(v).toLocaleString('es-CO')}`;

type CambioDeRol = { usuario: UsuarioDeFirma; a: 'FIRM_ADMIN' | 'LAWYER' };

const nombreDe = (u: UsuarioDeFirma): string => u.nombre ?? u.email;

export const FirmUsersDialog: React.FC<FirmUsersDialogProps> = ({
  isOpen,
  onClose,
  firmName,
  firmNit,
  correoPropio: correoDeProps,
  plan: planDeProps,
  onVerPlanes: verPlanesDeProps
}) => {
  const tenant = useTenant();
  const contextoDelPlan = usePlan();
  const correoPropio = correoDeProps ?? tenant.currentUserEmail;
  const plan = planDeProps !== undefined ? planDeProps : contextoDelPlan.plan;
  const onVerPlanes = verPlanesDeProps ?? (contextoDelPlan.puedePagar ? contextoDelPlan.abrirPlan : undefined);
  const [usuarios, setUsuarios] = useState<UsuarioDeFirma[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [porRetirar, setPorRetirar] = useState<UsuarioDeFirma | null>(null);
  const [porCambiar, setPorCambiar] = useState<CambioDeRol | null>(null);
  /** `null` = cerrado; texto = el diálogo abierto, con el mensaje del servidor si lo hubo. */
  const [sinPuestos, setSinPuestos] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      setUsuarios(await firmUsersApi.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron listar los usuarios.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (isOpen) void cargar();
  }, [isOpen]);

  /*
   * LOS PUESTOS SE CUENTAN SOBRE LA LISTA RECIÉN LEÍDA. El plan de App se leyó
   * al entrar; tras crear una cuenta su conteo queda atrás. La lista sale del
   * mismo filtro que usa el servidor para contar (`app_metadata.firm_id`), así
   * que cuando está cargada manda ella.
   */
  const puestos = useMemo(
    () => (plan ? { ...plan, usuarios: usuarios.length > 0 ? usuarios.length : plan.usuarios } : null),
    [plan, usuarios.length]
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => u.email.toLowerCase().includes(q) || (u.nombre ?? '').toLowerCase().includes(q));
  }, [usuarios, busqueda]);

  const agregar = () => {
    if (!quedanPuestos(puestos)) {
      setSinPuestos('');
      return;
    }
    setCrearAbierto(true);
  };

  const ejecutar = async (fn: () => Promise<void>, alTerminar: () => void) => {
    setOcupado(true);
    setError('');
    try {
      await fn();
      alTerminar();
      await cargar();
    } catch (e) {
      alTerminar();
      setError(e instanceof Error ? e.message : 'No se pudo completar la acción.');
    } finally {
      setOcupado(false);
    }
  };

  const libres = puestos && puestos.maxUsers !== null ? Math.max(0, puestos.maxUsers - puestos.usuarios) : null;
  const nombreDelPlan = plan?.plan ? NOMBRE_DE_PLAN[plan.plan] : 'actual';
  const enPalabras = puestosEnPalabras(puestos);

  return (
    /* El de adentro solo viste la pantalla: las confirmaciones de abajo conservan el título de diálogo. */
    <div className="cara-nueva cn-adm-dialogos">
      <div className="cn-adm-pantalla">
      <Dialog
        abierto={isOpen}
        onCerrar={onClose}
        tamano="L"
        titulo="Su firma"
        subtitulo={
          <>
            {firmName}
            {firmNit && (
              <>
                {' '}· NIT <span className="cn-adm-mono">{firmNit}</span>
              </>
            )}
            {enPalabras && <> · {enPalabras}</>}
          </>
        }
        pieIzquierda={<span>Retirar a alguien le quita el acceso; su trabajo y su rastro quedan en la firma.</span>}
        acciones={
          <button type="button" onClick={() => void cargar()} className="cn-adm-boton cn-adm-boton--suave" disabled={cargando}>
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
        }
      >
        {/*
          `overflow-wrap:anywhere` vive en las celdas: los correos son la
          materia de esta pantalla, y uno de sesenta caracteres no puede
          empujar la tabla fuera del teléfono.
        */}
        <div className="cn-adm-cuerpo">
          {error && (
            <p role="alert" className="cn-adm-error">
              {error}
            </p>
          )}

          <div className="cn-adm-barra">
            <div className="cn-adm-buscar">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por correo o nombre"
                aria-label="Buscar por correo o nombre"
                className="cn-adm-campo cn-adm-campo--buscar"
              />
            </div>
            <button type="button" onClick={agregar} className="cn-adm-boton cn-adm-boton--primario">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Agregar un abogado
            </button>
          </div>

          {/* ─── LA TABLA · Usuario · Rol · Consumo del mes · Último ingreso ─── */}
          <div className="cn-adm-tabla cn-adm-tabla--usuarios" role="table" aria-label="Usuarios de la firma">
            <div className="cn-adm-tabla-cabeza" role="row">
              <span role="columnheader">Usuario</span>
              <span role="columnheader">Rol</span>
              <span role="columnheader" className="cn-adm-derecha">
                Consumo del mes
              </span>
              <span role="columnheader">Último ingreso</span>
              <span role="columnheader" className="sr-only">
                Acciones
              </span>
            </div>

            {visibles.map((u) => {
              const puede = accionesPosibles(u, correoPropio);
              const propio = u.email.trim().toLowerCase() === correoPropio.trim().toLowerCase();
              const detalle = [u.nombre, propio ? 'usted' : null, u.desactivado ? 'Retirado · conserva su rastro en Auditoría' : null]
                .filter(Boolean)
                .join(' · ');
              return (
                <div key={u.id} role="row" className={`cn-adm-fila ${u.desactivado ? 'cn-adm-fila--retirada' : ''}`}>
                  <div role="cell" className="cn-adm-usuario">
                    <p className="cn-adm-usuario-correo">{u.email}</p>
                    {detalle && <p className="cn-adm-usuario-detalle">{detalle}</p>}
                  </div>
                  <div role="cell" className="cn-adm-fila-rol">
                    <span className={`cn-adm-rol ${u.role === 'FIRM_ADMIN' ? 'cn-adm-rol--socio' : ''}`}>
                      {u.role === 'FIRM_ADMIN' && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
                        </svg>
                      )}
                      {ROL_EN_PALABRAS[u.role] ?? u.role}
                    </span>
                  </div>
                  <div role="cell" className="cn-adm-fila-consumo">
                    <span className="cn-adm-rotulo-movil">Consumo del mes</span>
                    <span className="cn-adm-mono">{u.consumoMesCop > 0 ? pesos(u.consumoMesCop) : '—'}</span>
                  </div>
                  <div role="cell" className={`cn-adm-fila-ingreso ${!u.ultimoAcceso && !u.desactivado ? 'cn-adm-fila-ingreso--nunca' : ''}`}>
                    <span className="cn-adm-rotulo-movil">Último ingreso</span>
                    {ultimoIngreso(u.ultimoAcceso)}
                  </div>
                  <div role="cell" className="cn-adm-fila-acciones">
                    {puede.cambiarRol && (
                      <button
                        type="button"
                        className="cn-adm-boton cn-adm-boton--terciario"
                        onClick={() => setPorCambiar({ usuario: u, a: u.role === 'FIRM_ADMIN' ? 'LAWYER' : 'FIRM_ADMIN' })}
                      >
                        {u.role === 'FIRM_ADMIN' ? 'Pasar a abogado' : 'Hacer socio'}
                      </button>
                    )}
                    {puede.retirar && (
                      <button
                        type="button"
                        className="cn-adm-boton cn-adm-boton--terciario cn-adm-boton--texto-peligro"
                        onClick={() => setPorRetirar(u)}
                      >
                        Retirar
                      </button>
                    )}
                    {puede.reactivar && (
                      <button
                        type="button"
                        className="cn-adm-boton cn-adm-boton--terciario"
                        disabled={ocupado}
                        onClick={() => void ejecutar(() => firmUsersApi.setActivo(u.id, true), () => undefined)}
                      >
                        Reactivar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {visibles.length === 0 && (
              <p className="cn-adm-vacio">
                {cargando
                  ? 'Leyendo los usuarios de la firma…'
                  : usuarios.length === 0
                    ? 'Todavía no hay usuarios en la firma.'
                    : 'Ningún usuario coincide con la búsqueda.'}
              </p>
            )}
          </div>

          {/* ─── LOS DOS ROLES, CON SU DIFERENCIA REAL (la que impone el servidor) ─── */}
          <section className="cn-adm-nota">
            <h3 className="cn-adm-nota-titulo">Dos roles, una diferencia real</h3>
            <div className="cn-adm-nota-roles">
              <div>
                <p className="cn-adm-nota-rol">Socio · administrador</p>
                <p className="cn-adm-nota-texto">
                  Todo lo del abogado, y además: agrega y retira usuarios, cambia roles, paga el plan y{' '}
                  <strong>verifica actuaciones del catálogo</strong> para toda la firma.
                </p>
              </div>
              <div>
                <p className="cn-adm-nota-rol">Abogado litigante</p>
                <p className="cn-adm-nota-texto">
                  Trabaja: redacta, revisa, transcribe y consulta. Consume del saldo compartido, que cualquier usuario
                  de la firma puede recargar.
                </p>
              </div>
            </div>
            <p className="cn-adm-nota-frontera">
              La única frontera que importa: <strong>verificar es de socios</strong>. Una verificación dice «esta firma
              responde por este término», y el servidor no deja que la firme cualquiera.
            </p>
          </section>

          <section className="cn-adm-nota cn-adm-nota--gris">
            <h3 className="cn-adm-nota-titulo">Lo que todavía no existe, y por qué no está pintado aquí</h3>
            <p className="cn-adm-nota-texto">
              Tope de gasto por usuario, segundo factor, restricción de dominio de correo, invitaciones por correo y los
              roles de dependiente judicial y contabilidad. Cada uno necesita trabajo de servidor: un interruptor que no
              impone nada en el servidor es peor que su ausencia.
            </p>
          </section>
        </div>
      </Dialog>
      </div>

      <CrearUsuarioDialog
        abierto={crearAbierto}
        onCerrar={() => setCrearAbierto(false)}
        onCreado={() => void cargar()}
        onSinPuestos={(mensaje) => {
          setCrearAbierto(false);
          setSinPuestos(mensaje);
        }}
        subtitulo={
          libres !== null && puestos?.maxUsers
            ? `${libres === 1 ? 'Queda 1 puesto libre' : `Quedan ${libres} puestos libres`} de los ${puestos.maxUsers} del plan ${nombreDelPlan}.`
            : 'La cuenta queda activa de inmediato, con la contraseña que usted entregue.'
        }
      />

      {/* ─── RETIRAR · confirmación destructiva, #8C2F26 ─────────────────── */}
      <Dialog
        abierto={porRetirar !== null}
        onCerrar={() => !ocupado && setPorRetirar(null)}
        tamano="S"
        titulo={porRetirar ? `¿Retirar a ${nombreDe(porRetirar)}?` : ''}
        acciones={
          <>
            <button type="button" className="cn-adm-boton cn-adm-boton--terciario" disabled={ocupado} onClick={() => setPorRetirar(null)}>
              No, dejarlo
            </button>
            <button
              type="button"
              className="cn-adm-boton cn-adm-boton--peligro"
              disabled={ocupado}
              onClick={() =>
                porRetirar && void ejecutar(() => firmUsersApi.setActivo(porRetirar.id, false), () => setPorRetirar(null))
              }
            >
              {ocupado ? 'Retirando…' : 'Sí, retirarlo'}
            </button>
          </>
        }
      >
        <p className="cn-adm-texto">
          Pierde el acceso en menos de un minuto y <strong>sigue ocupando su puesto</strong> del plan mientras la cuenta
          exista. <strong>Su trabajo no se borra</strong>: los borradores, las revisiones y los casos que abrió siguen en
          la firma, con su nombre.
        </p>
        <p className="cn-adm-recuadro">
          Lo que hizo queda en la auditoría. Retirarlo no borra ese registro, y puede reactivarlo cuando quiera.
        </p>
      </Dialog>

      {/* ─── CAMBIAR EL ROL · no destruye, pero da o quita poderes: se confirma ─── */}
      <Dialog
        abierto={porCambiar !== null}
        onCerrar={() => !ocupado && setPorCambiar(null)}
        tamano="S"
        titulo={
          porCambiar
            ? porCambiar.a === 'FIRM_ADMIN'
              ? `¿Hacer socio a ${nombreDe(porCambiar.usuario)}?`
              : `¿Pasar a ${nombreDe(porCambiar.usuario)} a abogado litigante?`
            : ''
        }
        acciones={
          <>
            <button type="button" className="cn-adm-boton cn-adm-boton--terciario" disabled={ocupado} onClick={() => setPorCambiar(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="cn-adm-boton cn-adm-boton--primario"
              disabled={ocupado}
              onClick={() =>
                porCambiar &&
                void ejecutar(() => firmUsersApi.setRol(porCambiar.usuario.id, porCambiar.a), () => setPorCambiar(null))
              }
            >
              {ocupado ? 'Cambiando…' : porCambiar?.a === 'FIRM_ADMIN' ? 'Sí, hacerlo socio' : 'Sí, cambiar el rol'}
            </button>
          </>
        }
      >
        <p className="cn-adm-texto">
          {porCambiar?.a === 'FIRM_ADMIN'
            ? 'Podrá agregar y retirar usuarios, cambiar roles, pagar el plan y verificar actuaciones del catálogo para toda la firma.'
            : 'Deja de poder administrar usuarios, pagar el plan y verificar actuaciones. Conserva su trabajo.'}{' '}
          El cambio rige en menos de un minuto.
        </p>
      </Dialog>

      {/* ─── NO QUEDAN PUESTOS · antes de abrir el formulario, o con el 409 del servidor ─── */}
      <Dialog
        abierto={sinPuestos !== null}
        onCerrar={() => setSinPuestos(null)}
        tamano="S"
        titulo="No quedan puestos"
        acciones={
          <>
            <button type="button" className="cn-adm-boton cn-adm-boton--terciario" onClick={() => setSinPuestos(null)}>
              Ver los usuarios
            </button>
            {onVerPlanes && (
              <button
                type="button"
                className="cn-adm-boton cn-adm-boton--primario"
                onClick={() => {
                  setSinPuestos(null);
                  onVerPlanes();
                }}
              >
                Ver los planes
              </button>
            )}
          </>
        }
      >
        <p className="cn-adm-texto">
          {sinPuestos ||
            (puestos?.maxUsers
              ? `El plan ${nombreDelPlan} llega a ${puestos.maxUsers} ${puestos.maxUsers === 1 ? 'usuario' : 'usuarios'} y la firma ya tiene ${puestos.usuarios}. Puede pasar a un plan con más puestos.`
              : 'El plan de la firma no admite más usuarios.')}
        </p>
        <p className="cn-adm-recuadro">Las cuentas retiradas también ocupan su puesto mientras existan.</p>
      </Dialog>
    </div>
  );
};

/**
 * Agregar un abogado. Diálogo M del artboard 2: correo, nombre opcional, rol en
 * dos tarjetas y contraseña inicial. Directo con contraseña —no hay correo de
 * invitación— y la pantalla lo dice antes de crear.
 */
const CrearUsuarioDialog: React.FC<{
  abierto: boolean;
  onCerrar: () => void;
  onCreado: () => void;
  onSinPuestos: (mensaje: string) => void;
  subtitulo: string;
}> = ({ abierto, onCerrar, onCreado, onSinPuestos, subtitulo }) => {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'FIRM_ADMIN' | 'LAWYER'>('LAWYER');
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);

  // 8 caracteres: la misma regla que impone `addUserToFirm` (WEAK_PASSWORD).
  const listo = email.includes('@') && password.length >= 8;

  const limpiar = () => {
    setEmail('');
    setNombre('');
    setPassword('');
    setRole('LAWYER');
    setError('');
  };

  const crear = async () => {
    if (!listo) return;
    setCreando(true);
    setError('');
    try {
      await firmUsersApi.crear(email.trim(), password, role, nombre);
      limpiar();
      onCreado();
      onCerrar();
    } catch (e) {
      if (esLimiteDeUsuarios(e)) {
        onSinPuestos(e instanceof Error ? e.message : '');
        return;
      }
      setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta.');
    } finally {
      setCreando(false);
    }
  };

  const OPCIONES: Array<{ valor: 'LAWYER' | 'FIRM_ADMIN'; detalle: string }> = [
    { valor: 'LAWYER', detalle: 'Trabaja y consume saldo' },
    { valor: 'FIRM_ADMIN', detalle: 'Además administra y verifica' }
  ];

  return (
    <Dialog
      abierto={abierto}
      onCerrar={onCerrar}
      tamano="M"
      titulo="Agregar un abogado"
      subtitulo={subtitulo}
      hayCambiosSinGuardar={Boolean(email || nombre || password)}
      onIntentoDeCerrarConCambios={() => undefined}
      acciones={
        <>
          <button type="button" onClick={onCerrar} className="cn-adm-boton cn-adm-boton--terciario" disabled={creando}>
            Cancelar
          </button>
          <button type="button" onClick={() => void crear()} className="cn-adm-boton cn-adm-boton--primario" disabled={!listo || creando}>
            {creando ? 'Creando…' : 'Crear el usuario'}
          </button>
        </>
      }
    >
      <div className="cn-adm-campos">
        <div>
          <label className="cn-adm-etiqueta" htmlFor="cn-adm-nuevo-correo">
            Correo
          </label>
          <input
            id="cn-adm-nuevo-correo"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@sufirma.co"
            className="cn-adm-campo"
          />
        </div>

        <div>
          <label className="cn-adm-etiqueta" htmlFor="cn-adm-nuevo-nombre">
            Nombre <span className="cn-adm-etiqueta-opcional">(opcional)</span>
          </label>
          <input
            id="cn-adm-nuevo-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre y apellido"
            className="cn-adm-campo"
          />
          <p className="cn-adm-ayuda">Si lo deja vacío, la persona lo pone desde Ajustes, en «Su cuenta».</p>
        </div>

        <div role="radiogroup" aria-label="Rol">
          <p className="cn-adm-etiqueta">Rol</p>
          <div className="cn-adm-opciones">
            {OPCIONES.map((o) => (
              <button
                key={o.valor}
                type="button"
                role="radio"
                aria-checked={role === o.valor}
                onClick={() => setRole(o.valor)}
                className={`cn-adm-opcion ${role === o.valor ? 'cn-adm-opcion--elegida' : ''}`}
              >
                <span className="cn-adm-opcion-titulo">{ROL_EN_PALABRAS[o.valor]}</span>
                <span className="cn-adm-opcion-detalle">{o.detalle}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="cn-adm-etiqueta" htmlFor="cn-adm-nuevo-clave">
            Contraseña inicial
          </label>
          <input
            id="cn-adm-nuevo-clave"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="cn-adm-campo"
          />
          <p className="cn-adm-ayuda">
            Se la entrega usted por un canal seguro; no sale ningún correo. La cuenta queda activa de inmediato y ocupa
            un puesto del plan.
          </p>
        </div>

        {error && (
          <p role="alert" className="cn-adm-error">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
};
