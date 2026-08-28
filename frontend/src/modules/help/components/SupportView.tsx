import React from 'react';
import { AlertTriangle, BookOpen, Check, ChevronRight, MessageSquare, Minus } from 'lucide-react';
import {
  ANTES_DE_ESCRIBIR,
  CANALES,
  QUE_INCLUIR,
  WHATSAPP_CONFIGURADO,
  enlaceWhatsapp,
  whatsappLegible
} from '../content/support';
import { entradaPorId } from '../content/manual';
import type { SupportChannel } from '../types';

/**
 * Support: the two routes out of a stuck screen, told apart honestly.
 *
 * ─── THE TWO CARDS ARE NOT TWINS, AND NOT FOR THE ARTBOARD'S REASON ─────────
 *
 * The 9b artboard separates them by first-response time — four minutes against
 * twelve. Nobody measures either number, and this is the one screen a reader
 * reaches after something already went wrong, so a reassuring invention here is
 * worse than silence. What actually separates them today is simpler and true:
 * WhatsApp is a link and works the moment a number is configured; the in-app
 * chat does not exist. Each card says which it is.
 *
 * ─── THE WARNING IS THE POINT OF THE WHATSAPP CARD ──────────────────────────
 *
 * Client data must not travel through WhatsApp: it sits outside the processing
 * agreement the firm signed. That goes in the card, at reading size, above the
 * button — never in fine print underneath it.
 */

interface SupportViewProps {
  /** Firm name and account e-mail, to pre-fill the WhatsApp greeting. */
  firma: string;
  correo: string;
  onManual: (articuloId: string) => void;
}

const Punto: React.FC<{ tono: 'hecho' | 'advertencia'; children: React.ReactNode }> = ({
  tono,
  children
}) => (
  <li className="flex gap-2.5">
    {tono === 'advertencia' ? (
      <AlertTriangle size={14} strokeWidth={2.3} className="mt-[3px] shrink-0 text-unverified" />
    ) : (
      <Check size={14} strokeWidth={2.6} className="mt-[3px] shrink-0 text-verified" />
    )}
    <span className="text-ui leading-[1.6] text-ink-700 [text-wrap:pretty]">{children}</span>
  </li>
);

const TarjetaCanal: React.FC<{ canal: SupportChannel; accion: React.ReactNode }> = ({
  canal,
  accion
}) => (
  <section className="flex flex-1 flex-col rounded-card border border-line-200 bg-surface px-5 py-4">
    <header className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line-200 bg-canvas">
        {canal.id === 'whatsapp' ? (
          <MessageSquare size={16} strokeWidth={2.1} className="text-ink-700" />
        ) : (
          <MessageSquare size={16} strokeWidth={2.1} className="text-ink-400" />
        )}
      </div>
      <div className="min-w-0">
        <h2 className="text-subtitle text-ink-900">{canal.nombre}</h2>
        <p className="mt-0.5 text-meta text-ink-500 [text-wrap:pretty]">{canal.paraQue}</p>
      </div>
      <span
        className={`ml-auto shrink-0 ${canal.disponible ? 'chip-curated' : 'chip-auto'}`}
      >
        {canal.disponible ? 'Disponible' : 'Todavía no'}
      </span>
    </header>

    {!canal.disponible && (
      <p className="mt-3.5 rounded-control border border-line-200 bg-canvas px-3 py-2.5 text-ui leading-[1.6] text-ink-700 text-justify [text-wrap:pretty]">
        {canal.razon}
      </p>
    )}

    <ul className="mt-3.5 flex flex-col gap-2">
      {canal.puntos.map((p) => (
        <Punto key={p.texto} tono={p.tono}>
          {p.texto}
        </Punto>
      ))}
    </ul>

    <div className="mt-auto pt-4">{accion}</div>
  </section>
);

export const SupportView: React.FC<SupportViewProps> = ({ firma, correo, onManual }) => {
  const whatsapp = CANALES.find((c) => c.id === 'whatsapp');
  const chat = CANALES.find((c) => c.id === 'chat');

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto bg-canvas font-sans">
      <div className="mx-auto w-full max-w-5xl px-6 py-6">
        <header>
          <h1 className="text-title text-ink-900">Soporte</h1>
          <p className="mt-1 max-w-3xl text-ui leading-[1.6] text-ink-700 [text-wrap:pretty]">
            Dos vías para pedir ayuda, con lo que cada una puede y no puede hacer dicho antes de
            que usted escriba.
          </p>
        </header>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row">
          {whatsapp && (
            <TarjetaCanal
              canal={whatsapp}
              accion={
                WHATSAPP_CONFIGURADO ? (
                  <>
                    <a
                      className="btn-primary w-full"
                      href={enlaceWhatsapp(firma, correo)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir WhatsApp · {whatsappLegible()}
                    </a>
                    <p className="mt-2 text-center font-mono text-[11px] text-ink-400">
                      Sale de Iureon · se abre en WhatsApp Web o en su teléfono
                    </p>
                  </>
                ) : (
                  <p className="font-mono text-[11px] leading-[1.5] text-ink-400">
                    Sin número configurado, no hay enlace que abrir.
                  </p>
                )
              }
            />
          )}

          {chat && (
            <TarjetaCanal
              canal={chat}
              accion={
                <div className="flex items-start gap-2 rounded-control border border-line-200 bg-canvas px-3 py-2.5">
                  <Minus size={14} strokeWidth={2.4} className="mt-0.5 shrink-0 text-ink-400" />
                  <p className="font-mono text-[11px] leading-[1.5] text-ink-400 [text-wrap:pretty]">
                    No hay botón aquí a propósito: no existe conversación que abrir.
                  </p>
                </div>
              }
            />
          )}
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row">
          <section className="flex-1 rounded-card border border-line-200 bg-surface px-5 py-4">
            <h2 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              Qué incluir en su mensaje
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {QUE_INCLUIR.map((texto) => (
                <li key={texto} className="flex gap-2.5">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-400" />
                  <span className="text-ui leading-[1.6] text-ink-700 [text-wrap:pretty]">
                    {texto}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="w-full shrink-0 rounded-card border border-line-200 bg-surface px-5 py-4 lg:w-[352px]">
            <h2 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              Antes de escribir
            </h2>
            {/*
              Se ofrece, no se impone: obligar a leer antes de preguntar es la
              forma más rápida de que nadie use el manual.
            */}
            <div className="mt-3 flex flex-col gap-2">
              {ANTES_DE_ESCRIBIR.filter((a) => entradaPorId(a.id)).map((atajo) => (
                <button
                  key={atajo.id}
                  type="button"
                  onClick={() => onManual(atajo.id)}
                  className="flex items-center gap-2.5 rounded-control border border-line-200 bg-surface px-3 py-2.5 text-left hover:bg-canvas"
                >
                  <BookOpen size={14} strokeWidth={2} className="shrink-0 text-ink-400" />
                  <span className="min-w-0 flex-1 text-meta text-ink-900">{atajo.pregunta}</span>
                  <ChevronRight size={13} strokeWidth={2.2} className="shrink-0 text-ink-400" />
                </button>
              ))}
            </div>
          </section>
        </div>

        {/*
          EL HISTORIAL DE CONVERSACIONES del artboard. Vive en el mismo backend
          de mensajería que el chat, así que se declara aquí en una línea en vez
          de dibujar dos tiquetes de ejemplo que nadie podría abrir.
        */}
        <p className="mt-4 rounded-card border border-line-200 bg-surface px-5 py-3.5 text-meta leading-[1.6] text-ink-500 [text-wrap:pretty]">
          El historial de sus conversaciones con soporte —abiertas y resueltas— se agregará junto
          con el chat. Hoy no queda registro dentro de la aplicación de lo que escriba por
          WhatsApp.
        </p>
      </div>
    </div>
  );
};
