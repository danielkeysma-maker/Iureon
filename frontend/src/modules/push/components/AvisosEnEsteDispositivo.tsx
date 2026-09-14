import React, { useCallback, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import '../../../design/cara-nueva.css';
import { pushApi } from '../push.api';
import { activarAvisos, desactivarAvisos, leerEstado, type EstadoDeAvisos } from '../pushCliente';
import {
  caraDeLosAvisos,
  dispositivosEnPalabras,
  resultadoDeLaPrueba,
  tiposQueLeLlegan,
  type EnCurso,
  type Permiso,
  type ServidorLeido
} from '../avisosEnPantalla';

/**
 * Los avisos en ESTE dispositivo: estado, interruptor, prueba y qué se avisa.
 *
 * Se llama «en este dispositivo» y no «notificaciones» porque eso es lo que
 * de verdad se decide aquí: el teléfono sí, el portátil no. Qué se dice en
 * cada estado lo decide `caraDeLosAvisos`, que es pura y la recorre el check
 * `avisosCara`; este componente solo lee el navegador y el servidor.
 *
 * La lista de lo que se avisa sale de `tiposQueLeLlegan`, no de un párrafo:
 * el párrafo anterior hablaba de «tres cosas» cuando el servidor ya avisaba
 * también de los términos de la agenda.
 *
 * YA NO MONTA `InstalarApp` DENTRO. Los tres sitios que usan este componente
 * (el diálogo de Avisos, la hoja «Más» del teléfono y Ajustes) ya pintan
 * `InstalarApp` al lado, así que en iPhone las instrucciones salían dos veces.
 *
 * La raíz abre su propio alcance (`cara-nueva cn-avi`) porque se monta en
 * sitios que todavía no llevan la cara nueva.
 */
export const AvisosEnEsteDispositivo: React.FC<{ esOperador?: boolean }> = ({ esOperador = false }) => {
  const [local, setLocal] = useState<EstadoDeAvisos>('cargando');
  const [permiso, setPermiso] = useState<Permiso>('sin-api');
  const [servidor, setServidor] = useState<ServidorLeido>(null);
  const [enCurso, setEnCurso] = useState<EnCurso>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const leerPermiso = (): Permiso => (typeof Notification === 'undefined' ? 'sin-api' : Notification.permission);

  const refrescar = useCallback(async () => {
    const estadoLocal = await leerEstado();
    let remoto: ServidorLeido = 'sin-respuesta';
    try {
      const r = await pushApi.estado();
      remoto = { enabled: r.enabled, dispositivos: r.suscripcionesDelUsuario };
    } catch {
      /* Sin respuesta del servidor se muestra lo local, y la pantalla lo dice. */
    }
    setServidor(remoto);
    setPermiso(leerPermiso());
    setLocal(estadoLocal);
  }, []);

  useEffect(() => {
    void refrescar();
  }, [refrescar]);

  const correr = async (cual: 'activando' | 'desactivando', accion: () => Promise<EstadoDeAvisos>) => {
    setEnCurso(cual);
    setMensaje(null);
    setError(null);
    try {
      setLocal(await accion());
      await refrescar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la acción.');
      await refrescar();
    } finally {
      setEnCurso(null);
    }
  };

  const probar = async () => {
    setEnCurso('probando');
    setMensaje(null);
    setError(null);
    try {
      const r = await pushApi.prueba();
      setMensaje(resultadoDeLaPrueba(r.enviados));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la prueba.');
    } finally {
      setEnCurso(null);
    }
  };

  const cara = caraDeLosAvisos({ local, permiso, servidor, enCurso });
  const dispositivos = servidor && servidor !== 'sin-respuesta' ? dispositivosEnPalabras(servidor.dispositivos) : null;
  const tipos = tiposQueLeLlegan(esOperador);

  const alternar = () => {
    if (cara.interruptor.deshabilitado) return;
    void (cara.interruptor.encendido ? correr('desactivando', desactivarAvisos) : correr('activando', activarAvisos));
  };

  return (
    <div className="cara-nueva cn-avi" data-situacion={cara.situacion}>
      <div className={`cn-avi-fila cn-avi-fila--${cara.tono}`}>
        <div className="cn-avi-fila-textos">
          <p className="cn-avi-fila-titulo">
            Avisos en este dispositivo
          </p>
          <p className="cn-avi-estado" aria-live="polite">
            {cara.estado}
          </p>
        </div>
        {cara.interruptor.visible && (
          <button
            type="button"
            role="switch"
            aria-checked={cara.interruptor.encendido}
            aria-label="Avisos en este dispositivo"
            aria-busy={enCurso === 'activando' || enCurso === 'desactivando'}
            disabled={cara.interruptor.deshabilitado}
            onClick={alternar}
            className="cn-avi-interruptor"
          >
            <span className="cn-avi-riel" aria-hidden="true">
              <span className="cn-avi-perilla" />
            </span>
          </button>
        )}
      </div>

      {cara.detalle && <p className="cn-avi-detalle">{cara.detalle}</p>}
      {cara.servidorSinRespuesta && (
        <p className="cn-avi-detalle">No se pudo consultar el servidor. Lo de arriba es solo lo que sabe este navegador.</p>
      )}
      {dispositivos && <p className="cn-avi-detalle">{dispositivos}</p>}

      {error && (
        <p className="cn-avi-error" role="alert">
          {error}
        </p>
      )}

      {cara.puedeProbar || enCurso === 'probando' ? (
        <div className="cn-avi-acciones">
          <button type="button" disabled={!cara.puedeProbar} onClick={() => void probar()} className="cn-avi-boton">
            <Send className="h-4 w-4" aria-hidden="true" />
            {enCurso === 'probando' ? 'Enviando la prueba…' : 'Enviar una prueba'}
          </button>
        </div>
      ) : null}
      {mensaje && (
        <p className="cn-avi-detalle" role="status">
          {mensaje}
        </p>
      )}

      <div className="cn-avi-tipos">
        <p className="cn-avi-tipos-titulo">Qué le avisa Iureon</p>
        <ul className="cn-avi-lista">
          {tipos.map((t) => (
            <li key={t.id} className="cn-avi-tipo">
              <span className="cn-avi-tipo-titulo">{t.titulo}</span>
              <span className="cn-avi-tipo-detalle">{t.detalle}</span>
            </li>
          ))}
        </ul>
        <p className="cn-avi-nota">Lo que usted mismo hace no le llega a su propio dispositivo.</p>
      </div>
    </div>
  );
};
