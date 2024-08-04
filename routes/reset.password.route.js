import express from 'express';
import { forgotPassword, resetPassword, verifyResetToken } from '../controllers/reset.password.controller.js';


const router = express.Router();

router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/reset-password/:token',  verifyResetToken);

export default router;
