import { Request, Response } from 'express';
import { SubscriptionService } from './subscription.service';

const subscriptionService = new SubscriptionService();

export const getFirmProfileController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId;
    if (!firmId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
      return;
    }

    const profile = await subscriptionService.getFirmProfile(firmId);
    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ error: 'FIRM_PROFILE_ERROR', message: error.message });
  }
};

export const getFirmUsersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId;
    if (!firmId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
      return;
    }

    const users = await subscriptionService.getFirmUsers(firmId);
    res.json({ success: true, firmId, users });
  } catch (error: any) {
    res.status(500).json({ error: 'FIRM_USERS_ERROR', message: error.message });
  }
};

export const inviteFirmUserController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId;
    const { name, email, role } = req.body;

    if (!firmId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
      return;
    }

    if (!name || !email) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Se requieren los campos name y email' });
      return;
    }

    const newUser = await subscriptionService.inviteUserToFirm(firmId, name, email, role || 'ASOCIADO');
    res.json({ success: true, message: 'Usuario invitado exitosamente a la firma', user: newUser });
  } catch (error: any) {
    res.status(500).json({ error: 'INVITE_USER_ERROR', message: error.message });
  }
};
