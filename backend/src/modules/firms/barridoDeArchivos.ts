/**
 * El barrido de los archivos de una firma en el almacenamiento, sin saber cuál.
 *
 * SEPARADO DE `borradoDeFirma.service` PARA PODER PROBARLO. El almacén entra
 * como dos funciones —listar y borrar—, así que el check lo ejercita con un
 * almacén falso y sin red. La regla que se prueba es la honestidad del
 * resultado: todo lo que quedó en el almacén se dice.
 *
 * LOS TRES SILENCIOS QUE TENÍA LA VERSIÓN ANTERIOR, y que aquí se cierran:
 *
 *  1. Agotaba las rondas y salía sin decir nada. Con más de
 *     `maxRondas × tamanoDePagina` archivos, el resto quedaba en B2 y la
 *     constancia de borrado no lo mencionaba.
 *  2. Un archivo que no se podía borrar volvía a listarse en cada ronda y se
 *     advertía una vez por ronda: hasta cincuenta líneas iguales, que esconden
 *     las que importan.
 *  3. Si una página ENTERA eran archivos que fallaban, el listado —que siempre
 *     devuelve las primeras claves— no dejaba ver los que había detrás, y la
 *     ronda sin avance se leía como «terminado».
 */

export interface AlmacenDeArchivos {
  /** Las primeras claves que quedan bajo el prefijo de la firma. Lanza si no puede listar. */
  listar(): Promise<ReadonlyArray<{ fileKey: string }>>;
  /** `true` si se borró. Puede devolver `false` o lanzar. */
  borrar(fileKey: string): Promise<boolean>;
}

export interface ResultadoDelBarrido {
  borrados: number;
  advertencias: string[];
}

export const barrerArchivosDeLaFirma = async (
  almacen: AlmacenDeArchivos,
  opciones: {
    /** Cuántas claves devuelve como máximo una llamada a `listar`. */
    tamanoDePagina: number;
    maxRondas?: number;
  }
): Promise<ResultadoDelBarrido> => {
  const maxRondas = opciones.maxRondas ?? 50;
  /** Clave → motivo (vacío cuando el almacén solo dijo que no). Una sola advertencia por clave. */
  const fallidos = new Map<string, string>();
  const generales: string[] = [];
  let borrados = 0;
  let terminado = false;
  let tapado = false;

  for (let ronda = 0; ronda < maxRondas && !terminado; ronda++) {
    let objetos: ReadonlyArray<{ fileKey: string }>;
    try {
      objetos = await almacen.listar();
    } catch (err) {
      generales.push(
        `No se pudieron listar ni borrar los archivos de la firma en B2: ${err instanceof Error ? err.message : String(err)}`
      );
      terminado = true;
      break;
    }

    const pendientes = objetos.filter((o) => !fallidos.has(o.fileKey));
    if (pendientes.length === 0) {
      terminado = true;
      // Una página llena solo de fallidos no deja ver si hay algo detrás.
      tapado = objetos.length > 0 && objetos.length >= opciones.tamanoDePagina;
      break;
    }

    for (const objeto of pendientes) {
      try {
        if (await almacen.borrar(objeto.fileKey)) borrados += 1;
        else fallidos.set(objeto.fileKey, '');
      } catch (err) {
        fallidos.set(objeto.fileKey, err instanceof Error ? err.message : String(err));
      }
    }
  }

  const advertencias = [...fallidos].map(([clave, motivo]) =>
    motivo ? `Archivo en B2 no borrado: ${clave} (${motivo})` : `Archivo en B2 no borrado: ${clave}`
  );
  advertencias.push(...generales);
  if (!terminado) {
    advertencias.push(
      `El barrido de B2 se detuvo tras ${maxRondas} rondas con archivos todavía bajo el prefijo de la firma: hay que terminarlo a mano.`
    );
  }
  if (tapado) {
    advertencias.push(
      `Pueden quedar más archivos en B2 detrás de los ${fallidos.size} que no se pudieron borrar: el listado devuelve ${opciones.tamanoDePagina} por consulta y todos eran de los fallidos. Hay que revisar el prefijo de la firma a mano.`
    );
  }
  return { borrados, advertencias };
};
