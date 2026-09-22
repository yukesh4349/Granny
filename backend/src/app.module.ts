// ============================================================================
// App Module — Root module wiring all feature modules
// ============================================================================
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MemoryModule } from './modules/memory/memory.module';
import { GamesModule } from './modules/games/games.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { FamilyModule } from './modules/family/family.module';
import { SafetyModule } from './modules/safety/safety.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PersonalizationModule } from './modules/personalization/personalization.module';
import { VoiceModule } from './modules/voice/voice.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    MemoryModule,
    GamesModule,
    ConversationsModule,
    RemindersModule,
    FamilyModule,
    SafetyModule,
    HealthModule,
    NotificationsModule,
    PersonalizationModule,
    VoiceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
