import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js'; // Ensure the path is correct
import { config } from 'dotenv';

config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
});

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const resetToken = crypto.createHash('sha256').update(token).digest('hex');

    await prisma.user.update({
      where: { email },
      data: { resetPasswordToken: resetToken, resetPasswordExpires: new Date(Date.now() + 3600000) }, // 1 hour
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

    const message = `You requested a password reset. Please go to this link to reset your password: \n\n ${resetUrl}`;

    await transporter.sendMail({
      to: email,
      subject: 'Password Reset',
      text: message,
    });

    res.status(200).json({ message: 'Email sent.Please check your email and follow the link that has been sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyResetToken = async (req, res) => {
  const { token } = req.params;
  const resetToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.status(200).json({ message: 'Valid token' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const resetToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.status(200).json({ message: 'Password reset successful. You can now go back to login page.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
