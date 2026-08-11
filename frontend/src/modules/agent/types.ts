/** Which pipeline engine or backing service emitted a log line. */
export type AgentEngine = 'GEMINI' | 'GPT' | 'CLAUDE' | 'SUPABASE' | 'B2';

/** One streamed progress entry from the drafting pipeline. */
export interface AgentLog {
  id: string;
  timestamp: string;
  engine: AgentEngine;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
