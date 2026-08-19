import B2 from 'backblaze-b2';
import { config } from '../../config/env.config';

export interface B2UploadUrlResponse {
  uploadUrl: string;
  authorizationToken: string;
  fileKey: string;
  bucketId: string;
  expiresInSeconds: number;
}

export interface B2FileObject {
  fileId: string;
  fileName: string;
  fileKey: string;
  sizeBytes: number;
  uploadTimestamp: string;
  downloadUrl: string;
}

export class BackblazeB2TenantStorageService {
  private b2: any;
  private isAuthorized = false;

  constructor() {
    this.b2 = new B2({
      applicationKeyId: config.backblaze.applicationKeyId || 'MOCK_B2_KEY_ID',
      applicationKey: config.backblaze.applicationKey || 'MOCK_B2_KEY_SECRET'
    });
  }

  private async ensureAuthorized(): Promise<void> {
    if (this.isAuthorized) return;
    try {
      if (config.backblaze.applicationKeyId && config.backblaze.applicationKeyId !== 'MOCK_B2_KEY_ID') {
        await this.b2.authorize();
        this.isAuthorized = true;
      }
    } catch (err: any) {
      // No longer a fallback: callers now throw rather than fabricate a URL, so
      // this line is the diagnosis and not the consolation. It read
      // "[B2-STORAGE-FALLBACK]" while the service quietly returned links that
      // resolved to nothing.
      console.error('[B2-AUTH-FAILED] Backblaze rechazó las credenciales:', err.message);
    }
  }

  public async generateUploadPresignedUrl(
    firmId: string,
    caseId: string,
    fileName: string
  ): Promise<B2UploadUrlResponse> {
    await this.ensureAuthorized();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileKey = `${firmId}/${caseId}/${Date.now()}_${sanitizedFileName}`;

    if (this.isAuthorized) {
      try {
        const uploadData = await this.b2.getUploadUrl({ bucketId: config.backblaze.bucketId });
        return {
          uploadUrl: uploadData.data.uploadUrl,
          authorizationToken: uploadData.data.authorizationToken,
          fileKey,
          bucketId: config.backblaze.bucketId,
          expiresInSeconds: 3600
        };
      } catch (err: any) {
        console.warn('[B2-UPLOAD-FALLBACK] Error obteniendo URL:', err.message);
      }
    }

    /*
     * FAILS. It does not hand back a URL that goes nowhere.
     *
     * This returned `b2_auth_token_mock_${firmId}` and a fabricated upload URL
     * whenever B2 authorisation failed, so the API answered 200 with a link the
     * browser would upload to and lose. The document vault could have been
     * accepting files into the void for as long as the credentials had been
     * wrong, and nothing in the product would have said so — the same shape as
     * the fabricated vectors and the invented rulings deleted before it.
     *
     * It surfaced the day it mattered: B2 was answering 401 while the UI showed
     * uploads working.
     */
    throw new Error(
      'El almacenamiento B2 no está disponible: la autenticación falló. ' +
        'Revisa B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY y B2_BUCKET_ID. ' +
        'No se entrega una URL de subida que no funcionaría.'
    );
  }

  public async generateDownloadPresignedUrl(firmId: string, fileKey: string): Promise<string> {
    await this.ensureAuthorized();

    if (!fileKey.startsWith(`${firmId}/`)) {
      throw new Error(`[RLS-B2-VIOLATION] Intento no autorizado de acceder a un expediente de otra firma (${fileKey}).`);
    }

    if (this.isAuthorized) {
      try {
        const downloadAuth = await this.b2.getDownloadAuthorization({
          bucketId: config.backblaze.bucketId,
          fileNamePrefix: fileKey,
          validDurationInSeconds: 900
        });

        return `https://f000.backblazeb2.com/file/${config.backblaze.bucketId}/${fileKey}?Authorization=${downloadAuth.data.authorizationToken}`;
      } catch (err: any) {
        console.warn('[B2-DOWNLOAD-FALLBACK] Error generando token:', err.message);
      }
    }

    // Same rule as the upload path: a link carrying `mock_download_token` looks
    // like a working URL and resolves to nothing. Deepgram would fetch it, fail
    // to read audio, and report a corrupt file — pointing the lawyer at their
    // recording instead of at our credentials.
    throw new Error(
      'El almacenamiento B2 no está disponible: la autenticación falló. ' +
        'No se entrega un enlace de descarga que no funcionaría.'
    );
  }

  /**
   * Deletes one object, and exists so transcription audio does not survive its
   * own transcript.
   *
   * A hearing recording is uploaded here only because Vercel functions reject
   * bodies over 4.5 MB, so the browser sends it straight to B2 and Deepgram
   * reads it from there. That detour is acceptable only if it ends: the module
   * keeps uploads in memory precisely so privileged recordings never persist,
   * and B2 without a delete would quietly undo that.
   *
   * The firm prefix is enforced the same way the download path enforces it. A
   * delete that trusted the caller's key would let one firm erase another's.
   */
  public async deleteObject(firmId: string, fileKey: string): Promise<boolean> {
    if (!fileKey.startsWith(`${firmId}/`)) {
      throw new Error(`[RLS-B2-VIOLATION] Intento de borrar un archivo de otra firma (${fileKey}).`);
    }

    await this.ensureAuthorized();

    if (!this.isAuthorized) {
      console.warn('[B2-DELETE] B2 no está autorizado: el audio no se pudo borrar.');
      return false;
    }

    try {
      const { data } = await this.b2.listFileNames({
        bucketId: config.backblaze.bucketId,
        prefix: fileKey,
        maxFileCount: 1,
        startFileName: fileKey,
        delimiter: ''
      });

      const file = data?.files?.find((f: any) => f.fileName === fileKey);

      if (!file) {
        console.warn(`[B2-DELETE] No se encontró ${fileKey}; nada que borrar.`);
        return false;
      }

      await this.b2.deleteFileVersion({ fileId: file.fileId, fileName: file.fileName });
      return true;
    } catch (err: any) {
      // Surfaced rather than swallowed: an audio file that failed to delete is
      // privileged material still sitting in storage, and nobody would know.
      console.error('[B2-DELETE] No se pudo borrar el archivo:', err.message);
      return false;
    }
  }

  public async listFirmDocuments(firmId: string): Promise<B2FileObject[]> {
    await this.ensureAuthorized();

    if (this.isAuthorized) {
      try {
        const response = await this.b2.listFileNames({
          bucketId: config.backblaze.bucketId,
          prefix: `${firmId}/`,
          maxFileCount: 100
        });

        return response.data.files.map((file: any) => ({
          fileId: file.fileId,
          fileName: file.fileName.split('/').pop() || file.fileName,
          fileKey: file.fileName,
          sizeBytes: file.contentLength,
          uploadTimestamp: new Date(file.uploadTimestamp).toISOString(),
          downloadUrl: `https://f000.backblazeb2.com/file/${config.backblaze.bucketId}/${file.fileName}`
        }));
      } catch (err: any) {
        console.warn('[B2-LIST-FALLBACK] Error listando archivos:', err.message);
      }
    }

    /*
     * The third fabricator in this one file, and the most brazen: it listed a
     * document called EXP-2026-904_Contestacion_Laboral.pdf, 4 MB, uploaded
     * seconds ago, with a download link — for a file that has never existed.
     * A firm looking at its vault saw a case file it did not have, and clicking
     * it would have failed with something about the file rather than about the
     * credentials.
     *
     * An empty vault is a fact a firm can act on. An invented one is not.
     */
    throw new Error(
      'El almacenamiento B2 no está disponible: la autenticación falló. ' +
        'No se puede listar el expediente digital.'
    );
  }
}
