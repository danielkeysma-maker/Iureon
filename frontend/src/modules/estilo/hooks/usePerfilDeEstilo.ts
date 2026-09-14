import { useCallback, useEffect, useState } from 'react';
import { alCambiarElEstilo, estiloApi } from '../services/estilo.api';
import type { PerfilDeEstilo } from '../types';

/**
 * El perfil de estilo de un rol y una rama: para el paso 3 del asistente, para
 * Ajustes → Estilo de la firma y para «Jerga de su firma».
 *
 * TRES ESTADOS, Y EL ERROR NO SE PINTA COMO «NO HAY PERFIL». Si la consulta
 * falla no se sabe si la firma enseñó algo, y decir «su firma aún no ha
 * enseñado un formato» sería afirmar lo que no se comprobó. En ERROR el paso no
 * dice nada del estilo; el servidor, al redactar, aplica lo que haya.
 *
 * `recargar` es para el «Volver a intentar» de quien muestra el error.
 */
export type EstadoDelPerfil =
  | { estado: 'CARGANDO'; respuesta: null }
  | { estado: 'LISTO'; respuesta: PerfilDeEstilo }
  | { estado: 'ERROR'; respuesta: null };

export const usePerfilDeEstilo = (rol: string, rama: string | null): EstadoDelPerfil & { recargar: () => void } => {
  const [estado, setEstado] = useState<EstadoDelPerfil>({ estado: 'CARGANDO', respuesta: null });
  const [version, setVersion] = useState(0);

  useEffect(() => alCambiarElEstilo(() => setVersion((v) => v + 1)), []);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let vigente = true;
    setEstado({ estado: 'CARGANDO', respuesta: null });
    estiloApi
      .perfil(rol, rama)
      .then((respuesta) => {
        if (vigente) setEstado({ estado: 'LISTO', respuesta });
      })
      .catch(() => {
        if (vigente) setEstado({ estado: 'ERROR', respuesta: null });
      });
    return () => {
      vigente = false;
    };
  }, [rol, rama, version]);

  return { ...estado, recargar };
};
