import React from 'react';
import { manualReadsApi } from './manualReads.api';

/**
 * El registro de lectura, compartido por las dos pantallas del manual.
 *
 * ─── OPTIMISTA, PERO NO MENTIROSO ───────────────────────────────────────────
 *
 * La marca se pinta al instante y se envía después: esperar la red para ver una
 * palomita hace sentir lenta una acción que no cuesta nada. Pero si el envío
 * falla se REVIERTE — una marca que se queda puesta sin haberse guardado es
 * exactamente la afirmación falsa que este registro existe para evitar, y la
 * descubriría el socio, no quien la puso.
 *
 * ─── ESTO NO AFIRMA QUE ALGUIEN ENTENDIÓ ────────────────────────────────────
 *
 * Marca que alguien dijo haberlo leído. El producto no mide comprensión y no
 * debe insinuar que lo hace.
 */
export const useManualReads = () => {
  const [leidos, setLeidos] = React.useState<Set<string>>(new Set());
  const [cargado, setCargado] = React.useState(false);

  React.useEffect(() => {
    let vigente = true;
    manualReadsApi
      .listar()
      .then((filas) => {
        if (vigente) setLeidos(new Set(filas.map((f) => f.articleId)));
      })
      .catch(() => {
        /* Sin registro no se advierte nada: no sabemos que no haya leído. */
      })
      .finally(() => {
        if (vigente) setCargado(true);
      });
    return () => {
      vigente = false;
    };
  }, []);

  const alternar = React.useCallback(
    (articleId: string) => {
      const estaba = leidos.has(articleId);
      const siguiente = new Set(leidos);
      if (estaba) siguiente.delete(articleId);
      else siguiente.add(articleId);
      setLeidos(siguiente);

      void manualReadsApi.marcar(articleId, !estaba).catch(() => {
        /* Se revierte: una marca sin guardar es una afirmación falsa. */
        setLeidos((actual) => {
          const vuelta = new Set(actual);
          if (estaba) vuelta.add(articleId);
          else vuelta.delete(articleId);
          return vuelta;
        });
      });
    },
    [leidos]
  );

  return { leidos, cargado, alternar };
};
