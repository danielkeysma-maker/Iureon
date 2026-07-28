import { Router } from 'express';
import {
  getFirmProfileController,
  getFirmUsersController,
  inviteFirmUserController
} from './subscription.controller';

const router = Router();

router.get('/subscription/firm-profile', getFirmProfileController);
router.get('/subscription/firm-users', getFirmUsersController);
router.post('/subscription/invite-user', inviteFirmUserController);

export const subscriptionRoutes = router;
