import { httpClient } from '../../../config/httpClient';

/**
 * Subida directa al almacenamiento (Backblaze B2), para lo que no cabe en el
 * cuerpo de una petición al servidor.
 *
 * Vercel rechaza cuerpos de más de 4,5 MB. Una audiencia de dos horas pesa 50;
 * una tutela con sus anexos escaneados, 10 o 15. Ninguna puede pasar por el
 * backend: el navegador pide un destino firmado, sube directo a B2 y devuelve
 * solo la clave. El servidor la lee desde ahí y la borra antes de responder.
 *
 * Nació en el módulo de transcripción para el audio; se generalizó cuando la
 * revisión de escritos necesitó lo mismo. `caseId` es la carpeta dentro de la
 * firma: `audiencias`, `revisiones`, …
 */

interface UploadTarget {
  uploadUrl: string;
  authorizationToken: string;
  fileKey: string;
}

interface UploadUrlResponse {
  success?: boolean;
  uploadInfo?: UploadTarget;
}

/** B2 verifica el SHA-1 de cada subida, así que el navegador lo calcula. */
const sha1Hex = async (buffer: ArrayBuffer): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-1', buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Sube el archivo y devuelve su clave. Lanza si falla: el que llama decide qué
 * decir, pero nunca cree que algo se guardó cuando no fue así.
 *
 * XHR y no `fetch` por una sola razón: el progreso. `upload.onprogress` es la
 * única API del navegador que da los bytes enviados, y con 15 MB por el
 * enlace de una oficina la diferencia entre «subiendo · 40%» y un botón mudo
 * es la diferencia entre esperar y creer que se colgó. El 100% no se anuncia
 * al terminar de enviar: B2 todavía verifica el SHA-1; se detiene en 99 y el
 * paso siguiente lo releva.
 */
export const uploadFileToStorage = async (
  file: File,
  caseId: string,
  onProgress?: (porcentaje: number) => void,
  que = 'el archivo'
): Promise<string> => {
  const data = await httpClient.post<UploadUrlResponse>('/api/documents/upload-url', {
    body: { caseId, fileName: file.name }
  });

  const target = data.uploadInfo;
  if (!target?.uploadUrl || !target.authorizationToken || !target.fileKey) {
    throw new Error('El almacenamiento no entregó un destino de subida válido.');
  }

  const buffer = await file.arrayBuffer();
  const sha1 = await sha1Hex(buffer);

  await new Promise<void>((resolver, rechazar) => {
    const peticion = new XMLHttpRequest();
    peticion.open('POST', target.uploadUrl, true);
    peticion.setRequestHeader('Authorization', target.authorizationToken);
    // Codificado: el nombre trae acentos y espacios, y B2 lee la cabecera literal.
    peticion.setRequestHeader('X-Bz-File-Name', encodeURIComponent(target.fileKey));
    peticion.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    peticion.setRequestHeader('X-Bz-Content-Sha1', sha1);

    peticion.upload.onprogress = (evento) => {
      if (!evento.lengthComputable || !onProgress) return;
      onProgress(Math.min(99, Math.round((evento.loaded / evento.total) * 100)));
    };

    peticion.onload = () => {
      if (peticion.status >= 200 && peticion.status < 300) {
        resolver();
        return;
      }
      rechazar(
        new Error(
          `El almacenamiento rechazó ${que} (${peticion.status}). ${String(peticion.responseText ?? '').slice(0, 200)}`
        )
      );
    };
    peticion.onerror = () => rechazar(new Error(`Se perdió la conexión mientras se enviaba ${que}. Vuelva a intentarlo.`));
    peticion.onabort = () => rechazar(new Error(`El envío de ${que} se canceló.`));

    peticion.send(buffer);
  });

  return target.fileKey;
};
