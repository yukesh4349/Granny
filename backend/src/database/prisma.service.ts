// ============================================================================
// Prisma Service — Database connection provider for NestJS
// ============================================================================
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch {
      // Connect on demand
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {
      // Disconnect on demand
    }
  }
}
