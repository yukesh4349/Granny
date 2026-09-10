import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('safety')
@UseGuards(JwtAuthGuard)
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('incident')
  async logIncident(
    @CurrentUser('sub') userId: string,
    @Body() body: { triggerText: string; emotion?: string; severity?: string },
  ) {
    return this.safetyService.logIncident(userId, body);
  }

  @Get('incidents')
  async getIncidents(
    @CurrentUser('sub') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.safetyService.getIncidents(userId, Number(limit) || 20);
  }

  @Post('incidents/:id/resolve')
  async resolveIncident(@Param('id') id: string) {
    return this.safetyService.resolveIncident(id);
  }
}
