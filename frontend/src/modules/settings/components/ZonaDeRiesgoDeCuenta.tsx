import React from 'react';
import { AlertTriangle, Trash2, UserX } from 'lucide-react';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { authApi } from '../../auth/auth.api';

/**
 * La zona de riesgo de «Su cuenta»: irse de Iureon con lo suyo.
 *
 * DOS PUERTAS, DISTINTAS EN LO QUE SE LLEVAN. «Eliminar mi usuario» borra el
 * acceso de una persona y nada más: sus escritos, revisiones y transcritos
 * son trabajo de la firma y se quedan con ella. «Eliminar la firma y todos
 * sus datos» —solo para el socio administrador— borra la firma entera:
 * escritos, revisiones, transcripciones, clientes, pagos, usuarios y saldo.
 * Lo único que sobrevive es el registro de que ese correo ya usó su prueba
 * gratuita, para que borrar no sea la forma de estrenar otra.
 *
 * NINGUNA SE DESHACE, y las dos exigen la contraseña; la de la firma, además,
 * su nombre exacto tecleado. El botón de confirmar no responde hasta que lo
 * pedido esté. El servidor decide lo demás —el último usuario, el último
 * administrador— y su mensaje se muestra tal cual dentro del diálogo.
 *
 * FUNCIONA CON EL PLAN VENCIDO: irse no puede depender de pagar.
 */

const CAMPO =
  'mt-1 w-full rounded-control border border-line-200 bg-canvas px-2 py-1.5 text-[12px] text-ink-900 focus:border-brand-700 focus:outline-none';

interface ZonaDeRiesgoDeCuentaProps {
  nombreDeLaFirma: string;
  esAdministrador: boolean;
  /** Tras cualquiera de los dos borrados: la sesión ya no vale, la app vuelve a la entrada. */
  onEliminado: () => void;
}

type Puerta = 'usuario' | 'firma' | null;

export const ZonaDeRiesgoDeCuenta: React.FC<ZonaDeRiesgoDeCuentaProps> = ({
  nombreDeLaFirma,
  esAdministrador,
  onEliminado
}) => {
  const [puerta, setPuerta] = React.useState<Puerta>(null);
  const [contrasena, setContrasena] = React.useState('');
  const [nombreEscrito, setNombreEscrito] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  /*
   * `ConfirmarDialog` cierra al terminar `onConfirmar` sin distinguir éxito
   * de fallo. Si el servidor rechaza, el diálogo debe quedarse abierto con el
   * motivo a la vista: esta bandera le pide al cierre que no cierre, una vez.
   */
  const mantenerAbiertoRef = React.useRef(false);

  const nombreValido = nombreEscrito.trim() !== '' && nombreEscrito.trim() === nombreDeLaFirma.trim();

  const abrir = (cual: Exclude<Puerta, null>) => {
    setError(null);
    setContrasena('');
    setNombreEscrito('');
    setPuerta(cual);
  };

  const cerrar = () => {
    if (mantenerAbiertoRef.current) {
      mantenerAbiertoRef.current = false;
      return;
    }
    setPuerta(null);
    setContrasena('');
    setNombreEscrito('');
    setError(null);
  };

  const ejecutar = async (accion: () => Promise<unknown>, fallback: string) => {
    setError(null);
    try {
      await accion();
      onEliminado();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
      mantenerAbiertoRef.current = true;
    }
  };

  const campoContrasena = (
    <label className="block text-[11px] text-ink-500">
      Su contraseña
      <input
        type="password"
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
        autoComplete="current-password"
        className={CAMPO}
        autoFocus
      />
    </label>
  );

  const confirmacionDeUsuario: Confirmacion = {
    titulo: 'Eliminar mi usuario',
    etiqueta: 'Eliminar mi usuario',
    peligro: true,
    deshabilitado: contrasena === '',
    onConfirmar: () => ejecutar(() => authApi.eliminarMiUsuario(contrasena), 'No se pudo eliminar su usuario.'),
    texto: (
      <div className="space-y-3">
        <p className="text-justify [text-wrap:pretty]">
          Su acceso a Iureon desaparece y <b>no se puede deshacer</b>. Sus escritos, revisiones y transcritos
          son trabajo de la firma y <b>quedan en la firma</b>, con su correo como autor.
        </p>
        {campoContrasena}
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    )
  };

  const confirmacionDeFirma: Confirmacion = {
    titulo: 'Eliminar la firma y todos sus datos',
    etiqueta: 'Eliminar definitivamente',
    peligro: true,
    deshabilitado: !(contrasena !== '' && nombreValido),
    onConfirmar: () =>
      ejecutar(
        () => authApi.eliminarMiFirma(contrasena, nombreEscrito.trim()),
        'No se pudo eliminar la firma.'
      ),
    texto: (
      <div className="space-y-3">
        <p className="text-justify [text-wrap:pretty]">
          Se borran <b>todos</b> los datos de <b>{nombreDeLaFirma}</b>: escritos, revisiones, transcripciones,
          clientes, pagos, usuarios y saldo. <b>No se puede deshacer.</b> El registro de la prueba gratuita se
          conserva.
        </p>
        {campoContrasena}
        <label className="block text-[11px] text-ink-500">
          Escriba el nombre exacto de la firma: <b className="text-ink-900">{nombreDeLaFirma}</b>
          <input
            type="text"
            value={nombreEscrito}
            onChange={(e) => setNombreEscrito(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className={`${CAMPO} font-mono`}
          />
          {nombreEscrito.length > 0 && !nombreValido && (
            <span className="mt-0.5 block text-[10.5px] text-ink-400">Todavía no coincide.</span>
          )}
        </label>
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    )
  };

  const confirmacion: Confirmacion | null =
    puerta === 'usuario' ? confirmacionDeUsuario : puerta === 'firma' ? confirmacionDeFirma : null;

  return (
    <section className="mt-6 rounded-card border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.04)]">
      <header className="flex items-start gap-2 border-b border-[rgb(var(--danger)/0.25)] px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
        <div>
          <h3 className="text-[13px] font-semibold text-danger">Zona de riesgo</h3>
          <p className="mt-0.5 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
            Eliminar su usuario borra su acceso; sus escritos, revisiones y transcritos quedan en la firma.
            {esAdministrador &&
              ' Eliminar la firma borra escritos, revisiones, transcripciones, clientes, pagos, usuarios y saldo; solo se conserva el registro de la prueba gratuita.'}{' '}
            Ninguna de las dos se puede deshacer.
          </p>
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button type="button" onClick={() => abrir('usuario')} className="btn-danger btn-sm flex items-center gap-2">
          <UserX className="h-4 w-4" />
          Eliminar mi usuario
        </button>
        {esAdministrador && (
          <button type="button" onClick={() => abrir('firma')} className="btn-danger btn-sm flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Eliminar la firma y todos sus datos
          </button>
        )}
      </div>

      <ConfirmarDialog confirmacion={confirmacion} onCerrar={cerrar} />
    </section>
  );
};
