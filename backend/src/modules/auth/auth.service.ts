// ============================================================================
// Auth Service — Authentication logic (JWT, OTP, registration)
// ============================================================================
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto, AuthResponseDto } from './auth.dto';

@Injectable()
export class AuthService {
  // In-memory OTP store (in production, use Redis)
  private otpStore = new Map<string, { otp: string; expiresAt: Date }>();

  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check for existing user
    if (dto.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (existing) throw new ConflictException('Phone number already registered');
    }
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Email already registered');
    }

    // Hash password if provided
    const passwordHash = dto.password
      ? crypto.createHash('sha256').update(dto.password).digest('hex')
      : null;

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        role: (dto.role as any) || 'ELDER',
        language: dto.language || 'en',
      },
    });

    // Create elder profile if role is ELDER
    if (user.role === 'ELDER') {
      await this.prisma.elderProfile.create({
        data: { userId: user.id },
      });
    }

    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    let user;

    if (dto.phone && dto.otp) {
      // OTP-based login
      const valid = this.verifyOtp(dto.phone, dto.otp);
      if (!valid) throw new UnauthorizedException('Invalid or expired OTP');
      user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    } else if (dto.email && dto.password) {
      // Email/password login
      const passwordHash = crypto.createHash('sha256').update(dto.password).digest('hex');
      user = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (!user || user.passwordHash !== passwordHash) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else {
      throw new UnauthorizedException('Provide phone+OTP or email+password');
    }

    if (!user) throw new UnauthorizedException('User not found');
    return this.generateTokens(user);
  }

  async requestOtp(phone: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new UnauthorizedException('Phone number not registered');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(phone, {
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    // In production: send via SMS gateway (Twilio, etc.)
    console.log(`[DEV] OTP for ${phone}: ${otp}`);

    return { message: 'OTP sent successfully' };
  }

  private verifyOtp(phone: string, otp: string): boolean {
    const stored = this.otpStore.get(phone);
    if (!stored) return false;
    if (new Date() > stored.expiresAt) {
      this.otpStore.delete(phone);
      return false;
    }
    if (stored.otp !== otp) return false;
    this.otpStore.delete(phone);
    return true;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const secret = process.env.JWT_SECRET || 'granny-secret-key';
      const decoded = jwt.verify(refreshToken, secret) as any;
      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) throw new UnauthorizedException('User not found');
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(user: any): AuthResponseDto {
    const secret = process.env.JWT_SECRET || 'granny-secret-key';
    const payload = { sub: user.id, role: user.role, name: user.name, familyGroupId: user.familyGroupId };

    const accessToken = jwt.sign(payload, secret, { expiresIn: '24h' });
    const refreshToken = jwt.sign(payload, secret, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        language: user.language,
      },
    };
  }
}
