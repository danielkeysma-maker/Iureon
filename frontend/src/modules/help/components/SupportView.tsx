import React from 'react';
import { BookOpen } from 'lucide-react';
import { ANTES_DE_ESCRIBIR, WHATSAPP_CONFIGURADO, enlaceWhatsapp, whatsappLegible } from '../content/support';
import { entradaPorId } from '../content/manual';
import { useEsEscritorio } from '../useEsEscritorio';
import { ChatDeSoporte } from './ChatDeSoporte';

/**
 * Soporte con la cara nueva: sus conversaciones arriba, y lo demás debajo.
 *
 * ─── DE DÓNDE SALE LA FORMA ─────────────────────────────────────────────────
 *
 * `public/handoff/app-manual-y-soporte.html`: la lista (:530) —«Soporte» de 30,
 * «Sus conversaciones y las de su firma», el primario arriba a la derecha, una
 * tarjeta por conversación con su estado y la última respuesta citada, y la
 * nota de WhatsApp al pie— y «Escribir a soporte» (:491) como diálogo. El hilo
 * abierto y la pantalla del teléfono no tienen artboard: se derivan de la
 * lista y del artículo del manual (:451), con el mismo «‹ Soporte» para volver.
 *
 * ─── LAS DOS TARJETAS DE CANAL SE FUERON, Y NO SE PERDIÓ NADA ───────────────
 *
 * La pantalla vieja abría con dos tarjetas —WhatsApp y el chat— que explicaban
 * los canales antes de dejar escribir. La maqueta pone primero lo que el lector
 * vino a hacer: ver si le respondieron y escribir. Lo que esas tarjetas decían
 * y es verdad sigue aquí: quién atiende y que no hay tiempo garantizado va
 * arriba de la lista y dentro del diálogo; lo de WhatsApp, en la nota del pie,
 * con su advertencia al lado del enlace y no en letra menuda.
 *
 * ─── UNA PÁGINA, DOS ANCHOS, UN SOLO SONDEO ─────────────────────────────────
 *
 * El teléfono monta ESTA página con `movil`. Cada envoltorio la pinta solo en
 * su ancho: con las dos montadas, el chat sondearía dos veces cada 30 s.
 *
 * ─── LO QUE LA MAQUETA PIDE Y AQUÍ NO ESTÁ, con la razón ─────────────────────
 *
 * · «Le responden al correo»: la respuesta del operador no sale por correo.
 *   Queda en la conversación y, si el aparato tiene avisos activos, llega como
 *   notificación.
 * · «Adjuntar lo que estaba haciendo» y «Captura de pantalla»: el chat no
 *   recibe adjuntos ni registra la pantalla de origen. Además, una caja de
 *   subida invita justo a lo que no debe viajar por aquí: material del caso.
 * · «Responden en horario de oficina» como compromiso: se dice quién atiende y
 *   que no hay tiempo de respuesta garantizado.
 * · «Qué incluir en su mensaje», la lista de la pantalla vieja: su consejo más
 *   útil —el término que vence, en la primera línea— va en el propio campo; su
 *   último punto recomendaba enviar una captura que el chat no puede recibir.
 */

interface PaginaDeSoporteProps {
  movil: boolean;
  /** Firm name and account e-mail, to pre-fill the WhatsApp greeting. */
  firma: string;
  correo: string;
  onManual: (articuloId?: string) => void;
}

export const PaginaDeSoporte: React.FC<PaginaDeSoporteProps> = ({ movil, firma, correo, onManual }) => (
  <div data-visita="vista-soporte" className={`cara-nueva cn-sop${movil ? ' cn-sop--movil' : ''}`}>
    <div className="cn-sop-pagina">
      <ChatDeSoporte
        firma={firma}
        correo={correo}
        pie={
          <div className="cn-sop-pie">
            <section className="cn-sop-antes" aria-labelledby="soporte-antes-de-escribir">
              <h2 id="soporte-antes-de-escribir" className="cn-sop-h3">
                Antes de escribir
              </h2>
              {/* Se ofrece, no se impone: obligar a leer antes de preguntar es la forma más rápida de que nadie use el manual. */}
              <ul className="cn-sop-antes-lista">
                {ANTES_DE_ESCRIBIR.filter((a) => entradaPorId(a.id)).map((atajo) => (
                  <li key={atajo.id}>
                    <button type="button" className="cn-sop-enlace" onClick={() => onManual(atajo.id)}>
                      <BookOpen className="cn-sop-icono-linea" aria-hidden="true" />
                      {atajo.pregunta}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {/*
              WHATSAPP, COMO NOTA Y NO COMO CANAL PRINCIPAL. Lo que se escriba por
              allá no queda en Iureon, y decirlo evita que alguien busque aquí una
              conversación que tuvo por teléfono. Sin número configurado, se dice
              en vez de pintar un botón que no abre nada.
            */}
            <div className="cn-sop-nota">
              {WHATSAPP_CONFIGURADO ? (
                <>
                  <p>
                    También puede escribir por WhatsApp. No envíe por allá datos de sus clientes ni
                    documentos del caso: queda fuera del acuerdo de tratamiento de datos. Lo que se
                    responda por WhatsApp no queda aquí; si necesita el registro, escriba desde la
                    aplicación.
                  </p>
                  <a
                    className="cn-sop-boton cn-sop-boton--suave"
                    href={enlaceWhatsapp(firma, correo)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir WhatsApp · <span className="cn-sop-mono">{whatsappLegible()}</span>
                  </a>
                </>
              ) : (
                <p>
                  El número de WhatsApp de soporte no está configurado en esta instalación. Por ahora
                  se escribe desde esta pantalla, y la conversación queda guardada en su cuenta.
                </p>
              )}
            </div>
          </div>
        }
      />
    </div>
  </div>
);

interface SupportViewProps {
  firma: string;
  correo: string;
  onManual: (articuloId: string) => void;
}

export const SupportView: React.FC<SupportViewProps> = ({ firma, correo, onManual }) => {
  const escritorio = useEsEscritorio();
  if (!escritorio) return null;
  return (
    <PaginaDeSoporte
      movil={false}
      firma={firma}
      correo={correo}
      onManual={(id) => {
        if (id) onManual(id);
      }}
    />
  );
};
