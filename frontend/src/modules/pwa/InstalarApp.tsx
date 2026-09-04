import React, { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';
import { alCambiarInstalable, eventoDeInstalacion, pedirInstalacion } from './instalable';
import { enStandalone, esIOS } from '../push/pushCliente';

/**
 * «Instalar Iureon en este dispositivo».
 *
 * Tres situaciones y una sola regla: no se ofrece lo que no se puede hacer.
 *  · Ya está instalada (standalone): no se pinta nada.
 *  · Chrome/Edge guardaron el evento de instalación: un botón que abre el
 *    diálogo nativo.
 *  · iPhone/iPad en Safari: no hay evento; se explican los dos toques.
 *  · Cualquier otro caso (Firefox de escritorio, Chrome que aún no decide):
 *    nada, en vez de un botón que no hace nada.
 */
export const InstalarApp: React.FC<{ compacto?: boolean }> = ({ compacto = false }) => {
  const [instalada, setInstalada] = useState(() => enStandalone());
  const [hayEvento, setHayEvento] = useState(() => eventoDeInstalacion() !== null);
  const [estado, setEstado] = useState<'' | 'rechazada' | 'aceptada'>('');

  useEffect(() => {
    const parar = alCambiarInstalable(() => {
      setHayEvento(eventoDeInstalacion() !== null);
      setInstalada(enStandalone());
    });
    const media = window.matchMedia('(display-mode: standalone)');
    const alCambiar = () => setInstalada(enStandalone());
    media.addEventListener('change', alCambiar);
    return () => {
      parar();
      media.removeEventListener('change', alCambiar);
    };
  }, []);

  if (instalada) return null;

  if (hayEvento) {
    return (
      <div className={compacto ? '' : 'flex flex-col gap-2'}>
        <button
          type="button"
          onClick={() => {
            void pedirInstalacion().then((r) => {
              if (r === 'accepted') setEstado('aceptada');
              else if (r === 'dismissed') setEstado('rechazada');
            });
          }}
          className="btn-secondary btn-sm inline-flex items-center gap-2"
        >
          <Download className="h-3.5 w-3.5" />
          Instalar Iureon en este dispositivo
        </button>
        {!compacto && estado === 'aceptada' && (
          <p className="text-meta text-ink-500">Instalada. Ábrala desde su pantalla de inicio o su escritorio.</p>
        )}
      </div>
    );
  }

  if (esIOS()) {
    return (
      <p className="notice text-meta">
        <Share className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700" />
        <span>
          En iPhone o iPad: toque <strong>Compartir</strong> en Safari y luego{' '}
          <strong>Añadir a pantalla de inicio</strong>. Iureon se abre entonces como una aplicación y
          puede recibir avisos.
        </span>
      </p>
    );
  }

  return null;
};
