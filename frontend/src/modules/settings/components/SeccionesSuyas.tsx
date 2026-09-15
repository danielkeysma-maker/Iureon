import React from 'react';
import { LogOut } from 'lucide-react';
import { guardarNombreEnSesion, readSession } from '../../auth/session';
import { authApi } from '../../auth/auth.api';
import { nombreParaSaludar } from '../../inicio/saludo';
import { useTenant } from '../../tenant/TenantContext';
import { AvisosEnEsteDispositivo } from '../../push/components/AvisosEnEsteDispositivo';
import { InstalarApp } from '../../pwa/InstalarApp';
import { ZonaDeRiesgoDeCuenta } from './ZonaDeRiesgoDeCuenta';
import { ConfirmarCierreDeSesion } from '../../tenant/components/ConfirmarCierreDeSesion';

/**
 * Las secciones «Suyas» de Ajustes. Cada una reúne algo que YA existe en la
 * aplicación: los datos de la sesión, los avisos de este dispositivo, la
 * instalación y los atajos que los componentes escuchan. Ninguna promete nada
 * que no esté construido.
 *
 * FORMA: la de «Su cuenta» en `public/handoff/app-ajustes-y-plan.html` (:260) —
 * cabecera de 28 px, columna de 520 px, campos sobre gris de 46 px y
 * separadores de un píxel entre bloques.
 */

export const Cabecera: React.FC<{ titulo: string; texto: string }> = ({ titulo, texto }) => (
  <header className="cn-aju-cabecera">
    <h2 className="cn-aju-cabecera-titulo">{titulo}</h2>
    <p className="cn-aju-cabecera-texto">{texto}</p>
  </header>
);

/* ─── Atajos ─────────────────────────────────────────────────────────────── */

const esMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = esMac ? '⌘' : 'Ctrl';

/** Solo lo que los componentes escuchan hoy, verificado en su código. */
const ATAJOS: { pantalla: string; filas: { teclas: string[]; hace: string }[] }[] = [
  {
    pantalla: 'Redacción',
    filas: [{ teclas: [MOD, '↵'], hace: 'Genera el escrito con la instrucción escrita, sin soltar el teclado.' }]
  },
  {
    pantalla: 'Taller y chat de soporte',
    filas: [
      { teclas: ['↵'], hace: 'Envía el mensaje a la guía o a soporte.' },
      { teclas: ['Shift', '↵'], hace: 'Salta de línea sin enviar.' }
    ]
  },
  {
    pantalla: 'Audiencias y entrevistas',
    filas: [
      { teclas: ['↵'], hace: 'Guarda la corrección de la intervención que está editando.' },
      { teclas: ['Esc'], hace: 'Descarta la corrección y deja el texto como estaba.' }
    ]
  },
  {
    pantalla: 'En cualquier diálogo',
    filas: [{ teclas: ['Esc'], hace: 'Cierra el diálogo abierto.' }]
  }
];

export const AtajosSection: React.FC = () => (
  <section>
    <Cabecera titulo="Atajos de teclado" texto="Los que la aplicación escucha hoy. No hay que activar nada." />
    <div className="cn-aju-atajos">
      {ATAJOS.map((g) => (
        <div key={g.pantalla} className="cn-aju-atajo-grupo">
          <p className="cn-aju-subtitulo">{g.pantalla}</p>
          {g.filas.map((f, k) => (
            <div key={k} className="cn-aju-atajo">
              <span className="cn-aju-teclas">
                {f.teclas.map((t, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="cn-aju-mas">+</span>}
                    <kbd className="cn-aju-tecla">{t}</kbd>
                  </React.Fragment>
                ))}
              </span>
              <span className="cn-aju-atajo-texto">{f.hace}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  </section>
);

/* ─── Avisos ─────────────────────────────────────────────────────────────── */

/**
 * «Avisos» monta el componente de siempre (`AvisosEnEsteDispositivo`, con su
 * propia cara nueva y su check). La maqueta dibuja interruptores por tipo que
 * el servidor no tiene; aquí no se repiten.
 */
export const AvisosSection: React.FC<{ onInstalar: () => void }> = ({ onInstalar }) => (
  <section>
    <Cabecera titulo="Avisos" texto="Notificaciones de este dispositivo. Se activan aparato por aparato." />
    <div className="cn-aju-pila">
      <AvisosEnEsteDispositivo />
      <p className="cn-aju-ayuda">
        En iPhone los avisos solo llegan si Iureon está instalada en la pantalla de inicio.{' '}
        <button type="button" className="cn-aju-enlace" onClick={onInstalar}>
          Instalar la aplicación
        </button>
      </p>
    </div>
  </section>
);

/* ─── Instalar ───────────────────────────────────────────────────────────── */

export const InstalarSection: React.FC = () => (
  <section>
    <Cabecera
      titulo="Instalar la aplicación"
      texto="Queda en el escritorio o en la pantalla de inicio del teléfono, y abre sin navegador."
    />
    <div className="cn-aju-pila">
      <InstalarApp />
    </div>
  </section>
);

/* ─── Su cuenta ──────────────────────────────────────────────────────────── */

const ROL: Record<string, string> = { SUPER_ADMIN: 'Superusuario de la plataforma', FIRM_ADMIN: 'Socio administrador', LAWYER: 'Abogado' };

/**
 * «Su nombre» — el campo por el que una cuenta que YA existe se pone nombre.
 *
 * EL MARCADOR DE POSICIÓN NO ES UN VALOR. Mientras la persona no haya puesto
 * nada, el campo arranca VACÍO con el derivado del correo detrás, en gris: si
 * se precargara, el derivado quedaría guardado como si alguien lo hubiera
 * elegido en cuanto pulsara «Guardar» sin mirar. El servidor devuelve el
 * nombre ya recortado y ese es el que se pinta y se guarda en la sesión.
 */
const NombreDeUsuario: React.FC = () => {
  const { currentUserName, setCurrentUserName, currentUserEmail } = useTenant();
  const [borrador, setBorrador] = React.useState(currentUserName);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState('');
  const [guardado, setGuardado] = React.useState(false);

  React.useEffect(() => {
    setBorrador(currentUserName);
  }, [currentUserName]);

  const cambiado = borrador.trim() !== currentUserName.trim();

  const guardar = async () => {
    setGuardando(true);
    setError('');
    setGuardado(false);
    try {
      const nombre = await authApi.fijarMiNombre(borrador);
      setCurrentUserName(nombre);
      guardarNombreEnSesion(nombre);
      setBorrador(nombre);
      setGuardado(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar su nombre.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <label className="cn-aju-etiqueta" htmlFor="cn-aju-nombre">
        Su nombre
      </label>
      <input
        id="cn-aju-nombre"
        value={borrador}
        onChange={(e) => {
          setBorrador(e.target.value);
          setGuardado(false);
        }}
        placeholder={currentUserEmail ? nombreParaSaludar(currentUserEmail) : 'Su nombre'}
        maxLength={80}
        className="cn-aju-campo"
      />
      <p className="cn-aju-ayuda">
        {currentUserName
          ? 'Aparece en el panel lateral, en el saludo de Inicio y en la lista de usuarios de la firma.'
          : 'Todavía no tiene nombre guardado. Lo que se ve en gris es lo que la aplicación deduce de su correo; escriba el suyo para reemplazarlo.'}
      </p>
      {error && <p className="cn-aju-error" role="alert">{error}</p>}
      {guardado && !error && <p className="cn-aju-exito" role="status">Su nombre quedó guardado.</p>}
      <div className="cn-aju-acciones">
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={guardando || !cambiado || !borrador.trim()}
          className="cn-aju-boton cn-aju-boton--primario"
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
};

export const CuentaSection: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const sesion = readSession();
  const { activeFirm } = useTenant();
  /* La misma confirmación que la cabecera y el teléfono: salir desde Ajustes no es un gesto distinto. */
  const [confirmarSalida, setConfirmarSalida] = React.useState(false);

  return (
    <section>
      <Cabecera titulo="Su cuenta" texto="Solo lo suyo. Nadie más de la firma lo ve cambiar." />
      <div className="cn-aju-pila">
        <NombreDeUsuario />

        <div>
          <p className="cn-aju-etiqueta">Correo</p>
          <div className="cn-aju-dato-fijo">
            <span className="cn-aju-dato-fijo-valor">{sesion?.user.email ?? 'Sin correo en la sesión'}</span>
            <span className="cn-aju-dato-fijo-nota">no se puede cambiar</span>
          </div>
          <p className="cn-aju-ayuda">
            Con este correo entra y con este queda firmado lo que hace en la auditoría. Para cambiarlo, escriba a
            Soporte.
          </p>
        </div>

        <dl className="cn-aju-datos">
          <div className="cn-aju-dato">
            <dt>Rol</dt>
            <dd>{sesion ? ROL[sesion.user.role] ?? sesion.user.role : 'Sin sesión'}</dd>
          </div>
          <div className="cn-aju-dato">
            <dt>Firma</dt>
            <dd>{activeFirm.name}</dd>
          </div>
          <div className="cn-aju-dato">
            <dt>NIT de la firma</dt>
            <dd>{activeFirm.nit ? <span className="cn-aju-cifra">{activeFirm.nit}</span> : 'Sin NIT registrado'}</dd>
          </div>
        </dl>

        <div className="cn-aju-separador" />

        <div>
          <p className="cn-aju-subtitulo">Sesión y contraseña</p>
          <p className="cn-aju-ayuda">Para cambiar la contraseña, cierre la sesión y use «¿Olvidó su contraseña?» en la pantalla de entrar: le llega un enlace a su correo. Al cambiarla se cierran todas sus sesiones.</p>
          {onLogout && (
            <div className="cn-aju-acciones">
              <button type="button" onClick={() => setConfirmarSalida(true)} className="cn-aju-boton cn-aju-boton--suave">
                <LogOut className="cn-aju-boton-icono" aria-hidden="true" />
                Cerrar sesión en este dispositivo
              </button>
            </div>
          )}
          {onLogout && (
            <ConfirmarCierreDeSesion
              abierto={confirmarSalida}
              onCancelar={() => setConfirmarSalida(false)}
              onCerrarSesion={onLogout}
            />
          )}
        </div>

        {/*
          La cuenta de operación no se borra desde la aplicación: el servidor lo
          rechaza, y aquí ni se ofrece. Tras el borrado la sesión ya no vale, así
          que se cierra con el mismo gesto que «Cerrar sesión».
        */}
        {sesion && sesion.user.role !== 'SUPER_ADMIN' && (
          <>
            <div className="cn-aju-separador" />
            <ZonaDeRiesgoDeCuenta
              nombreDeLaFirma={activeFirm.name}
              esAdministrador={sesion.user.role === 'FIRM_ADMIN'}
              onEliminado={() => onLogout?.()}
              soloEnComputador
            />
          </>
        )}
      </div>
    </section>
  );
};
