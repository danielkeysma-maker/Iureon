import React, { useCallback, useEffect, useState } from 'react';
import { BellOff, BellRing, Send } from 'lucide-react';
import { InstalarApp } from '../../pwa/InstalarApp';
import { pushApi } from '../push.api';
import { activarAvisos, desactivarAvisos, leerEstado, type EstadoDeAvisos } from '../pushCliente';

/**
 * Los avisos en ESTE dispositivo: estado, activar, desactivar, probar.
 *
 * Se llama «en este dispositivo» y no «notificaciones» porque eso es lo que
 * de verdad se decide aquí: el teléfono sí, el portátil no. Cada estado se
 * dice con sus palabras —no soportado, denegado por el usuario, servidor sin
 * llaves— porque los tres se ven idénticos desde fuera (no llega nada) y
 * tienen arreglos distintos.
 *
 * Lo que avisa hoy está escrito abajo y es exactamente lo que el servidor
 * envía: soporte, y borradores creados o editados por otro abogado de la
 * firma. Nada más, para que nadie espere un aviso que no va a llegar.
 */
export const AvisosEnEsteDispositivo: React.FC = () => {
  const [estado, setEstado] = useState<EstadoDeAvisos>('cargando');
  const [servidor, setServidor] = useState<{ enabled: boolean; dispositivos: number } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    const local = await leerEstado();
    let remoto: { enabled: boolean; dispositivos: number } | null = null;
    try {
      const r = await pushApi.estado();
      remoto = { enabled: r.enabled, dispositivos: r.suscripcionesDelUsuario };
    } catch {
      /* Sin respuesta del servidor se muestra solo lo local. */
    }
    setServidor(remoto);
    setEstado(remoto && !remoto.enabled && local !== 'ios-sin-instalar' && local !== 'no-soportado' ? 'servidor-sin-llaves' : local);
  }, []);

  useEffect(() => {
    void refrescar();
  }, [refrescar]);

  const correr = async (accion: () => Promise<EstadoDeAvisos | void>) => {
    setOcupado(true);
    setMensaje(null);
    try {
      const nuevo = await accion();
      if (nuevo) setEstado(nuevo);
      await refrescar();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'No se pudo completar la acción.');
    } finally {
      setOcupado(false);
    }
  };

  const probar = async () => {
    setOcupado(true);
    setMensaje(null);
    try {
      const r = await pushApi.prueba();
      setMensaje(
        r.enviados > 0
          ? `Prueba enviada a ${r.enviados} dispositivo${r.enviados === 1 ? '' : 's'}. Debería aparecer en segundos.`
          : 'No se envió a ningún dispositivo. Active los avisos primero.'
      );
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'No se pudo enviar la prueba.');
    } finally {
      setOcupado(false);
    }
  };

  const descripcion: Record<EstadoDeAvisos, string> = {
    cargando: 'Comprobando…',
    'no-soportado': 'Este navegador no puede recibir avisos.',
    'ios-sin-instalar': 'En iPhone y iPad los avisos solo llegan a la aplicación instalada. Primero añádala a la pantalla de inicio y ábrala desde ahí.',
    'servidor-sin-llaves': 'El servidor no tiene configurados los avisos todavía. No depende de este dispositivo.',
    denegado: 'Este navegador tiene los avisos bloqueados para Iureon. Se cambia en los ajustes del sitio, no desde aquí.',
    activados: 'Activados en este dispositivo.',
    desactivados: 'Desactivados en este dispositivo.'
  };

  const Icono = estado === 'activados' ? BellRing : BellOff;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <Icono className={`mt-0.5 h-4 w-4 shrink-0 ${estado === 'activados' ? 'text-verified' : 'text-ink-400'}`} />
        <div className="min-w-0">
          <p className="text-ui text-ink-900">{descripcion[estado]}</p>
          {servidor && servidor.dispositivos > 0 && (
            <p className="mt-0.5 text-meta text-ink-500">
              Su cuenta tiene avisos activos en {servidor.dispositivos} dispositivo
              {servidor.dispositivos === 1 ? '' : 's'}.
            </p>
          )}
        </div>
      </div>

      {estado === 'ios-sin-instalar' && <InstalarApp />}

      <div className="flex flex-wrap items-center gap-2">
        {estado === 'desactivados' && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => void correr(activarAvisos)}
            className="btn-primary btn-sm"
          >
            Activar avisos en este dispositivo
          </button>
        )}
        {estado === 'activados' && (
          <>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => void probar()}
              className="btn-secondary btn-sm inline-flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              Enviar una prueba
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => void correr(desactivarAvisos)}
              className="btn-neutral btn-sm"
            >
              Desactivar
            </button>
          </>
        )}
      </div>

      {mensaje && <p className="text-meta text-ink-700">{mensaje}</p>}

      <p className="text-meta text-ink-500 [text-wrap:pretty]">
        Hoy se avisa de tres cosas: una respuesta de soporte, un borrador nuevo de otro abogado de su
        firma y un borrador editado por otro abogado (como mucho un aviso cada diez minutos por
        escrito). Lo que usted mismo hace no le llega a su propio dispositivo.
      </p>
    </div>
  );
};
