import React from 'react';
import { IconoConversacion, IconoSinVerificar } from '../../../design/ArtboardIcons';
import {
  ANTES_DE_ESCRIBIR,
  CANALES,
  QUE_INCLUIR,
  WHATSAPP_CONFIGURADO,
  enlaceWhatsapp,
  whatsappLegible
} from '../content/support';
import type { SupportChannel } from '../types';

/**
 * Soporte en móvil. Artboard 9d, medidas copiadas de su HTML.
 *
 * ─── LO QUE DICE LA MAQUETA, CITADO ─────────────────────────────────────────
 *
 *     cuerpo:    padding:14px 16px; gap:11px
 *     tarjeta:   radius 10; padding 14px 15px; border-left 3px
 *                chat  → borde #CBD9E4 con filete #17456B
 *                whats → borde #E3E7EC con filete #1F7A4D
 *     título:    600 15px · «Respuesta ≈ 4 min» 400 11.5px #667487
 *     prosa:     400 12.5px/1.55 #2B3542
 *     nota:      «Sale de Iureon» 400 11px MONO centrado
 *
 * ─── LA DIFERENCIA QUE 9d QUIERE MARCAR, Y QUE AQUÍ SE RESPETA ──────────────
 *
 * El artboard llama a esto «dos vías con expectativas distintas, no dos botones
 * iguales», y por eso cada tarjeta lleva su tiempo de respuesta y su filete de
 * color propio. Pero hay una diferencia MÁS grande que la maqueta no podía
 * saber: **el chat en la app no existe**. No hay servidor de conversación, ni
 * cola, ni nadie al otro lado.
 *
 * Así que su tarjeta se pinta como DECLARACIÓN y no como botón. Es la regla que
 * el módulo ya tenía escrita —«un canal que no se puede usar se renderiza como
 * declaración, nunca como un botón que no hace nada»— y en el teléfono importa
 * más: un botón grande y cómodo que no responde nada se pulsa dos veces antes
 * de que alguien sospeche que no existe.
 *
 * Lo mismo con WhatsApp: solo es enlace cuando hay número configurado.
 *
 * ─── LA ADVERTENCIA VIAJA CON EL CANAL, NO AL PIE ───────────────────────────
 *
 * «No envíe datos de sus clientes ni documentos del caso» va DENTRO de la
 * tarjeta de WhatsApp, no en una nota general. Es una advertencia sobre ESE
 * canal —está fuera del encargo de tratamiento— y al pie se leería como
 * legalese que no aplica a nadie en particular.
 */

interface SupportMobileViewProps {
  firma: string;
  correo: string;
  onManual: () => void;
}

const FILETE: Record<SupportChannel['id'], string> = {
  chat: 'rgb(var(--brand-700))',
  /* El verde de WhatsApp de la maqueta, #1F7A4D, es el `verified` del sistema. */
  whatsapp: 'rgb(var(--verified))'
};

export const SupportMobileView: React.FC<SupportMobileViewProps> = ({
  firma,
  correo,
  onManual
}) => (
  <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-canvas">
    <div className="flex flex-col gap-[11px] px-4 py-3.5">
      {CANALES.map((canal) => {
        const usable = canal.id === 'whatsapp' ? WHATSAPP_CONFIGURADO : canal.disponible;

        return (
          <section
            key={canal.id}
            className="rounded-[10px] border border-line-200 bg-surface px-[15px] py-3.5"
            style={{ borderLeft: `3px solid ${FILETE[canal.id]}` }}
          >
            <div className="flex items-center gap-2.5">
              <IconoConversacion
                className="h-4 w-4 shrink-0"
                strokeWidth={2}
              />
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold leading-tight text-ink-900">
                  {canal.nombre}
                </h2>
                <p className="mt-px text-[11.5px] leading-tight text-ink-500">{canal.paraQue}</p>
              </div>
              {/*
                EL PUNTO VERDE SOLO CUANDO SE PUEDE USAR. En la maqueta indica
                «hay alguien»; pintarlo siempre lo convertiria en adorno, y en
                el canal que no existe seria mentira.
              */}
              <span
                className={`ml-auto h-2 w-2 shrink-0 rounded-full ${
                  usable ? 'bg-verified' : 'bg-ink-400'
                }`}
                aria-hidden="true"
              />
            </div>

            <ul className="mt-2.5 space-y-1.5">
              {canal.puntos.map((p) => (
                <li
                  key={p.texto}
                  className={`flex gap-2 text-justify text-[12.5px] leading-[1.55] [text-wrap:pretty] ${
                    p.tono === 'advertencia' ? 'text-unverified' : 'text-ink-700'
                  }`}
                >
                  {p.tono === 'advertencia' && (
                    <IconoSinVerificar className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  )}
                  <span>{p.texto}</span>
                </li>
              ))}
            </ul>

            {canal.id === 'whatsapp' && usable ? (
              <>
                <a
                  href={enlaceWhatsapp(firma, correo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary mt-3 flex h-11 w-full items-center justify-center"
                >
                  Abrir WhatsApp
                </a>
                <p className="mt-[7px] text-center font-mono text-[11px] text-ink-400">
                  Sale de Iureon · {whatsappLegible()}
                </p>
              </>
            ) : (
              /*
               * NI BOTON NI ENLACE. El canal no se puede usar, y el artboard no
               * previo ese caso porque dibujaba el producto terminado. Se dice
               * la razon con las palabras del modulo, que ya la tiene escrita.
               */
              <p className="mt-3 rounded-[6px] bg-canvas px-3 py-2.5 text-justify text-[12px] leading-snug text-ink-500 [text-wrap:pretty]">
                {canal.razon || 'Este canal todavía no está disponible.'}
              </p>
            )}
          </section>
        );
      })}

      <section className="rounded-[10px] border border-line-200 bg-surface px-[15px] py-3.5">
        <h2 className="text-[13px] font-semibold text-ink-900">Antes de escribir</h2>
        <ul className="mt-2 space-y-1.5">
          {ANTES_DE_ESCRIBIR.map((p) => (
            <li
              key={p.id}
              className="text-justify text-[12.5px] leading-[1.55] text-ink-700 [text-wrap:pretty]"
            >
              {p.pregunta}
            </li>
          ))}
        </ul>
        <button type="button" onClick={onManual} className="btn-secondary mt-3 h-11 w-full">
          Buscar en el manual
        </button>
      </section>

      <section className="rounded-[10px] border border-line-200 bg-surface px-[15px] py-3.5">
        <h2 className="text-[13px] font-semibold text-ink-900">Qué incluir en el mensaje</h2>
        <ul className="mt-2 space-y-1.5">
          {QUE_INCLUIR.map((q) => (
            <li
              key={q}
              className="flex gap-2 text-justify text-[12.5px] leading-[1.55] text-ink-700 [text-wrap:pretty]"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  </div>
);
