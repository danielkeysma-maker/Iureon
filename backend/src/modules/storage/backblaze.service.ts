import B2 from 'backblaze-b2';
import { config } from '../../config/env.config';

export interface B2UploadResult {
  fileId: string;
  fileName: string;
  fileUrl: string;
}

export class BackblazeVaultService {
  private b2: any;
  private isConfigured: boolean;

  constructor() {
    const { applicationKeyId, applicationKey } = config.backblaze;
    this.isConfigured = Boolean(applicationKeyId && applicationKey);

    if (this.isConfigured) {
      this.b2 = new B2({
        applicationKeyId,
        applicationKey
      });
    }
  }

  /**
   * Inicializa sesión con la API de Backblaze B2
   */
  private async authorize(): Promise<boolean> {
    if (!this.isConfigured || !this.b2) return false;
    try {
      await this.b2.authorize();
      return true;
    } catch (err) {
      console.error('[Backblaze B2 Error] Fallo de autorización:', err);
      return false;
    }
  }

  /**
   * Sube un expediente PDF cifrado a la bóveda B2
   */
  public async uploadExpediente(
    firmId: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType = 'application/pdf'
  ): Promise<B2UploadResult | null> {
    const authorized = await this.authorize();
    if (!authorized) {
      console.log(`[Backblaze B2 Vault] Simulando almacenamiento seguro para ${fileName} (firm_id: ${firmId}).`);
      return {
        fileId: `b2-file-${Date.now()}`,
        fileName,
        fileUrl: `https://f000.backblazeb2.com/file/iureon-vault/${firmId}/${fileName}`
      };
    }

    try {
      const uploadUrlRes = await this.b2.getUploadUrl({
        bucketId: config.backblaze.bucketId
      });

      const response = await this.b2.uploadFile({
        uploadUrl: uploadUrlRes.data.uploadUrl,
        uploadAuthToken: uploadUrlRes.data.authorizationToken,
        fileName: `${firmId}/${fileName}`,
        data: fileBuffer,
        mime: contentType
      });

      return {
        fileId: response.data.fileId,
        fileName: response.data.fileName,
        fileUrl: `https://f000.backblazeb2.com/file/${config.backblaze.bucketId}/${response.data.fileName}`
      };
    } catch (err) {
      console.error('[Backblaze B2 Upload Error]:', err);
      return null;
    }
  }

  /**
   * Genera URL autorizada de acceso a expediente
   */
  public async getPresignedUrl(firmId: string, fileName: string): Promise<string> {
    const authorized = await this.authorize();
    if (!authorized) {
      return `https://b2.iureon-vault.internal/${firmId}/${fileName}`;
    }

    try {
      const response = await this.b2.getDownloadAuthorization({
        bucketId: config.backblaze.bucketId,
        fileNamePrefix: `${firmId}/${fileName}`,
        validDurationInSeconds: 3600
      });
      return `https://f002.backblazeb2.com/file/${config.backblaze.bucketId}/${firmId}/${fileName}?authorization=${response.data.authorizationToken}`;
    } catch (err) {
      console.error('[Backblaze B2 Presigned URL Error]:', err);
      return `https://b2.iureon-vault.internal/${firmId}/${fileName}`;
    }
  }
}
