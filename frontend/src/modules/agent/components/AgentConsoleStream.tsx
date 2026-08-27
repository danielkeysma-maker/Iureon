import React, { useEffect, useRef } from 'react';
import { Terminal, Cpu } from 'lucide-react';

export type { AgentLog } from '../types';
import type { AgentLog } from '../types';


interface AgentConsoleStreamProps {
  logs: AgentLog[];
  isProcessing: boolean;
}

const engineLabels: Record<AgentLog['engine'], { label: string; className: string }> = {
  GEMINI: { label: 'Gemini', className: 'text-blue-700 bg-blue-50' },
  GPT: { label: 'GPT', className: 'text-purple-700 bg-purple-50' },
  CLAUDE: { label: 'Claude', className: 'text-amber-700 bg-amber-50' },
  SUPABASE: { label: 'Vector', className: 'text-emerald-700 bg-emerald-50' },
  B2: { label: 'Vault', className: 'text-slate-600 bg-slate-100' }
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
    <div className="flex max-h-[180px] shrink-0 flex-col border-t border-line-200 bg-canvas font-mono text-[11px]">
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-slate-400" />
          <span className="font-medium text-slate-500 font-sans text-[11px]">Ejecución</span>
        </div>
        {isProcessing && (
          <div className="flex items-center gap-1 text-blue-700 text-[10px] font-medium animate-pulse">
            <Cpu className="w-3 h-3 animate-spin" />
            <span>Procesando...</span>
          </div>
        )}
      </div>

      <div ref={logContainerRef} className="flex-1 px-4 pb-3 overflow-y-auto space-y-1">
        {logs.map((log) => {
          const engine = engineLabels[log.engine];
          return (
            <div key={log.id} className="flex items-start gap-2 py-1">
              <span className="text-slate-400 text-[10px] shrink-0 tabular-nums">{log.timestamp}</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${engine.className}`}>
                {engine.label}
              </span>
              <span className={`flex-1 break-words font-normal ${
                log.type === 'success' ? 'text-emerald-700' :
                log.type === 'error' ? 'text-rose-600' :
                'text-slate-600'
              }`}>
                {log.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
