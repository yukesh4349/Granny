// ============================================================================
// Personalization Controller — REST endpoints for user preferences
// ============================================================================
import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { PersonalizationService } from './personalization.service';
import { UpdatePreferencesDto } from './personalization.dto';

@Controller('personalization')
export class PersonalizationController {
  constructor(private personalizationService: PersonalizationService) {}

  @Get(':userId')
  async getPreferences(@Param('userId') userId: string) {
    return this.personalizationService.getUserPreferences(userId);
  }

  @Put(':userId')
  async updatePreferences(
    @Param('userId') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.personalizationService.updatePreferences(userId, dto);
  }
}
