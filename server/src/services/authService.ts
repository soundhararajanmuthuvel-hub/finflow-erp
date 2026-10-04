import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { config } from '../config/index.js';
import { AuthUserPayload } from '../types/index.js';

export class AuthService {
  static async login(email: string, passwordPlain: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      throw new Error('Invalid email or credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('User account is not active');
    }

    const isValid = await bcrypt.compare(passwordPlain, user.password);
    if (!isValid) {
      throw new Error('Invalid email or credentials');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as any,
      companyId: user.companyId,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        company: {
          id: user.company.id,
          name: user.company.name,
          currencySymbol: user.company.currencySymbol,
        },
      },
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      company: user.company,
    };
  }
}
