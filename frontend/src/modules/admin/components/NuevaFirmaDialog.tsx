import React from 'react';
import { Dialog } from '../../../design/Dialog';
import { adminApi } from '../admin.api';
import { REGLA_DE_CORTESIA } from '../consolaEnPantalla';

/**
 * Dar de alta una firma con la cuenta de su socio administrador.
 * Cara nueva: derivada. El artboard 1 de `app-consola-de-operacion.html` trae el
 * botón «Nueva firma» y no dibuja su formulario; la anatomía es la del diálogo
 * M de «Nuevo caso» en `app-dialogos-y-estados.html` (campos con etiqueta
 * arriba, opcionales marcados, pie Cancelar · primario).
 *
 * ─── LA REGLA DE LA CORTESÍA VA ARRIBA, NO EN LETRA PEQUEÑA ────────────────
 *
 * Una firma que crea el superusuario nace en Premium, en cortesía y sin
 * vencimiento (`createFirm`, decisión del dueño del 14 de septiembre de 2026):
 * no le corre la prueba de siete días de las altas por su cuenta, y no vence
 * hasta que alguien le cambie el plan desde la ficha. Quien la crea tiene que
 * saberlo ANTES de pulsar, porque le está regalando un plan sin fecha.
 *
 * ─── LO QUE SALE POR CORREO Y LO QUE NO ────────────────────────────────────
 *
 * `createFirm` intenta la bienvenida al administrador cuando hay correo saliente
 * (`correoDeFirmaCreada`), y ese correo NO lleva la contraseña: no se le pasa.
 * Si el envío falla, el alta no se cae y el servidor solo lo registra, así que
 * la pantalla no afirma que el correo salió.
 *
 * ─── LA CONTRASEÑA, CON EL MÍNIMO DE OPERACIÓN ─────────────────────────────
 *
 * El servidor no le pone mínimo propio al alta (lo decide Supabase Auth); aquí
 * se exigen los mismos diez caracteres que operación exige al restablecer una
 * contraseña, para que las dos puertas del operador pidan lo mismo.
 */

const MIN_CONTRASENA = 10;

interface NuevaFirmaDialogProps {
  abierto: boolean;
  onCerrar: () => void;
  onCreada: (nombre: string) => void;
}

const VACIO = { nombre: '', nit: '', correo: '', contrasena: '', saldo: '' };

export const NuevaFirmaDialog: React.FC<NuevaFirmaDialogProps> = ({ abierto, onCerrar, onCreada }) => {
  const [campos, setCampos] = React.useState(VACIO);
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!abierto) return;
    setCampos(VACIO);
    setError('');
  }, [abierto]);

  const poner = (campo: keyof typeof VACIO) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCampos((c) => ({ ...c, [campo]: e.target.value }));

  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.correo.trim());
  const faltan = Math.max(0, MIN_CONTRASENA - campos.contrasena.length);
  const saldo = Number(campos.saldo.replace(/[^\d]/g, ''));
  const listo = campos.nombre.trim().length >= 2 && correoValido && faltan === 0 && !enviando;
  const hayAlgo = Object.values(campos).some((v) => v.trim().length > 0);

  const crear = async () => {
    if (!listo) return;
    setEnviando(true);
    setError('');
    try {
      const r = await adminApi.createFirm({
        firmName: campos.nombre.trim(),
        nit: campos.nit.trim(),
        adminEmail: campos.correo.trim(),
        adminPassword: campos.contrasena,
        initialCredits: saldo > 0 ? saldo : undefined
      });
      onCreada(r.firm?.name ?? campos.nombre.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la firma.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog
      abierto={abierto}
      onCerrar={enviando ? () => undefined : onCerrar}
      titulo="Nueva firma"
      subtitulo="La firma y la cuenta de su socio administrador, en un solo paso."
      tamano="M"
      hayCambiosSinGuardar={hayAlgo || enviando}
      onIntentoDeCerrarConCambios={() => undefined}
      acciones={
        <>
          <button type="button" className="cn-ope-boton cn-ope-boton--terciario" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </button>
          <button type="button" className="cn-ope-boton cn-ope-boton--primario" onClick={() => void crear()} disabled={!listo}>
            {enviando ? 'Creando…' : 'Crear la firma y su cuenta'}
          </button>
        </>
      }
    >
      <div className="cn-ope-cuerpo">
        <p className="cn-ope-recuadro cn-ope-recuadro--arriba">
          <strong>{REGLA_DE_CORTESIA}</strong>
        </p>

        <div className="cn-ope-campos">
          <div>
            <label htmlFor="ope-nf-nombre" className="cn-ope-etiqueta">
              Nombre de la firma
            </label>
            <input id="ope-nf-nombre" value={campos.nombre} onChange={poner('nombre')} className="cn-ope-campo" autoFocus />
          </div>

          <div className="cn-ope-dos">
            <div>
              <label htmlFor="ope-nf-nit" className="cn-ope-etiqueta">
                NIT <span className="cn-ope-etiqueta-opcional">(opcional)</span>
              </label>
              <input
                id="ope-nf-nit"
                value={campos.nit}
                onChange={poner('nit')}
                placeholder="000.000.000-0"
                className="cn-ope-campo cn-ope-campo--cifra"
              />
              <p className="cn-ope-ayuda">Un litigante persona natural no tiene.</p>
            </div>
            <div>
              <label htmlFor="ope-nf-saldo" className="cn-ope-etiqueta">
                Saldo inicial <span className="cn-ope-etiqueta-opcional">(opcional)</span>
              </label>
              <input
                id="ope-nf-saldo"
                inputMode="numeric"
                value={campos.saldo}
                onChange={poner('saldo')}
                placeholder="0"
                className="cn-ope-campo cn-ope-campo--cifra"
              />
              <p className="cn-ope-ayuda">En pesos. Queda como abono de la firma.</p>
            </div>
          </div>

          <div>
            <label htmlFor="ope-nf-correo" className="cn-ope-etiqueta">
              Correo del socio administrador
            </label>
            <input
              id="ope-nf-correo"
              type="email"
              value={campos.correo}
              onChange={poner('correo')}
              placeholder="nombre@firma.co"
              autoComplete="off"
              className="cn-ope-campo"
            />
            {campos.correo.trim().length > 0 && !correoValido && (
              <p className="cn-ope-ayuda cn-ope-ayuda--aviso">Ese correo no parece completo.</p>
            )}
          </div>

          <div>
            <label htmlFor="ope-nf-contrasena" className="cn-ope-etiqueta">
              Contraseña inicial
            </label>
            <input
              id="ope-nf-contrasena"
              type="password"
              value={campos.contrasena}
              onChange={poner('contrasena')}
              autoComplete="new-password"
              className="cn-ope-campo"
            />
            <p className={`cn-ope-ayuda ${faltan > 0 && campos.contrasena.length > 0 ? 'cn-ope-ayuda--aviso' : ''}`}>
              {faltan > 0 ? `Mínimo ${MIN_CONTRASENA} caracteres${campos.contrasena.length > 0 ? `: faltan ${faltan}` : ''}.` : 'Suficiente.'}
            </p>
          </div>
        </div>

        <p className="cn-ope-recuadro">
          Si el correo saliente está configurado, al socio administrador se le envía un aviso de bienvenida.{' '}
          <strong>La contraseña no va en ese correo</strong>: entréguela usted por un canal seguro y pídale que la cambie al entrar.
        </p>

        {error && (
          <p role="alert" className="cn-ope-error cn-ope-error--abajo">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
};
