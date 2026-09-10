import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { FamilyService } from './family.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('family')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Get('dashboard/:elderId')
  @Roles('CAREGIVER')
  async getDashboard(
    @CurrentUser('sub') caregiverId: string,
    @Param('elderId') elderId: string,
  ) {
    return this.familyService.getDashboard(caregiverId, elderId);
  }

  @Get('adherence/:elderId')
  @Roles('CAREGIVER')
  async getAdherence(@Param('elderId') elderId: string) {
    return this.familyService.getAdherence(elderId);
  }

  @Get('mood/:elderId')
  @Roles('CAREGIVER')
  async getMoodTrend(
    @Param('elderId') elderId: string,
    @Query('days') days?: string,
  ) {
    return this.familyService.getMoodTrend(elderId, Number(days) || 7);
  }

  @Get('games/:elderId')
  @Roles('CAREGIVER')
  async getGamePerformance(
    @Param('elderId') elderId: string,
    @Query('limit') limit?: string,
  ) {
    return this.familyService.getGamePerformance(elderId, Number(limit) || 10);
  }

  @Get('incidents/:elderId')
  @Roles('CAREGIVER')
  async getIncidents(
    @Param('elderId') elderId: string,
    @Query('limit') limit?: string,
  ) {
    return this.familyService.getIncidents(elderId, Number(limit) || 10);
  }
}
