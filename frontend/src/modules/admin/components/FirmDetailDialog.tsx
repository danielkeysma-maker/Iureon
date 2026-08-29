import React from 'react';
import { AlertCircle, KeyRound, RefreshCw, ShieldOff } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { adminApi, type FirmDetail } from '../admin.api';
import { RequestSupportAccessDialog } from './RequestSupportAccessDialog';

/**
 * Ficha de la firma. Artboard 7b.
 *
 * ─── LO QUE OPERACIÓN NO PUEDE VER, Y POR QUÉ SE ESCRIBE EN LA PANTALLA ─────
 *
 * El artboard dedica un bloque entero a enumerar lo que operación NO alcanza:
 * escritos, borradores, clientes, expedientes, grabaciones y el catálogo curado
 * por la firma. No es un descargo de responsabilidad: es la promesa que 2c le
 * hace al cliente, escrita donde la lee quien tiene el poder. Y es cierta por
 * construcción — `getFirmDetail` no lee ni un campo de ese material, así que la
 * pantalla no tendría qué pintar aunque quisiera.
 *
 * ─── EL SALDO SE LEE EN DÍAS, Y EL NULO SE RESPETA ─────────────────────────
 *
 * «$412.500» no dice si la firma se queda sin servicio esta semana; «≈66 días»
 * sí. Cuando no hubo consumo en treinta días el servidor devuelve `null`: no
 * hay ritmo, luego no hay días. Se dice eso y no se inventa un número, que es
 * exactamente la regla que este código no rompe.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ──────────────────
 *
 * · Las seis acciones de operación —cambiar plan, abonar cortesía, extender
 *   prueba, reenviar invitaciones, exportar datos, suspender por mora— y la
 *   transferencia de titularidad: la consola ya ejerce las que el servidor
 *   soporta (`updateFirm`, `addCredits`). Reenviar invitaciones y exportar no
 *   tienen endpoint, y el artboard exige que CADA acción lleve motivo escrito.
 *   Pintar el botón antes que su motivo y su registro sería ofrecer un poder
 *   que no queda auditado.
 * · «Solicitar acceso de soporte» (7b′) YA ESTÁ, y llegó cuando existía lo que
 *   le da sentido: la 8a entera —autorización de un socio, alcance, duración
 *   del catálogo, franja permanente, registro de cada pantalla y revocación—.
 *   Antes de eso el botón habría sido lo contrario de lo que promete: una
 *   entrada que no le pide permiso a nadie.
 * · Pestañas «Plan y facturación», «Uso y consumo», «Incidencias»: no hay
 *   incidencias en el modelo, y lo de plan y consumo cabe entero en el resumen.
 */

const pesos = (valor: number): string => `$${Math.round(valor).toLocaleString('es-CO')}`;

const ROL: Record<string, string> = {
  FIRM_ADMIN: 'Socio · administrador',
  LAWYER: 'Abogado litigante',
  SUPER_ADMIN: 'Operación Iureon'
};

const hace = (iso: string | null): string => {
  if (!iso) return 'nunca ha entrado';
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 2) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
};

const fecha = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });

/** Lo que operación no alcanza. Va en la pantalla, no en una nota al pie. */
const FUERA_DE_ALCANCE: readonly string[] = [
  'Escritos, borradores y documentos adjuntos',
  'Clientes, expedientes y radicados',
  'Grabaciones y transcripciones',
  'El catálogo curado por la firma'
];

interface FirmDetailDialogProps {
  firmId: string | null;
  onClose: () => void;
}

const Metrica: React.FC<{ rotulo: string; valor: string; nota: string }> = ({
  rotulo,
  valor,
  nota
}) => (
  <div className="rounded-card border border-line-200 bg-surface px-4 py-3">
    <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
      {rotulo}
    </p>
    <p className="mt-1 text-[19px] font-semibold leading-none text-ink-900">{valor}</p>
    <p className="mt-1.5 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
      {nota}
    </p>
  </div>
);

export const FirmDetailDialog: React.FC<FirmDetailDialogProps> = ({ firmId, onClose }) => {
  const [firma, setFirma] = React.useState<FirmDetail | null>(null);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pidiendoAcceso, setPidiendoAcceso] = React.useState(false);

  React.useEffect(() => {
    if (!firmId) {
      setFirma(null);
      return;
    }
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
  }, [firmId]);

  const curado =
    firma && firma.catalogoTotal > 0
      ? Math.round((firma.catalogoCuradas / firma.catalogoTotal) * 100)
      : null;

  return (
    <Dialog
      abierto={firmId !== null}
      onCerrar={onClose}
      titulo={firma?.name ?? 'Ficha de la firma'}
      subtitulo={
        firma
          ? `NIT ${firma.nit} · cliente desde ${new Date(firma.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })} · id ${firma.id}`
          : 'Acciones de operación, y lo que operación no puede ver ni hacer.'
      }
      tamano="L"
      cuerpoEnCanvas
    >
      {cargando && (
        <div className="flex items-center justify-center gap-2 py-16 text-ink-400">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-[13px]">Leyendo la firma…</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-card border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.06)] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-justify text-[12px] leading-snug text-danger [text-wrap:pretty]">
            {error}
          </p>
        </div>
      )}

      {firma && !cargando && (
        <div className="space-y-4">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metrica
              rotulo="Saldo"
              valor={pesos(firma.creditsBalance)}
              nota={
                firma.diasDeSaldo === null
                  ? 'Sin consumo en 30 días: no hay ritmo del cual deducir cuántos días dura.'
                  : `≈ ${firma.diasDeSaldo} días al ritmo actual`
              }
            />
            <Metrica
              rotulo="Consumo 30 d"
              valor={pesos(firma.consumo30dCop)}
              nota={`${firma.transcriptions} transcripciones registradas`}
            />
            <Metrica
              rotulo="Usuarios activos"
              valor={`${firma.usuariosActivos14d} de ${firma.users}`}
              nota="Entraron en los últimos 14 días"
            />
            <Metrica
              rotulo="Catálogo curado"
              valor={curado === null ? '—' : `${curado}%`}
              nota={`${firma.catalogoCuradas} de ${firma.catalogoTotal} verificadas por la firma`}
            />
          </section>

          <section className="rounded-card border border-line-200 bg-surface">
            <header className="border-b border-line-200 px-4 py-3">
              <h3 className="text-[13px] font-semibold text-ink-900">Usuarios</h3>
              <p className="mt-0.5 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
                Nombre, rol y actividad. Sin acceso a sus casos. La firma los administra en su
                propia pantalla de gestión; operación solo los lee.
              </p>
            </header>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-line-200 text-left text-ink-400">
                  <th className="px-4 py-2 font-medium">Cuenta</th>
                  <th className="px-4 py-2 font-medium">Rol</th>
                  <th className="px-4 py-2 text-right font-medium">Consumo mes</th>
                  <th className="px-4 py-2 text-right font-medium">Últ. sesión</th>
                </tr>
              </thead>
              <tbody>
                {firma.usuarios.map((u) => (
                  <tr key={u.id} className="border-b border-line-200 last:border-0">
                    <td className="px-4 py-2.5 text-ink-900">
                      {u.email}
                      {u.desactivado && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10.5px] text-ink-400">
                          <ShieldOff className="h-3 w-3" /> desactivada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-ink-500">{ROL[u.role] ?? u.role}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-ink-700">
                      {pesos(u.consumoMesCop)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-ink-500">{hace(u.ultimoAcceso)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-card border border-line-200 bg-surface">
            <header className="border-b border-line-200 px-4 py-3">
              <h3 className="text-[13px] font-semibold text-ink-900">Registro de operación</h3>
              <p className="mt-0.5 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
                Todo lo que operación hizo sobre esta firma, visible también para sus socios. Un
                poder que cruza de un cliente a otro solo es aceptable cuando el cliente al que se
                entró puede leer qué se hizo.
              </p>
            </header>
            {firma.registroDeOperacion.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12px] text-ink-500">
                Operación no ha actuado sobre esta firma.
              </p>
            ) : (
              <ul className="divide-y divide-line-200">
                {firma.registroDeOperacion.slice(0, 12).map((e) => (
                  <li key={e.id} className="flex gap-3 px-4 py-2.5 text-[12px]">
                    <span className="shrink-0 tabular-nums text-ink-400">{fecha(e.timestamp)}</span>
                    <span className="min-w-0 flex-1 text-justify text-ink-900 [text-wrap:pretty]">
                      {e.resource || e.action}
                    </span>
                    <span className="shrink-0 text-ink-400">{e.userEmail}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-card border border-line-200 bg-canvas px-4 py-3">
            <h3 className="text-[13px] font-semibold text-ink-900">
              Lo que operación no puede ver
            </h3>
            <ul className="mt-2 grid gap-1.5 text-[12px] text-ink-700 sm:grid-cols-2">
              {FUERA_DE_ALCANCE.map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <ShieldOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
                  <span className="text-justify [text-wrap:pretty]">{x}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
              La restricción es técnica, no de interfaz: este endpoint no lee ni un campo de ese
              material, así que la pantalla no tendría qué mostrar aunque alguien lo pidiera. Es la
              misma promesa que Privacidad le hace al cliente de la firma.
            </p>

            {/*
              La única puerta, y está aquí a propósito: al final de la lista de
              lo que operación NO puede ver. Quien llega a este botón acaba de
              leer por qué existe el límite que va a pedir levantar.
            */}
            <button
              type="button"
              onClick={() => setPidiendoAcceso(true)}
              className="btn-secondary mt-3 flex items-center gap-2"
            >
              <KeyRound className="h-4 w-4" />
              Solicitar acceso de soporte
            </button>
          </section>
        </div>
      )}

      <RequestSupportAccessDialog
        firmId={pidiendoAcceso ? firmId : null}
        firmName={firma?.name ?? 'la firma'}
        onCerrar={() => setPidiendoAcceso(false)}
      />
    </Dialog>
  );
};
