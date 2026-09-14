import React from 'react';
import { Lock, LogOut } from 'lucide-react';
import { ZonaDeRiesgoDeCuenta } from '../../settings/components/ZonaDeRiesgoDeCuenta';
import { DIAS_DE_PRUEBA_GRATUITA } from '../pruebaTerminada';
import type { TrabajoConservado } from '../types';

/**
 * La pantalla completa de una firma cuya prueba gratuita terminó sin pagar.
 *
 * SIGUE EL MARCO «PRUEBA TERMINADA» DE `public/handoff/app-entrada-y-sesion.html`
 * (:165, SPEC-entrada-y-sesion §3.3): tarjeta blanca de radio 16 sobre gris, la
 * etiqueta en ámbar, el título de 24 px, el saldo en su recuadro, dos botones y
 * la franja inferior para quien no es socio. Con las correcciones del titular:
 *
 * - LOS DÍAS SON LOS DE LA PRUEBA PÚBLICA, NO 14. La maqueta copió el plazo
 *   del alta por operador; el número sale de `DIAS_DE_PRUEBA_GRATUITA`, que
 *   `check:prueba-terminada` ata a `trial.rules.ts`.
 * - NO HAY «EXPORTAR MI TRABAJO». La firma perdió todo el acceso (decisión del
 *   14 de septiembre de 2026) y el servidor responde 403 a cualquier descarga;
 *   ofrecer el botón sería prometer una salida que no existe.
 * - LA FRANJA NO NOMBRA EL CORREO DEL SOCIO. La maqueta lo pinta, pero la
 *   firma bloqueada solo puede leer su plan y su propia sesión: ese correo no
 *   llega a esta pantalla y no se inventa.
 * - LE QUEDAN DOS COSAS: CONTRATAR Y BORRAR LO SUYO. «Ver planes» abre la misma
 *   pantalla de compra de siempre, que usa las rutas que el servidor deja
 *   abiertas para leer el plan y pagar. Y borrar la firma o la propia cuenta es
 *   la otra salida que el titular decidió dejar: quien ya no puede entrar tiene
 *   derecho a pedir la supresión de sus datos (Ley 1581 de 2012). Se usa el
 *   MISMO componente de «Ajustes», no una copia: dos puertas de borrado se
 *   separan, y la que se quede atrás sería la que borra sin confirmar.
 *
 * LO QUE AFIRMA, EL SERVIDOR LO GARANTIZA: nada se borra al terminar la prueba y
 * el saldo sigue en la fila de la firma. Los números los cuenta el servidor; uno
 * que no pudo contar llega `null` y aquí NO se pinta — decir «0 borradores»
 * cuando no se supo sería afirmar que se perdieron.
 */
interface PruebaTerminadaViewProps {
  trabajo: TrabajoConservado | null;
  /** FIRM_ADMIN o SUPER_ADMIN: quien puede pagar. Los demás leen a quién pedírselo. */
  puedePagar: boolean;
  onVerPlanes: () => void;
  onSalir: () => void;
  /** Para confirmar el borrado de la firma: hay que teclearlo exacto. */
  nombreDeLaFirma: string;
  /** Solo el socio administrador puede borrar la firma entera; cualquiera, su propia cuenta. */
  esAdministrador: boolean;
  /** Tras borrar, la sesión ya no vale y la aplicación vuelve a la entrada. */
  onEliminado: () => void;
}

const pesos = (valor: number): string => `$${Math.round(valor).toLocaleString('es-CO')}`;

const cuenta = (n: number | null, singular: string, plural: string): string | null =>
  n === null || n <= 0 ? null : `${n.toLocaleString('es-CO')} ${n === 1 ? singular : plural}`;

/** «a», «a y b», «a, b y c». */
const enumerar = (partes: string[]): string =>
  partes.length <= 1 ? partes.join('') : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;

export const PruebaTerminadaView: React.FC<PruebaTerminadaViewProps> = ({
  trabajo,
  puedePagar,
  onVerPlanes,
  onSalir,
  nombreDeLaFirma,
  esAdministrador,
  onEliminado
}) => {
  const piezas = trabajo
    ? [
        cuenta(trabajo.expedientes, 'expediente', 'expedientes'),
        cuenta(trabajo.borradores, 'borrador', 'borradores'),
        cuenta(trabajo.audiencias, 'audiencia', 'audiencias')
      ].filter((p): p is string => p !== null)
    : [];
  const saldo = trabajo?.saldoCop ?? null;

  return (
    <main className="cara-nueva cn-plan-bloqueo">
      <div className="cn-plan-bloqueo-tarjeta">
        <div className="cn-plan-bloqueo-cuerpo">
          <p className="cn-plan-marca">IUREON</p>

          <span className="cn-plan-chip cn-plan-chip--aviso">
            <Lock className="cn-plan-chip-icono" aria-hidden="true" />
            PRUEBA TERMINADA
          </span>

          <h1 className="cn-plan-bloqueo-titulo">Los {DIAS_DE_PRUEBA_GRATUITA} días de prueba se acabaron</h1>

          <p className="cn-plan-bloqueo-texto">
            Su trabajo está intacto: no se borró nada
            {piezas.length > 0 ? `; siguen aquí ${enumerar(piezas)}` : ''}. Para volver a entrar a la aplicación hay
            que contratar un plan.
          </p>

          <div className="cn-plan-bloqueo-saldo">
            {saldo !== null && saldo > 0 ? (
              <p>
                Le quedan <span className="cn-plan-cifra-en-texto">{pesos(saldo)}</span> de saldo sin usar. No se
                pierde: sigue ahí cuando active el plan.
              </p>
            ) : (
              <p>El saldo de recargas de la firma no se pierde: sigue ahí cuando active el plan.</p>
            )}
          </div>

          <div className="cn-plan-bloqueo-acciones">
            <button type="button" onClick={onVerPlanes} className="cn-plan-boton cn-plan-boton--primario min-h-[44px]">
              {puedePagar ? 'Ver planes y contratar' : 'Ver los planes'}
            </button>
            <button type="button" onClick={onSalir} className="cn-plan-boton cn-plan-boton--suave min-h-[44px]">
              <LogOut className="cn-plan-boton-icono" aria-hidden="true" />
              Salir
            </button>
          </div>
        </div>

        {!puedePagar && (
          <p className="cn-plan-bloqueo-franja">
            Contratar el plan lo hace un socio administrador de la firma. Si usted no lo es, avísele.
          </p>
        )}

        {/*
          SI NO VA A CONTRATAR, PUEDE BORRAR LO SUYO. Va al final y separado:
          es irreversible, y no puede competir con la salida principal.
        */}
        <div className="cn-plan-bloqueo-riesgo">
          <p className="cn-plan-bloqueo-texto">
            Si no va a contratar, puede borrar sus datos de Iureon. Este paso no se deshace.
          </p>
          <ZonaDeRiesgoDeCuenta
            nombreDeLaFirma={nombreDeLaFirma}
            esAdministrador={esAdministrador}
            onEliminado={onEliminado}
          />
        </div>
      </div>
    </main>
  );
};
