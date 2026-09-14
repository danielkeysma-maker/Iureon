import React from 'react';
import { Lock, LogOut } from 'lucide-react';
import { ZonaDeRiesgoDeCuenta } from '../../settings/components/ZonaDeRiesgoDeCuenta';
import { DIAS_DE_PRUEBA_GRATUITA } from '../pruebaTerminada';
import type { TrabajoConservado } from '../types';

/**
 * La pantalla completa de una firma cuya prueba gratuita terminó sin pagar.
 *
 * SIGUE EL MARCO «PRUEBA TERMINADA» DE `public/handoff/app-entrada-y-sesion.html`
 * (SPEC-entrada-y-sesion §3.3), con las correcciones del titular:
 *
 * - LOS DÍAS SON LOS DE LA PRUEBA PÚBLICA, NO 14. La maqueta copió el plazo
 *   del alta por operador; el número sale de `DIAS_DE_PRUEBA_GRATUITA`, que
 *   `check:prueba-terminada` ata a `trial.rules.ts`.
 * - NO HAY «EXPORTAR MI TRABAJO». La firma perdió todo el acceso (decisión del
 *   14 de septiembre de 2026) y el servidor responde 403 a cualquier descarga;
 *   ofrecer el botón sería prometer una salida que no existe.
 * - LE QUEDAN DOS COSAS: CONTRATAR Y BORRAR LO SUYO. «Ver planes» abre la misma
 *   pantalla de compra de siempre, que usa las rutas que el servidor deja
 *   abiertas para leer el plan y pagar. Y borrar la firma o la propia cuenta es
 *   la otra salida que el titular decidió dejar: quien ya no puede entrar tiene
 *   derecho a pedir la supresión de sus datos (Ley 1581 de 2012). Se usa el
 *   MISMO componente de «Ajustes» —contraseña, y el nombre exacto de la firma
 *   para borrarla—, no una copia: dos puertas de borrado se separan, y la que
 *   se quede atrás sería la que borra sin confirmar.
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
    <main className="flex min-h-[100dvh] w-full items-center justify-center bg-canvas px-4 py-8 font-sans">
      <div className="w-full max-w-[560px] overflow-hidden rounded-card border border-line-200 bg-surface shadow-e1">
        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <p className="mb-5 text-label tracking-[0.09em] text-ink-900">IUREON</p>

          <span className="mb-3 inline-flex items-center gap-1.5 rounded-control border border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))] px-2.5 py-1 text-label text-unverified">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            PRUEBA TERMINADA
          </span>

          <h1 className="text-display text-ink-900 [text-wrap:balance]">
            Los {DIAS_DE_PRUEBA_GRATUITA} días de prueba se acabaron
          </h1>

          <p className="mt-2 text-body text-ink-700 [text-wrap:pretty]">
            Su trabajo está intacto: no se borró nada
            {piezas.length > 0 ? ` y ${enumerar(piezas)} siguen aquí` : ''}. Para volver a entrar a la aplicación hay
            que contratar un plan.
          </p>

          <div className="mt-4 rounded-control bg-canvas px-4 py-3 text-ui text-ink-700">
            {saldo !== null && saldo > 0 ? (
              <>
                Le quedan <span className="font-mono text-ink-900">{pesos(saldo)}</span> de saldo sin usar. No se
                pierde: sigue ahí cuando active el plan.
              </>
            ) : (
              <>El saldo de recargas de la firma no se pierde: sigue ahí cuando active el plan.</>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={onVerPlanes} className="btn-primary min-h-[44px] px-5 text-body">
              {puedePagar ? 'Ver planes y contratar' : 'Ver los planes'}
            </button>
            <button type="button" onClick={onSalir} className="btn-neutral min-h-[44px] px-4 text-body">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Salir
            </button>
          </div>
        </div>

        {!puedePagar && (
          <p className="border-t border-line-100 bg-canvas px-5 py-4 text-ui text-ink-500 sm:px-7">
            Contratar el plan lo hace un socio administrador de la firma. Si usted no lo es, avísele.
          </p>
        )}

        {/*
          SI NO VA A CONTRATAR, PUEDE BORRAR LO SUYO. Va al final y separado:
          es irreversible, y no puede competir con la salida principal.
        */}
        <div className="border-t border-line-100 px-5 py-5 sm:px-7">
          <p className="text-ui text-ink-700">
            Si no va a contratar, puede borrar sus datos de Iureon. Este paso no se deshace.
          </p>
          <div className="mt-3">
            <ZonaDeRiesgoDeCuenta
              nombreDeLaFirma={nombreDeLaFirma}
              esAdministrador={esAdministrador}
              onEliminado={onEliminado}
            />
          </div>
        </div>
      </div>
    </main>
  );
};
