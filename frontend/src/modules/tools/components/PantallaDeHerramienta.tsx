import React from 'react';
import { AlertCircle, ChevronLeft, FileSpreadsheet, FileText } from 'lucide-react';

/**
 * LA PANTALLA DE UNA HERRAMIENTA, UNA SOLA VEZ.
 *
 * Sale de `public/handoff/app-herramientas.html`: cada calculadora es una
 * página entera con los datos a la izquierda (380 px) y el resultado a la
 * derecha sobre gris lavado; la agenda, el glosario y el detalle de festivos son
 * una columna con cabecera y acciones a la derecha; en el teléfono, una barra de
 * 56 px con «volver» y el título, todo apilado, y el primario anclado abajo.
 *
 * ─── POR QUÉ DEJARON DE SER DIÁLOGOS ────────────────────────────────────────
 *
 * Un diálogo de 640 px apilaba el formulario y, debajo, el resultado: al
 * calcular, la cifra quedaba bajo el pliegue y había que desplazarse para ver lo
 * que se acababa de pedir. La maqueta pone las dos cosas lado a lado, que es
 * como se usa una calculadora: se cambia un dato y se mira la cifra sin perder
 * el campo. Un diálogo encima de otro, además, dejaba dos velos cuando la agenda
 * abría el detalle de festivos.
 *
 * ─── POR QUÉ EL PRIMARIO SE PINTA DOS VECES ─────────────────────────────────
 *
 * En el computador va al pie del formulario; en el teléfono, en el pie anclado,
 * donde llega el pulgar. Es el mismo elemento en dos sitios y el CSS enciende
 * uno solo según el ancho: moverlo con JavaScript al cambiar de tamaño haría
 * que el botón desapareciera un instante bajo el dedo.
 */

interface PantallaProps {
  titulo: string;
  bajada?: React.ReactNode;
  onVolver: () => void;
  /** A dónde lleva «volver». El detalle de festivos vuelve a la agenda, no a la portada. */
  volverA?: string;
  /** `calculo`: datos y resultado lado a lado. `lista`: una columna con cabecera. */
  forma?: 'calculo' | 'lista';
  /** Cabecera de la forma `lista`, a la derecha del título. */
  acciones?: React.ReactNode;
  formulario?: React.ReactNode;
  primario?: React.ReactNode;
  resultado?: React.ReactNode;
  children?: React.ReactNode;
}

export const PantallaDeHerramienta: React.FC<PantallaProps> = ({
  titulo,
  bajada,
  onVolver,
  volverA = 'Herramientas',
  forma = 'calculo',
  acciones,
  formulario,
  primario,
  resultado,
  children
}) => {
  const volver = (
    <button type="button" className="cn-her-volver" onClick={onVolver}>
      <ChevronLeft aria-hidden="true" size={16} strokeWidth={1.6} />
      {volverA}
    </button>
  );

  return (
    <section className={`cn-her-pantalla cn-her-pantalla--${forma}`} aria-label={titulo}>
      <div className="cn-her-barra-movil">
        <button type="button" className="cn-her-icono" onClick={onVolver} aria-label={`Volver a ${volverA}`}>
          <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.5} />
        </button>
        <span className="cn-her-barra-titulo">{titulo}</span>
      </div>

      <div className="cn-her-desplazable">
        {forma === 'calculo' ? (
          <div className="cn-her-columnas">
            <div className="cn-her-formulario">
              {volver}
              <h1 className="cn-her-h1 cn-her-h1--pantalla">{titulo}</h1>
              {bajada && <p className="cn-her-bajada-2">{bajada}</p>}
              <div className="cn-her-campos">{formulario}</div>
              {primario && <div className="cn-her-primario-escritorio">{primario}</div>}
            </div>
            {/* El resultado se anuncia al lector de pantalla cuando cambia: es la respuesta a lo que se pidió. */}
            <div className="cn-her-resultado" aria-live="polite">
              {resultado}
            </div>
          </div>
        ) : (
          <div className="cn-her-lista-marco">
            <div className="cn-her-cabeza">
              <div className="cn-her-cabeza-texto">
                {volver}
                <h1 className="cn-her-h1 cn-her-h1--pantalla">{titulo}</h1>
                {bajada && <p className="cn-her-bajada-2">{bajada}</p>}
              </div>
              {acciones && <div className="cn-her-acciones">{acciones}</div>}
            </div>
            {children}
          </div>
        )}
      </div>

      {primario && <div className="cn-her-pie-movil">{primario}</div>}
    </section>
  );
};

/* ─── Piezas que comparten las pantallas ─────────────────────────────────── */

export const Campo: React.FC<{
  etiqueta: React.ReactNode;
  htmlFor?: string;
  ayuda?: React.ReactNode;
  /** La ayuda en ámbar: lo que el abogado escribe y la aplicación no certifica. */
  ayudaEsAviso?: boolean;
  children: React.ReactNode;
}> = ({ etiqueta, htmlFor, ayuda, ayudaEsAviso = false, children }) => (
  <div className="cn-her-campo-bloque">
    <label className="cn-her-etiqueta" htmlFor={htmlFor}>
      {etiqueta}
    </label>
    {children}
    {ayuda && <p className={`cn-her-ayuda${ayudaEsAviso ? ' cn-her-ayuda--aviso' : ''}`}>{ayuda}</p>}
  </div>
);

/**
 * Una opción en tarjeta —radio o casilla—, como la maqueta dibuja la tasa, la
 * jurisdicción y la causal. El control es el nativo: conserva el teclado, el
 * foco y el anuncio al lector de pantalla sin reescribirlos.
 */
export const Opcion: React.FC<{
  tipo?: 'radio' | 'checkbox';
  nombre?: string;
  marcada: boolean;
  onCambio: () => void;
  titulo: React.ReactNode;
  detalle?: React.ReactNode;
}> = ({ tipo = 'radio', nombre, marcada, onCambio, titulo, detalle }) => (
  <label className="cn-her-opcion">
    <input type={tipo} name={nombre} checked={marcada} onChange={onCambio} className="cn-her-opcion-control" />
    <span className="cn-her-opcion-texto">
      <span className="cn-her-opcion-titulo">{titulo}</span>
      {detalle && <span className="cn-her-opcion-detalle">{detalle}</span>}
    </span>
  </label>
);

/** La cifra grande de un resultado, con sus datos debajo y sus salidas. */
export const TarjetaDeCifra: React.FC<{
  rotulo: string;
  cifra: React.ReactNode;
  detalle?: React.ReactNode;
  acciones?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ rotulo, cifra, detalle, acciones, children }) => (
  <div className="cn-her-caja cn-her-caja--cifra">
    <p className="cn-her-rotulo">{rotulo}</p>
    <p className="cn-her-cifra">{cifra}</p>
    {detalle && <p className="cn-her-cifra-detalle">{detalle}</p>}
    {children && <div className="cn-her-datos">{children}</div>}
    {acciones && <div className="cn-her-acciones-cifra">{acciones}</div>}
  </div>
);

export const Dato: React.FC<{ nombre: React.ReactNode; valor: React.ReactNode; fuerte?: boolean }> = ({
  nombre,
  valor,
  fuerte = false
}) => (
  <div className="cn-her-dato">
    <span className="cn-her-dato-nombre">{nombre}</span>
    <span className={`cn-her-dato-valor cn-her-mono${fuerte ? ' cn-her-fuerte' : ''}`}>{valor}</span>
  </div>
);

export const Caja: React.FC<{ titulo?: React.ReactNode; children: React.ReactNode }> = ({ titulo, children }) => (
  <div className="cn-her-caja">
    {titulo && <p className="cn-her-caja-titulo">{titulo}</p>}
    {children}
  </div>
);

/** Las dos salidas de toda calculadora. Salen del mismo libro: no pueden diferir. */
export const BotonesDeExportacion: React.FC<{ onExcel: () => void; onPdf: () => void; children?: React.ReactNode }> = ({
  onExcel,
  onPdf,
  children
}) => (
  <>
    <button type="button" onClick={onExcel} className="cn-her-boton cn-her-boton--suave">
      <FileSpreadsheet aria-hidden="true" size={16} />
      Exportar a Excel
    </button>
    <button type="button" onClick={onPdf} className="cn-her-boton cn-her-boton--texto">
      <FileText aria-hidden="true" size={16} />
      Exportar a PDF
    </button>
    {children}
  </>
);

export const ErrorDeHerramienta: React.FC<{ mensaje: string }> = ({ mensaje }) => (
  <div className="cn-her-error" role="alert">
    <AlertCircle aria-hidden="true" size={18} />
    <p>{mensaje}</p>
  </div>
);

export const Cargando: React.FC<{ texto: string }> = ({ texto }) => (
  <p className="cn-her-cargando">
    <span className="cn-her-giro" aria-hidden="true" />
    {texto}
  </p>
);

/**
 * EL RESULTADO ANTES DE CALCULAR. La columna derecha vacía se leía como una
 * pantalla rota; esta caja dice qué va a aparecer y qué traerá consigo, que es
 * la promesa de Herramientas: ninguna cifra sola. En el teléfono no se pinta
 * —ahí el resultado va debajo del formulario y una caja vacía solo empuja—.
 */
export const ResultadoVacio: React.FC<{ titulo: string; texto: string }> = ({ titulo, texto }) => (
  <div className="cn-her-vacio">
    <p className="cn-her-vacio-titulo">{titulo}</p>
    <p className="cn-her-vacio-texto">{texto}</p>
  </div>
);
