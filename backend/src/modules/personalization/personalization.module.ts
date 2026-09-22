import { Module } from '@nestjs/common';
import { PersonalizationController } from './personalization.controller';
import { PersonalizationService } from './personalization.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PersonalizationController],
  providers: [PersonalizationService],
  exports: [PersonalizationService],
})
export class PersonalizationModule {}
