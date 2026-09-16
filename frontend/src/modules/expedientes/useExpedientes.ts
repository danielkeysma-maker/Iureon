import React from 'react';
import { expedientesApi } from './services/expedientes.api';
import type { CasoBuscable, Expediente } from './types';

/**
 * LOS EXPEDIENTES DE LA FIRMA, PARA ESCOGER UNO.
 *
 * ─── POR QUÉ UN GANCHO Y NO SOLO UN COMPONENTE ─────────────────────────────
 *
 * `SelectorDeExpediente` resuelve las pantallas donde el control es un bloque:
 * rótulo arriba, desplegable, y una línea debajo. Son la mayoría.
 *
 * Pero las dos barras de configuración de Redacción NO tienen esa forma. La de
 * escritorio usa el `Combobox` de la barra —con su búsqueda, su ancho máximo y
 * su pie— y la del teléfono usa un `<select>` dentro de su propia rejilla.
 * Meterlas en el componente de bloque les rompería la fila.
 *
 * Así que se parte por donde de verdad se comparte: LOS DATOS. Cargar la lista
 * —y tragarse su fallo sin tumbar la pantalla— es idéntico en las seis; pintar
 * el control no lo es. El componente usa este gancho; las barras también, y
 * cada una pinta lo suyo.
 *
 * Es la misma división que `useHechosDesdeArchivo` ya hizo entre el escritorio
 * y el teléfono de Orientación: la regla compartida en el gancho, la pintura
 * en cada pantalla.
 *
 * ─── SU FALLO NO ES EL FALLO DE LA PANTALLA ────────────────────────────────
 *
 * Si la lista no se puede leer se devuelve vacía, y quien la use esconde su
 * control. Nadie deja de redactar, de orientar ni de transcribir porque el
 * catálogo de casos no respondió: atar es un extra, el trabajo es el trabajo.
 */
/**
 * ─── DEVUELVE `CasoBuscable`, QUE ES LO QUE LA RUTA YA MANDABA ─────────────
 *
 * `GET /api/expedientes` trae desde siempre el documento del cliente y las
 * personas de cada caso —son los datos con que «Mis casos» encuentra un asunto
 * por cédula—, y este gancho los tiraba al tiparlos fuera. El selector
 * compartido los necesita para que escribir una cédula o el nombre de un
 * testigo encuentre el caso, igual que en la lista. No se pide nada más al
 * servidor: se deja de esconder lo que ya venía.
 *
 * NO se promete el RESUMEN del caso (próximo término, documentos): eso lo pide
 * «Mis casos» aparte, y prometerlo aquí es cómo se llega a leerlo sin
 * comprobar. Todo consumidor de hoy lee solo campos de `Expediente`, así que
 * ninguno cambia.
 */
export const useExpedientes = (): CasoBuscable[] => {
  const [expedientes, setExpedientes] = React.useState<CasoBuscable[]>([]);

  React.useEffect(() => {
    let vivo = true;
    expedientesApi
      .listar()
      .then((e) => {
        if (vivo) setExpedientes(e);
      })
      .catch(() => {
        if (vivo) setExpedientes([]);
      });
    return () => {
      vivo = false;
    };
  }, []);

  return expedientes;
};

/**
 * Cómo se nombra un expediente en una lista de escoger.
 *
 * La carátula sola no basta cuando la firma lleva dos asuntos del mismo
 * cliente; el radicado los separa y es lo que el abogado tiene en la cabeza al
 * buscar. Se escribe una vez porque estaba copiado en las seis pantallas, con
 * el mismo separador y la misma condición.
 */
export const rotuloDeExpediente = (e: Expediente): string =>
  e.radicado ? `${e.caratula} · ${e.radicado}` : e.caratula;
