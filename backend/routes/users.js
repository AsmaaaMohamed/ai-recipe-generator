import express from 'express';
import * as userController from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
//All routes in this file are protected by authMiddleware
router.use(authMiddleware);
//Protected routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);
router.put('/preferences', userController.updatePreferences);
router.delete('/account', userController.deleteAccount);
export default router;