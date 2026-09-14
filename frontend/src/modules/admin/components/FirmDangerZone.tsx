import React from 'react';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { adminApi, type FirmDetail } from '../admin.api';
import { cifra, faltaParaElMotivo } from '../consolaEnPantalla';

/**
 * La zona de riesgo de la ficha: eliminar la firma con todo lo suyo.
 * Cara nueva: `public/handoff/app-consola-de-operacion.html`, artboard 4
 * (segundo diálogo: «Zona de riesgo», «Eliminar esta firma y sus datos», «Cite
 * la autorización de la firma», «Para confirmar, escriba …», «Todavía no
 * coincide.» y el botón inhabilitado hasta que las dos cosas estén).
 *
 * ES LA ÚNICA ACCIÓN DE LA CONSOLA QUE NO SE DESHACE, y la pantalla lo trata
 * así: al final de la ficha, aparte, con el rojo de peligro, y su diálogo exige
 * dos cosas que un clic distraído no produce —el motivo citando quién autorizó
 * y cuándo, y el nombre exacto de la firma tecleado—.
 *
 * LO QUE NO SE VA es el registro de que ese correo ya usó su prueba gratuita:
 * si borrar la firma lo borrara, pedir el borrado sería la forma de estrenar
 * otra prueba. QUEDA EN LA AUDITORÍA DEL OPERADOR, porque la de la firma se va
 * con ella; el servidor rechaza la firma del propio operador por diseño.
 */

interface FirmDangerZoneProps {
  firma: FirmDetail;
  onEliminada: (resultado: { nombre: string; usuariosEliminados: number; advertencias: string[] }) => void;
}

export const FirmDangerZone: React.FC<FirmDangerZoneProps> = ({ firma, onEliminada }) => {
  const [abierto, setAbierto] = React.useState(false);
  const [motivo, setMotivo] = React.useState('');
  const [nombreEscrito, setNombreEscrito] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  /* Si el servidor rechaza, el diálogo se queda abierto con la razón a la vista, una vez. */
  const mantenerAbiertoRef = React.useRef(false);

  const motivoValido = faltaParaElMotivo(motivo) === 0;
  const nombreValido = nombreEscrito.trim() !== '' && nombreEscrito.trim() === firma.name.trim();

  const cerrar = () => {
    if (mantenerAbiertoRef.current) {
      mantenerAbiertoRef.current = false;
      return;
    }
    setAbierto(false);
    setMotivo('');
    setNombreEscrito('');
    setError(null);
  };

  const eliminar = async () => {
    setError(null);
    try {
      const r = await adminApi.eliminarFirma(firma.id, {
        motivo: motivo.replace(/\s+/g, ' ').trim(),
        confirmacion: nombreEscrito.trim()
      });
      onEliminada({ nombre: firma.name, usuariosEliminados: r.usuariosEliminados, advertencias: r.advertencias });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la firma.');
      mantenerAbiertoRef.current = true;
    }
  };

  const confirmacion: Confirmacion | null = abierto
    ? {
        titulo: 'Eliminar esta firma y sus datos',
        etiqueta: 'Eliminar la firma',
        peligro: true,
        deshabilitado: !(motivoValido && nombreValido),
        onConfirmar: eliminar,
        texto: (
          <div className="cn-ope-confirmacion">
            <p className="cn-ope-peligro-rotulo">Zona de riesgo</p>
            <p className="cn-ope-texto">
              Se va todo: escritos, revisiones, transcritos, casos, clientes, pagos, sus {cifra(firma.users)}{' '}
              {firma.users === 1 ? 'cuenta' : 'cuentas'} y el saldo. <strong>No se puede deshacer.</strong> Hágalo solo con la
              autorización expresa de la firma.
            </p>
            <div className="cn-ope-riesgo-campo">
              <label htmlFor="ope-borrado-motivo" className="cn-ope-etiqueta">
                Cite la autorización de la firma
              </label>
              <input
                id="ope-borrado-motivo"
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Quién la pidió y cuándo"
                className="cn-ope-campo cn-ope-campo--blanco"
                autoFocus
              />
              {motivo.length > 0 && !motivoValido && (
                <p className="cn-ope-ayuda cn-ope-ayuda--aviso">Faltan {faltaParaElMotivo(motivo)} caracteres.</p>
              )}
            </div>
            <div className="cn-ope-riesgo-campo">
              <label htmlFor="ope-borrado-nombre" className="cn-ope-etiqueta">
                Para confirmar, escriba <span className="cn-ope-peligro-nombre">{firma.name}</span>
              </label>
              <input
                id="ope-borrado-nombre"
                type="text"
                value={nombreEscrito}
                onChange={(e) => setNombreEscrito(e.target.value)}
                placeholder="El nombre exacto de la firma"
                autoComplete="off"
                spellCheck={false}
                className="cn-ope-campo cn-ope-campo--blanco"
              />
              {nombreEscrito.length > 0 && !nombreValido && <p className="cn-ope-ayuda cn-ope-ayuda--aviso">Todavía no coincide.</p>}
            </div>
            {error && (
              <p role="alert" className="cn-ope-error">
                {error}
              </p>
            )}
          </div>
        )
      }
    : null;

  return (
    <section className="cn-ope-riesgo" aria-labelledby="ope-riesgo">
      <p className="cn-ope-peligro-rotulo">Zona de riesgo</p>
      <h2 id="ope-riesgo" className="cn-ope-titulo">
        Eliminar esta firma y sus datos
      </h2>
      <p className="cn-ope-texto">
        Borra escritos, revisiones, transcritos, casos, clientes, pagos, usuarios y saldo, y no se puede deshacer. Solo con
        autorización de la firma; queda en su auditoría de operación con el motivo. El registro de la prueba gratuita se conserva.
      </p>
      <button
        type="button"
        className="cn-ope-boton cn-ope-boton--peligro"
        onClick={() => {
          setError(null);
          setAbierto(true);
        }}
      >
        Eliminar la firma
      </button>

      <ConfirmarDialog confirmacion={confirmacion} onCerrar={cerrar} />
    </section>
  );
};
