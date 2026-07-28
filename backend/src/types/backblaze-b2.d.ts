declare module 'backblaze-b2' {
  interface B2Options {
    applicationKeyId: string;
    applicationKey: string;
  }

  export default class B2 {
    constructor(options: B2Options);
    authorize(): Promise<any>;
    getUploadUrl(options: { bucketId: string }): Promise<any>;
    getDownloadAuthorization(options: {
      bucketId: string;
      fileNamePrefix: string;
      validDurationInSeconds: number;
    }): Promise<any>;
    listFileNames(options: {
      bucketId: string;
      prefix?: string;
      maxFileCount?: number;
    }): Promise<any>;
  }
}
