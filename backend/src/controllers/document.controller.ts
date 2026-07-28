import { Request, Response } from 'express';
import { BackblazeB2TenantStorageService } from '../services/b2.service.js';

const b2StorageService = new BackblazeB2TenantStorageService();

/**
 * Genera la URL presignada para subir un expediente PDF directamente a Backblaze B2
 */
export const getUploadUrlController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId;
    const { caseId, fileName } = req.body;

    if (!firmId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
      return;
    }

    if (!caseId || !fileName) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Se requieren los campos caseId y fileName' });
      return;
    }

    const uploadInfo = await b2StorageService.generateUploadPresignedUrl(firmId, caseId, fileName);

    res.json({
      success: true,
      firmId,
      uploadInfo
    });
  } catch (error: any) {
    console.error('[DOCUMENT-UPLOAD-ERROR]', error);
    res.status(500).json({ error: 'B2_STORAGE_ERROR', message: error.message });
  }
};

/**
 * Genera URL firmada de lectura/descarga temporal (15 mins) para un documento en B2
 */
export const getDownloadUrlController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId;
    const fileKey = req.query.fileKey as string;

    if (!firmId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
      return;
    }

    if (!fileKey) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Se requiere el parámetro fileKey' });
      return;
    }

    const downloadUrl = await b2StorageService.generateDownloadPresignedUrl(firmId, fileKey);

    res.json({
      success: true,
      firmId,
      fileKey,
      downloadUrl,
      expiresInSeconds: 900
    });
  } catch (error: any) {
    console.error('[DOCUMENT-DOWNLOAD-ERROR]', error);
    res.status(403).json({ error: 'TENANT_ISOLATION_VIOLATION', message: error.message });
  }
};

/**
 * Lista los documentos en expedientes pertenecientes únicamente a la firma activa
 */
export const listDocumentsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId;

    if (!firmId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
      return;
    }

    const documents = await b2StorageService.listFirmDocuments(firmId);

    res.json({
      success: true,
      firmId,
      totalDocuments: documents.length,
      documents
    });
  } catch (error: any) {
    console.error('[DOCUMENT-LIST-ERROR]', error);
    res.status(500).json({ error: 'B2_LIST_ERROR', message: error.message });
  }
};
