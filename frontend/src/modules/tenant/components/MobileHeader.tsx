import React from 'react';
import { Copy, FileDown, FileText, LogOut, ShieldCheck, X } from 'lucide-react';
import { IconoMenu, IconoPalomita } from '../../../design/ArtboardIcons';
import { navModule } from '../navigation';
import { IureonMark } from './IureonMark';
import type { MainView } from '../types';
import type { EstadoBorrador } from '../../documents/types';
import '../../../design/cara-nueva.css';

/**
 * La cabecera de móvil. Artboard 2 de `public/handoff/app-inicio.html` en su
 * aspecto; artboard 4d en lo que dice.
 *
 * ─── EL ASPECTO: LA BARRA DE 56 PX DEL ARTBOARD 2 ───────────────────────────
 *
 * 56 px de alto sobre el lienzo blanco, sin raya inferior; el isotipo a la
 * izquierda y botones de 44×44 sin contorno, radio 12, a la derecha. El botón
 * de menú perdió su borde gris: en el sistema nuevo los botones no llevan
 * contorno.
 *
 * El artboard dibuja además una lupa. NO SE PONE: la aplicación no tiene una
 * búsqueda global, y un botón que no busca nada en la barra más visible del
 * teléfono es una promesa rota. El día que exista, va a la izquierda del menú.
 *
 * ─── LO QUE DICE: 4d ────────────────────────────────────────────────────────
 *
 * La maqueta pone **el nombre del módulo** en negrita —«Redactar»— y debajo, en
 * gris, **de qué caso se trata**: «Mosquera vs. Colpensiones». El artboard 2
 * escribe «IUREON» junto al isotipo porque es Inicio; aquí se conserva el
 * nombre del módulo, porque **la cabecera es lo único que dice dónde está uno**:
 * en escritorio lo dice la barra lateral, que en el teléfono no existe. El
 * subtítulo deja el mono: es el caso o una cuenta de escritos, no un dato
 * citable (README-app §1).
 *
 * ─── EL MENÚ RECOGE LAS ACCIONES QUE ANTES ESTABAN SUELTAS ──────────────────
 *
 * Copiar, Word, PDF y «listo para firma» viven en una hoja que se abre al tocar
 * el menú. Esto además cierra una regresión declarada: al contener el desborde
 * de la cabecera con `overflow-x-auto`, el desplegable de exportación quedaba
 * recortado por su propio contenedor. En una hoja no hay nada que recortar.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · Las variantes de exportación (con membrete, con hoja de fuentes) que el
 *   escritorio ofrece en un desplegable. Aquí se exporta con los valores por
 *   defecto: dos casillas dentro de una hoja, sobre una acción que ya está a
 *   dos toques, son más decisiones que las que caben de pie. Quien necesita
 *   afinar el documento lo hace sentado.
 */

interface MobileHeaderProps {
  mainView: MainView;
  /** El caso o el escrito abierto: lo que 4d pone bajo el nombre del módulo. */
  subtitulo?: string | null;
  enTaller: boolean;
  copied: boolean;
  onCopyText: () => void;
  onExportWord: (opciones: { conMembrete: boolean; conFuentes: boolean }) => void;
  onExportPdf: (opciones: { conMembrete: boolean; conFuentes: boolean }) => void;
  estadoDelBorrador?: EstadoBorrador | null;
  onMarcarListo?: () => void;
  onAbrirGestion?: () => void;
  onLogout: () => void;
  /** Home: Inicio with every remembered inner screen forgotten. */
  onInicio?: () => void;
}

const Accion: React.FC<{
  icono: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
  destacada?: boolean;
}> = ({ icono, onClick, children, destacada }) => (
  <button
    type="button"
    onClick={onClick}
    className={`cn-hoja-accion ${destacada ? 'cn-hoja-accion--destacada' : ''}`}
  >
    <span className="cn-hoja-accion-icono">{icono}</span>
    {children}
  </button>
);

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  mainView,
  subtitulo,
  enTaller,
  copied,
  onCopyText,
  onExportWord,
  onExportPdf,
  estadoDelBorrador,
  onMarcarListo,
  onAbrirGestion,
  onLogout,
  onInicio
}) => {
  const [menu, setMenu] = React.useState(false);
  const modulo = navModule(mainView);
  const sinOpciones = { conMembrete: true, conFuentes: false };

  const cerrarY = (accion: () => void) => () => {
    accion();
    setMenu(false);
  };

  return (
    <>
      {/* `flex` y `lg:hidden` quedan en Tailwind: la hoja nueva no declara `display` para no ganarle al corte de escritorio. */}
      <header className="cara-nueva cn-mcab flex lg:hidden">
        {/* La marca lleva al inicio, igual que en la barra lateral de escritorio. */}
        <button
          type="button"
          onClick={onInicio}
          data-visita="marca"
          title="Ir al inicio"
          aria-label="Ir al inicio"
          className="cn-mcab-boton"
        >
          <IureonMark size={22} />
        </button>
        <div className="cn-mcab-textos">
          <h1 className="cn-mcab-titulo">{modulo.label}</h1>
          {subtitulo && <p className="cn-mcab-sub">{subtitulo}</p>}
        </div>

        <button
          type="button"
          onClick={() => setMenu(true)}
          aria-label="Acciones"
          className="cn-mcab-boton"
        >
          <IconoMenu className="h-5 w-5" />
        </button>
      </header>

      {menu && (
        <div className="cara-nueva fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setMenu(false)}
            className="cn-hoja-velo"
          />

          <div className="cn-hoja">
            <header className="cn-hoja-cabeza">
              <h2 className="cn-hoja-titulo">Acciones</h2>
              <button
                type="button"
                onClick={() => setMenu(false)}
                aria-label="Cerrar"
                className="cn-hoja-cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="cn-hoja-lista">
              {enTaller && (
                <>
                  {/*
                    «Listo para firma» va PRIMERO y destacado cuando aplica: el
                    artboard es explicito en que el primario no es exportar sino
                    el estado del borrador — exportar es un medio, y el estado es
                    lo que la firma necesita registrar.
                  */}
                  {/*
                    Y SOLO MIENTRAS FALTA: se ofrecía también sobre un borrador
                    RADICADO, que es un estado posterior a «listo» — marcarlo
                    habría devuelto un escrito ya presentado a «listo para firma».
                  */}
                  {onMarcarListo &&
                    estadoDelBorrador &&
                    estadoDelBorrador !== 'LISTO' &&
                    estadoDelBorrador !== 'RADICADO' && (
                      <Accion
                        icono={<IconoPalomita className="h-5 w-5" />}
                        onClick={cerrarY(onMarcarListo)}
                        destacada
                      >
                        Marcar como listo
                      </Accion>
                    )}

                  <Accion icono={<Copy className="h-5 w-5" />} onClick={cerrarY(onCopyText)}>
                    {copied ? 'Copiado' : 'Copiar el texto'}
                  </Accion>
                  <Accion
                    icono={<FileText className="h-5 w-5" />}
                    onClick={cerrarY(() => onExportWord(sinOpciones))}
                  >
                    Exportar a Word
                  </Accion>
                  <Accion
                    icono={<FileDown className="h-5 w-5" />}
                    onClick={cerrarY(() => onExportPdf(sinOpciones))}
                  >
                    Exportar a PDF
                  </Accion>
                </>
              )}

              {onAbrirGestion && (
                <Accion
                  icono={<ShieldCheck className="h-5 w-5" />}
                  onClick={cerrarY(onAbrirGestion)}
                >
                  Firmas y usuarios
                </Accion>
              )}

              <Accion icono={<LogOut className="h-5 w-5" />} onClick={cerrarY(onLogout)}>
                Cerrar sesión
              </Accion>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
