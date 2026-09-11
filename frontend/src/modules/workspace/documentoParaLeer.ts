/**
 * EL DOCUMENTO QUE ORIENTACIÓN LE PASA A REVISIONES PARA QUE LO LEA.
 *
 * ─── POR QUÉ EXISTE ────────────────────────────────────────────────────────
 *
 * Orientación acepta adjuntar el auto que llegó y NO lee plazos: entrega
 * actuaciones del catálogo con el término de la norma. Cuando el documento
 * adjuntado anuncia un término —«dentro de los cinco (5) días»— la pantalla lo
 * dice y ofrece leerlo en la puerta que sí lo lee.
 *
 * Ese ofrecimiento sería una trampa si costara volver a subir el documento.
 * Trescientas páginas no se adjuntan dos veces: el abogado se queda donde
 * está, y el aviso habría servido para que ignore el consejo. Así que el texto
 * viaja con él.
 *
 * ─── POR QUÉ NO ES UN PROP ─────────────────────────────────────────────────
 *
 * Mismo razonamiento que `agenda/pendiente.ts`: el origen —Orientación— y el
 * destino —el diálogo de Revisiones— no se conocen, y hacer viajar el texto
 * como prop obligaría a `App.tsx` a sostener un estado más y a cada pantalla a
 * saber dónde vive la otra.
 *
 * ─── SE CONSUME UNA VEZ ────────────────────────────────────────────────────
 *
 * `tomar()` lee y borra en el mismo movimiento. Si se quedara, el diálogo
 * volvería a abrirse con el auto de la semana pasada cada vez que alguien
 * entra a Revisiones, y una revisión cuesta saldo.
 *
 * ─── Y AQUÍ SÍ VIAJA CONTENIDO, QUE ES LO QUE HAY QUE MIRAR ────────────────
 *
 * `pendiente.ts` declara que por él viajan identificadores y nunca un plazo.
 * Por éste viaja el TEXTO de un documento del cliente, que es material
 * privilegiado, así que tres reglas:
 *
 *   · `sessionStorage`, no `localStorage`: muere con la pestaña. Lo que se
 *     guardara entre sesiones sería una copia del expediente ajeno esperando
 *     en el equipo de quien use ese navegador después.
 *   · Se borra al consumirlo, no al usarlo bien.
 *   · Y hay un TOPE. `sessionStorage` ronda los 5 MB y una escritura que no
 *     cabe lanza; peor, podría desalojar lo que otras pantallas guardaron.
 *     Por encima del tope no se guarda nada y el diálogo se abre vacío en el
 *     modo correcto: un clic de más es mucho mejor que un fallo silencioso.
 */

const CLAVE = 'iureon.revision.documento';

/**
 * UN MILLÓN Y MEDIO DE CARACTERES, y no es una cifra redonda al azar: el
 * Código General del Proceso entero —336 páginas— son 0,73 MB de texto
 * plano, medidos. El tope deja pasar el doble de eso y se queda muy por
 * debajo de los ~5 MB del almacén, que además comparte con la pantalla
 * recordada y con la agenda.
 */
export const MAXIMO_PARA_PASAR = 1_500_000;

export interface DocumentoParaLeer {
  /** El texto ya extraído en el navegador. Vacío si no cupo. Nunca el archivo. */
  texto: string;
  /**
   * Cómo se llamaba el archivo, o cadena vacía cuando NO HABÍA ARCHIVO.
   *
   * El vacío distingue dos llegadas que de otro modo se confunden: desde
   * Orientación con un documento que no cupo —y entonces hay que decírselo al
   * abogado, porque él sí adjuntó algo— y desde Inicio, por la puerta «Me
   * llegó un documento», donde todavía no ha subido nada y avisarle de que
   * «no cupo» sería inventarle una pérdida.
   */
  nombre: string;
  /**
   * SI EL TEXTO VIAJÓ COMPLETO.
   *
   * En falso, el diálogo se abre en el modo correcto pero VACÍO. Y lo dice,
   * pero solo si `nombre` viene lleno: entonces hubo un archivo que no cupo.
   * La alternativa —mandar medio documento— sería peor que no mandar nada: un
   * informe sobre la mitad de un auto no anuncia que le falta la otra, y lo
   * que se corta primero es la parte resolutiva, que va al final.
   */
  completo: boolean;
}

/**
 * Deja el documento para la pantalla siguiente. Devuelve si pudo dejar algo:
 * en falso, quien llama NO debe navegar prometiendo que el texto va.
 *
 * Cuando el texto no cabe se guarda igual el aviso, sin él: la navegación
 * sigue valiendo la pena —el abogado llega a la puerta correcta, en el modo
 * correcto— y solo tiene que volver a adjuntar.
 */
export const dejarDocumentoParaLeer = (d: { texto: string; nombre: string }): boolean => {
  const cabe = d.texto.trim().length > 0 && d.texto.length <= MAXIMO_PARA_PASAR;
  const carga: DocumentoParaLeer = {
    texto: cabe ? d.texto : '',
    nombre: d.nombre,
    completo: cabe
  };
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(carga));
    return true;
  } catch {
    /* Modo privado o almacenamiento apagado: no hay traspaso que valga. */
    return false;
  }
};

export const tomarDocumentoParaLeer = (): DocumentoParaLeer | null => {
  try {
    const crudo = sessionStorage.getItem(CLAVE);
    sessionStorage.removeItem(CLAVE);
    if (!crudo) return null;
    const valor = JSON.parse(crudo) as Partial<DocumentoParaLeer>;
    if (!valor || typeof valor.texto !== 'string') return null;
    return {
      texto: valor.texto,
      /* Se conserva el vacío: es el que dice que no había archivo. */
      nombre: typeof valor.nombre === 'string' ? valor.nombre : '',
      completo: valor.completo === true && valor.texto.trim().length > 0
    };
  } catch {
    return null;
  }
};
