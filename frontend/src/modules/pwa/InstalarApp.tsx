import React, { useEffect, useState } from 'react';
import { Check, Download, Share } from 'lucide-react';
import '../../design/cara-nueva.css';
import { alCambiarInstalable, eventoDeInstalacion, pedirInstalacion } from './instalable';
import { situacionDeInstalacion } from './instalacionEnPantalla';
import { enStandalone, esIOS } from '../push/pushCliente';

/**
 * «Instalar Iureon en este dispositivo».
 *
 * Una sola regla: no se ofrece lo que no se puede hacer. Qué caso se pinta lo
 * decide `situacionDeInstalacion` (pura, recorrida por el check `avisosCara`):
 *  · Ya está instalada (standalone): una línea que lo confirma.
 *  · Chrome/Edge guardaron el evento de instalación: un botón que abre el
 *    diálogo nativo.
 *  · iPhone/iPad en Safari: no hay evento; se explican los dos toques.
 *  · La aceptó o la rechazó hace un momento: se dice. Antes el «Instalada» no
 *    se veía nunca, porque el evento se consume antes de la respuesta.
 *  · Cualquier otro caso (Firefox de escritorio, Chrome que aún no decide):
 *    nada, en vez de un botón que no hace nada.
 *
 * `conTitulo` pinta «Instalar la aplicación» encima: lo pide el diálogo de
 * Avisos, que no tiene otro rótulo; Ajustes ya trae el suyo.
 */
export const InstalarApp: React.FC<{ compacto?: boolean; conTitulo?: boolean }> = ({ compacto = false, conTitulo = false }) => {
  const [instalada, setInstalada] = useState(() => enStandalone());
  const [hayEvento, setHayEvento] = useState(() => eventoDeInstalacion() !== null);
  const [resultado, setResultado] = useState<'' | 'rechazada' | 'aceptada'>('');

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

  const situacion = situacionDeInstalacion({ instalada, hayEvento, esIOS: esIOS(), resultado });
  if (situacion === 'no-disponible') return null;
  /* Compacto no tiene sitio para confirmaciones: solo el botón o las instrucciones. */
  if (compacto && situacion !== 'instalable' && situacion !== 'ios-instrucciones') return null;

  const instalar = () => {
    void pedirInstalacion().then((r) => {
      if (r === 'accepted') setResultado('aceptada');
      else if (r === 'dismissed') setResultado('rechazada');
    });
  };

  return (
    <div className="cara-nueva cn-avi-instalar" data-situacion={situacion}>
      {conTitulo && <p className="cn-avi-instalar-titulo">Instalar la aplicación</p>}

      {situacion === 'instalada' && (
        <p className="cn-avi-instalar-ok">
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Iureon está instalada y abierta como aplicación en este dispositivo.</span>
        </p>
      )}

      {situacion === 'aceptada' && (
        <p className="cn-avi-instalar-ok" role="status">
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Instalada. Ábrala desde su pantalla de inicio o su escritorio.</span>
        </p>
      )}

      {situacion === 'instalable' && (
        <>
          {!compacto && (
            <p className="cn-avi-instalar-texto">
              Queda en el escritorio o en la pantalla de inicio del teléfono, y abre sin barra del navegador.
            </p>
          )}
          <button type="button" onClick={instalar} className="cn-avi-boton">
            <Download className="h-4 w-4" aria-hidden="true" />
            Instalar Iureon en este dispositivo
          </button>
        </>
      )}

      {situacion === 'ios-instrucciones' && (
        <p className="cn-avi-instalar-pasos">
          <Share className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            En iPhone o iPad: toque <strong>Compartir</strong> en Safari y luego <strong>Añadir a pantalla de inicio</strong>.
            Iureon se abre entonces como una aplicación y puede recibir avisos.
          </span>
        </p>
      )}

      {situacion === 'rechazada' && (
        <p className="cn-avi-instalar-texto" role="status">
          No se instaló. El navegador decide cuándo volver a ofrecerlo.
        </p>
      )}
    </div>
  );
};
