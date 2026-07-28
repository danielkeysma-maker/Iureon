import B2 from 'backblaze-b2';
import { config } from '../config/env.config.js';

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
        console.log('[B2-STORAGE] Autenticación exitosa con Backblaze B2 API.');
      } else {
        console.warn('[B2-STORAGE] Usando credenciales de desarrollo simuladas para Backblaze B2 Vault.');
      }
    } catch (err: any) {
      console.warn('[B2-STORAGE-FALLBACK] Error autenticando B2 real:', err.message);
    }
  }

  /**
   * Genera URL pre-firmada de subida de PDF aislada por firm_id y case_id
   */
  public async generateUploadPresignedUrl(
    firmId: string,
    caseId: string,
    fileName: string
  ): Promise<B2UploadUrlResponse> {
    await this.ensureAuthorized();

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    // Ruta aislada obligatoria: {firm_id}/{case_id}/{sanitizedFileName}
    const fileKey = `${firmId}/${caseId}/${Date.now()}_${sanitizedFileName}`;

    if (this.isAuthorized) {
      try {
        const uploadData = await this.b2.getUploadUrl({
          bucketId: config.backblaze.bucketId
        });

        return {
          uploadUrl: uploadData.data.uploadUrl,
          authorizationToken: uploadData.data.authorizationToken,
          fileKey,
          bucketId: config.backblaze.bucketId,
          expiresInSeconds: 3600
        };
      } catch (err: any) {
        console.warn('[B2-UPLOAD-FALLBACK] Error obteniendo B2 upload URL:', err.message);
      }
    }

    // Fallback presigned URL para desarrollo sin credenciales productivas
    return {
      uploadUrl: `https://f000.backblazeb2.com/file/iureon-vault/${fileKey}`,
      authorizationToken: `b2_auth_token_mock_${firmId}`,
      fileKey,
      bucketId: config.backblaze.bucketId || 'iureon-vault-bucket',
      expiresInSeconds: 3600
    };
  }

  /**
   * Genera URL de descarga presignada con permiso temporal de 15 minutos
   */
  public async generateDownloadPresignedUrl(firmId: string, fileKey: string): Promise<string> {
    await this.ensureAuthorized();

    // Verificación estricta de aislamiento tenant a nivel de prefijo de ruta
    if (!fileKey.startsWith(`${firmId}/`)) {
      throw new Error(`[RLS-B2-VIOLATION] Intento no autorizado de acceder a un expediente de otra firma (${fileKey}).`);
    }

    if (this.isAuthorized) {
      try {
        const downloadAuth = await this.b2.getDownloadAuthorization({
          bucketId: config.backblaze.bucketId,
          fileNamePrefix: fileKey,
          validDurationInSeconds: 900 // 15 minutos
        });

        return `https://f000.backblazeb2.com/file/${config.backblaze.bucketId}/${fileKey}?Authorization=${downloadAuth.data.authorizationToken}`;
      } catch (err: any) {
        console.warn('[B2-DOWNLOAD-FALLBACK] Error generando token de descarga B2:', err.message);
      }
    }

    return `https://f000.backblazeb2.com/file/iureon-vault/${fileKey}?token=mock_download_token_${firmId}`;
  }

  /**
   * Lista los expedientes en PDF almacenados exclusivamente para la firma activa
   */
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
        console.warn('[B2-LIST-FALLBACK] Error listando archivos B2:', err.message);
      }
    }

    // Datos mock deterministas aislados por cliente
    return [
      {
        fileId: 'b2-doc-001',
        fileName: 'EXP-2026-904_Contestacion_Laboral.pdf',
        fileKey: `${firmId}/EXP-2026-904/EXP-2026-904_Contestacion_Laboral.pdf`,
        sizeBytes: 4194304, // 4 MB
        uploadTimestamp: new Date().toISOString(),
        downloadUrl: `https://f000.backblazeb2.com/file/iureon-vault/${firmId}/EXP-2026-904/EXP-2026-904_Contestacion_Laboral.pdf`
      },
      {
        fileId: 'b2-doc-002',
        fileName: 'Sentencia_Corte_Suprema_SL4102.pdf',
        fileKey: `${firmId}/EXP-2026-904/Sentencia_Corte_Suprema_SL4102.pdf`,
        sizeBytes: 2097152, // 2 MB
        uploadTimestamp: new Date().toISOString(),
        downloadUrl: `https://f000.backblazeb2.com/file/iureon-vault/${firmId}/EXP-2026-904/Sentencia_Corte_Suprema_SL4102.pdf`
      }
    ];
  }
}
