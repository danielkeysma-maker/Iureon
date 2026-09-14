import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePreferences, type Theme } from '../preferences';
import { AppearanceSection } from './AppearanceSection';
import { AtajosSection, AvisosSection, CuentaSection, InstalarSection } from './SeccionesSuyas';
import { PlanYSaldoSection } from './PlanYSaldoSection';
import { FirmBrandingModal } from '../../tenant/components/FirmBrandingModal';
import { FirmUsersDialog } from '../../tenant/components/FirmUsersDialog';
import { useTenant } from '../../tenant/TenantContext';
import { usePlan } from '../../subscriptions/PlanContext';
import { lineaDelVencimiento, nombreDelPlanActual } from '../../subscriptions/planEnPantalla';
import { EstiloDeLaFirmaSection } from '../../estilo/components/EstiloDeLaFirmaSection';
import { TITULO_SECCION_AJUSTES } from '../../estilo/estiloEnPantalla';
import { SECCION_ESTILO, alPedirElEstiloDeLaFirma } from '../../estilo/irAlEstilo';
import { PANTALLAS, recordado, recordar } from '../../tenant/pantallaRecordada';

/**
 * Ajustes, dividido en «Suyas» y «De la firma».
 *
 * SIGUE EL ARTBOARD «SU CUENTA» DE `public/handoff/app-ajustes-y-plan.html`
 * (:237): índice de 236 px sobre gris a la izquierda, sección a la derecha, y la
 * nota de que lo de la firma lo cambia un socio. En el teléfono (:460) el índice
 * es una lista de filas de 52 px con su valor a la derecha y la sección se abre
 * encima con «volver», porque dos columnas a 375 px dejan la sección en una
 * franja.
 *
 * LA DIVISIÓN SE DICE POR ESCRITO, no se insinúa con un separador. El error más
 * caro en una aplicación de despacho es cambiarle el membrete a todos creyendo
 * que se cambiaba el propio, y la única defensa que funciona es que la pantalla
 * lo afirme antes de que alguien toque algo.
 *
 * LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón:
 *  · «Privacidad y datos» y «Auditoría» — son otra unidad de trabajo, que el
 *    titular dejó para el final; no se pinta una entrada que no abre nada.
 *  · «Tarjeta profesional» en «Su cuenta» — no es un dato de la cuenta: la T.P.
 *    vive en el membrete de la firma, y un campo aquí no se guardaría en ninguna
 *    parte.
 *  · Los interruptores de aviso por tipo (transcripción, saldo bajo) — el
 *    servidor no avisa por tipo; los avisos se activan por dispositivo.
 * Y se quedan «Atajos de teclado», que la maqueta no dibuja y la aplicación sí
 * escucha: quitarlos esconde algo que funciona.
 *
 * «ESTILO DE LA FIRMA» (14 sep 2026) es la sección que promete el pie de
 * «Enseñar este formato». Se llega también desde ese diálogo: quien navega deja
 * la sección en `PANTALLAS.ajustes` (o pide ir con el evento de `irAlEstilo`),
 * y Ajustes abre en ella y la olvida.
 */

type Seccion = 'cuenta' | 'apariencia' | 'avisos' | 'instalar' | 'atajos' | 'plan' | 'estilo';

interface Entrada {
  id: Seccion | 'documento' | 'membrete' | 'usuarios';
  label: string;
}

const SUYAS: Entrada[] = [
  { id: 'cuenta', label: 'Su cuenta' },
  { id: 'apariencia', label: 'Apariencia' },
  { id: 'avisos', label: 'Avisos' },
  { id: 'instalar', label: 'Instalar la aplicación' },
  { id: 'atajos', label: 'Atajos de teclado' }
];

const DE_LA_FIRMA: Entrada[] = [
  { id: 'plan', label: 'Plan y saldo' },
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'membrete', label: 'Membrete' },
  { id: 'documento', label: 'Documento y formato' },
  { id: 'estilo', label: TITULO_SECCION_AJUSTES }
];

const NOMBRE_DEL_TEMA: Record<Theme, string> = { system: 'Sigue al sistema', light: 'Claro siempre', dark: 'Oscuro siempre' };

const pesos = (valor: number): string => `$${Math.round(valor).toLocaleString('es-CO')}`;

const fechaCorta = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

interface SettingsViewProps {
  /** Cerrar la sesión de este dispositivo, desde «Su cuenta». */
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onLogout }) => {
  /* En escritorio abre en «Su cuenta», como el artboard; en el teléfono manda `abiertaEnTelefono`. */
  const pedida = recordado(PANTALLAS.ajustes) === SECCION_ESTILO;
  const [seccion, setSeccion] = useState<Seccion>(pedida ? 'estilo' : 'cuenta');
  const [abiertaEnTelefono, setAbiertaEnTelefono] = useState(pedida);
  /* La sección pedida se usa una vez: volver a Ajustes otro día abre donde siempre. */
  React.useEffect(() => {
    recordar(PANTALLAS.ajustes, null);
    return alPedirElEstiloDeLaFirma(() => {
      recordar(PANTALLAS.ajustes, null);
      setSeccion('estilo');
      setAbiertaEnTelefono(true);
    });
  }, []);
  const { prefs, cambiar } = usePreferences();
  const { activeFirm } = useTenant();
  const { plan, abrirPlan, puedePagar } = usePlan();
  const [marcaAbierta, setMarcaAbierta] = useState(false);
  const [usuariosAbierto, setUsuariosAbierto] = useState(false);

  const abrirEntrada = (id: Entrada['id']) => {
    if (id === 'documento' || id === 'membrete') setMarcaAbierta(true);
    else if (id === 'usuarios') setUsuariosAbierto(true);
    else {
      setSeccion(id);
      setAbiertaEnTelefono(true);
    }
  };

  /*
   * EL VALOR DE CADA FILA EN EL TELÉFONO sale de lo que la aplicación ya sabe:
   * el tema elegido, el saldo de la firma y los usuarios que el plan contó. Si
   * el plan todavía no llegó, la fila va sin valor — nunca con un 0 inventado.
   */
  const valorEnTelefono = (id: Entrada['id']): React.ReactNode => {
    if (id === 'apariencia') return NOMBRE_DEL_TEMA[prefs.theme];
    if (id === 'plan') return <span className="cn-aju-cifra">{pesos(activeFirm.creditsBalance)}</span>;
    if (id === 'usuarios' && plan) return String(plan.usuarios);
    return null;
  };

  const Grupo: React.FC<{ titulo: string; nota?: string; entradas: Entrada[] }> = ({ titulo, nota, entradas }) => (
    <div className="cn-aju-grupo">
      <p className="cn-aju-grupo-titulo">{titulo}</p>
      {nota && <p className="cn-aju-grupo-nota">{nota}</p>}
      <div className="cn-aju-entradas">
        {entradas.map((e) => {
          const activa = e.id === seccion;
          const valor = valorEnTelefono(e.id);
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => abrirEntrada(e.id)}
              aria-current={activa ? 'page' : undefined}
              className={`cn-aju-entrada${activa ? ' cn-aju-entrada--activa' : ''}`}
            >
              <span className="cn-aju-entrada-nombre">{e.label}</span>
              {valor !== null && <span className="cn-aju-entrada-valor">{valor}</span>}
              <ChevronRight className="cn-aju-entrada-flecha" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      data-visita="vista-ajustes"
      className={`cara-nueva cn-aju${abiertaEnTelefono ? ' cn-aju--en-seccion' : ''}`}
    >
      <nav className="cn-aju-indice" aria-label="Secciones de Ajustes">
        <h1 className="cn-aju-titulo">Ajustes</h1>

        {/*
          EL PLAN ARRIBA DEL ÍNDICE, SOLO EN EL TELÉFONO (:466). En escritorio
          el plan tiene su sección; en el teléfono es lo primero que se busca al
          entrar a Ajustes, y abrir una sección para leer una fecha es un paso
          de más.
        */}
        {plan && (
          <div className="cn-aju-plan-telefono">
            <p className="cn-plan-kicker">{plan.estado === 'VENCIDO' ? 'Plan vencido' : 'Plan activo'}</p>
            <p className="cn-aju-plan-telefono-nombre">{nombreDelPlanActual(plan, null)}</p>
            <p className="cn-aju-plan-telefono-linea">
              {plan.maxUsers !== null ? `${plan.usuarios} de ${plan.maxUsers} puestos · ` : ''}
              {lineaDelVencimiento(plan, fechaCorta)}
            </p>
            <button type="button" onClick={abrirPlan} className="cn-plan-boton cn-plan-boton--blanco cn-plan-boton--ancho">
              {puedePagar ? 'Ver planes y pagar' : 'Ver los planes'}
            </button>
          </div>
        )}

        <Grupo titulo="Suyas" entradas={SUYAS} />
        <Grupo titulo="De la firma" nota="Lo cambia un socio y aplica a todos." entradas={DE_LA_FIRMA} />

        <p className="cn-aju-indice-nota">
          Lo de <b>De la firma</b> lo cambia un socio administrador y aplica a todos. Lo suyo no afecta a nadie más.
        </p>
      </nav>

      <main className="cn-aju-contenido">
        <button type="button" className="cn-aju-volver" onClick={() => setAbiertaEnTelefono(false)}>
          <ChevronLeft className="cn-aju-volver-icono" aria-hidden="true" />
          Ajustes
        </button>
        {seccion === 'cuenta' && <CuentaSection onLogout={onLogout} />}
        {seccion === 'apariencia' && <AppearanceSection prefs={prefs} cambiar={cambiar} />}
        {seccion === 'avisos' && <AvisosSection onInstalar={() => setSeccion('instalar')} />}
        {seccion === 'instalar' && <InstalarSection />}
        {seccion === 'atajos' && <AtajosSection />}
        {seccion === 'plan' && <PlanYSaldoSection />}
        {seccion === 'estilo' && <EstiloDeLaFirmaSection />}
      </main>

      <FirmBrandingModal isOpen={marcaAbierta} onClose={() => setMarcaAbierta(false)} />
      <FirmUsersDialog
        isOpen={usuariosAbierto}
        onClose={() => setUsuariosAbierto(false)}
        firmName={activeFirm?.name ?? ''}
        firmNit={activeFirm?.nit}
      />
    </div>
  );
};
