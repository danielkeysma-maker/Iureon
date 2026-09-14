import React, { useEffect, useRef } from 'react';
import { Terminal, Cpu } from 'lucide-react';

export type { AgentLog } from '../types';
import type { AgentLog } from '../types';


interface AgentConsoleStreamProps {
  logs: AgentLog[];
  isProcessing: boolean;
}

/*
 * LOS MOTORES VAN EN GRIS, NO CON UN COLOR CADA UNO.
 *
 * Tenían azul, morado, ámbar y verde de la paleta de fábrica de Tailwind. En la
 * cara nueva el color significa algo —verde comprobado, ámbar sin verificar, oro
 * módulo activo—, y un «Claude» en ámbar se leía como una advertencia sobre el
 * paso. El nombre basta para distinguirlos.
 */
const engineLabels: Record<AgentLog['engine'], string> = {
  GEMINI: 'Gemini',
  GPT: 'GPT',
  CLAUDE: 'Claude',
  SUPABASE: 'Vector',
  B2: 'Vault'
};

export const AgentConsoleStream: React.FC<AgentConsoleStreamProps> = ({ logs, isProcessing }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    /*
      ALTURA ACOTADA, NO `flex-1`.

      Tenía `flex-1` igual que el formulario de arriba, así que los dos crecían
      a la vez y la consola terminaba pintándose ENCIMA del aviso de adjuntos —
      dos textos superpuestos y ninguno legible. Ahora la consola ocupa lo suyo
      y el formulario se queda con el resto.
    */
    <div className="cn-red-consola">
      <div className="cn-red-consola-cabeza">
        <span className="cn-red-consola-titulo">
          <Terminal className="cn-red-consola-icono" strokeWidth={1.8} aria-hidden />
          Ejecución
        </span>
        {isProcessing && (
          <span className="cn-red-consola-procesando">
            <Cpu className="cn-red-consola-icono animate-spin" strokeWidth={1.8} aria-hidden />
            Procesando...
          </span>
        )}
      </div>

      <div ref={logContainerRef} className="cn-red-consola-filas">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`cn-red-log ${
              log.type === 'success' ? 'cn-red-log--exito' : log.type === 'error' ? 'cn-red-log--error' : ''
            }`}
          >
            {/* La hora en mono: es el dato citable de la fila. */}
            <span className="cn-red-log-hora">{log.timestamp}</span>
            <span className="cn-red-log-motor">{engineLabels[log.engine]}</span>
            <span className="cn-red-log-texto">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
