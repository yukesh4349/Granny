// ============================================================================
// Backend Entry Point — NestJS bootstrap
// ============================================================================
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Enable CORS for web, mobile, and dev clients
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('supabase.co') ||
        origin.includes('granny') ||
        origin.includes('expo')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'Prefer', 'X-Requested-With'],
  });

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Health check at root
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok', service: 'granny-backend', timestamp: new Date().toISOString() });
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🧓 Granny Backend is running on: http://localhost:${port}`);
  console.log(`📡 API base: http://localhost:${port}/api`);
  console.log(`❤️ Health: http://localhost:${port}/health`);
}
bootstrap();
