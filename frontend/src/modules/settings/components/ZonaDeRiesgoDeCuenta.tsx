import React from 'react';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { authApi } from '../../auth/auth.api';

/**
 * La zona de riesgo: irse de Iureon con lo suyo.
 *
 * SIGUE EL ARTBOARD «ZONA DE RIESGO» DE `public/handoff/app-ajustes-y-plan.html`
 * (:433): dos tarjetas que dicen qué se llevan, la segunda sobre el fondo de
 * peligro y solo para el socio administrador. En el teléfono (:490) Ajustes no
 * ofrece los botones y lo dice: «desde el computador, para no hacerlo sin
 * querer». La pantalla de la prueba terminada sí los ofrece en cualquier
 * tamaño, porque ahí borrar es una de sus dos únicas salidas.
 *
 * DOS PUERTAS, DISTINTAS EN LO QUE SE LLEVAN. «Borrar mi acceso» borra el
 * acceso de una persona y nada más: sus escritos, revisiones y transcritos son
 * trabajo de la firma y se quedan con ella. «Eliminar la firma y todos sus
 * datos» borra la firma entera. Lo único que sobrevive es el registro de que
 * ese correo ya usó su prueba gratuita, para que borrar no sea la forma de
 * estrenar otra.
 *
 * NINGUNA SE DESHACE, y las dos exigen la contraseña; la de la firma, además,
 * su nombre exacto tecleado. El botón de confirmar no responde hasta que lo
 * pedido esté. El servidor decide lo demás —el último usuario, el último
 * administrador— y su mensaje se muestra tal cual dentro del diálogo.
 *
 * LO QUE EL ARTBOARD PIDE Y AQUÍ ES DISTINTO: el nombre de la firma se teclea
 * dentro del diálogo, junto a la contraseña, y no en la tarjeta. El servidor
 * exige las dos cosas en la misma petición; partirlas en dos sitios dejaría un
 * nombre ya escrito esperando una contraseña que se pide en otra parte. Y no se
 * dice «el saldo que quede no se devuelve»: ninguna regla del servidor lo
 * decide, así que no se afirma.
 *
 * FUNCIONA CON EL PLAN VENCIDO Y CON LA PRUEBA TERMINADA: irse no puede
 * depender de pagar.
 */

interface ZonaDeRiesgoDeCuentaProps {
  nombreDeLaFirma: string;
  esAdministrador: boolean;
  /** Tras cualquiera de los dos borrados: la sesión ya no vale, la app vuelve a la entrada. */
  onEliminado: () => void;
  /** En Ajustes, el teléfono lee la nota y no los botones (:490). */
  soloEnComputador?: boolean;
}

type Puerta = 'usuario' | 'firma' | null;

export const ZonaDeRiesgoDeCuenta: React.FC<ZonaDeRiesgoDeCuentaProps> = ({
  nombreDeLaFirma,
  esAdministrador,
  onEliminado,
  soloEnComputador = false
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
    <label className="cn-aju-dlg-campo">
      <span className="cn-aju-etiqueta">Su contraseña</span>
      <input
        type="password"
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
        autoComplete="current-password"
        className="cn-aju-campo"
        autoFocus
      />
    </label>
  );

  const confirmacionDeUsuario: Confirmacion = {
    titulo: 'Borrar mi acceso',
    etiqueta: 'Borrar mi acceso',
    peligro: true,
    deshabilitado: contrasena === '',
    onConfirmar: () => ejecutar(() => authApi.eliminarMiUsuario(contrasena), 'No se pudo borrar su acceso.'),
    texto: (
      <div className="cn-aju-dlg">
        <p className="cn-aju-dlg-texto">
          Su acceso a Iureon desaparece y <b>no se puede deshacer</b>. Sus escritos, revisiones y transcritos son
          trabajo de la firma y <b>quedan en la firma</b>, con su correo como autor.
        </p>
        {campoContrasena}
        {error && (
          <p className="cn-aju-error" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  };

  const confirmacionDeFirma: Confirmacion = {
    titulo: 'Eliminar la firma y todos sus datos',
    etiqueta: 'Eliminar la firma',
    peligro: true,
    deshabilitado: !(contrasena !== '' && nombreValido),
    onConfirmar: () =>
      ejecutar(() => authApi.eliminarMiFirma(contrasena, nombreEscrito.trim()), 'No se pudo eliminar la firma.'),
    texto: (
      <div className="cn-aju-dlg">
        <p className="cn-aju-dlg-texto">
          Se va <b>todo</b> lo de <b>{nombreDeLaFirma}</b>: escritos, revisiones, transcripciones, clientes, pagos,
          usuarios y saldo. <b>No se puede deshacer.</b> El registro de la prueba gratuita se conserva, para que no se
          pueda volver a pedir.
        </p>
        {campoContrasena}
        <label className="cn-aju-dlg-campo">
          <span className="cn-aju-etiqueta">
            Para confirmar, escriba <span className="cn-aju-nombre-exacto">{nombreDeLaFirma}</span>
          </span>
          <input
            type="text"
            value={nombreEscrito}
            onChange={(e) => setNombreEscrito(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="El nombre exacto de la firma"
            className="cn-aju-campo"
          />
          {nombreEscrito.length > 0 && !nombreValido && <span className="cn-aju-no-coincide">Todavía no coincide.</span>}
        </label>
        {error && (
          <p className="cn-aju-error" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  };

  const confirmacion: Confirmacion | null =
    puerta === 'usuario' ? confirmacionDeUsuario : puerta === 'firma' ? confirmacionDeFirma : null;

  return (
    <section
      className={`cara-nueva cn-aju-riesgo${soloEnComputador ? ' cn-aju-riesgo--solo-computador' : ''}`}
      aria-labelledby="cn-aju-riesgo-titulo"
    >
      <div>
        <h3 id="cn-aju-riesgo-titulo" className="cn-aju-riesgo-titulo">
          Zona de riesgo
        </h3>
        <p className="cn-aju-riesgo-intro">Dos cosas distintas. Lea cuál es cuál antes de tocar nada.</p>
      </div>

      <p className="cn-aju-riesgo-telefono">
        Borrar su acceso{esAdministrador ? ' o eliminar la firma' : ''} se hace desde el computador, para no hacerlo
        sin querer.
      </p>

      <div className="cn-aju-riesgo-tarjeta">
        <p className="cn-aju-riesgo-tarjeta-titulo">Borrar mi acceso</p>
        <p className="cn-aju-riesgo-tarjeta-texto">
          Su acceso a Iureon desaparece y <b>no se puede deshacer</b>. Sus escritos, revisiones y transcritos son trabajo
          de la firma y <b>quedan en la firma</b>, con su correo como autor.
        </p>
        <button type="button" onClick={() => abrir('usuario')} className="cn-aju-boton cn-aju-boton--peligro-suave">
          Borrar mi acceso
        </button>
      </div>

      {esAdministrador && (
        <div className="cn-aju-riesgo-tarjeta cn-aju-riesgo-tarjeta--firma">
          <p className="cn-aju-riesgo-tarjeta-titulo">Eliminar la firma y todos sus datos</p>
          <p className="cn-aju-riesgo-tarjeta-texto">
            Se va <b>todo</b>: escritos, revisiones, transcritos, casos, clientes, pagos, usuarios y saldo.{' '}
            <b>No se puede deshacer</b>. El registro de la prueba gratuita se conserva, para que no se pueda volver a
            pedir.
          </p>
          <button type="button" onClick={() => abrir('firma')} className="cn-aju-boton cn-aju-boton--peligro">
            Eliminar la firma
          </button>
        </div>
      )}

      {esAdministrador && (
        <p className="cn-aju-riesgo-nota">Solo un socio administrador ve la segunda opción.</p>
      )}

      <div className="cn-aju-dialogos">
        <ConfirmarDialog confirmacion={confirmacion} onCerrar={cerrar} />
      </div>
    </section>
  );
};
