// ============================================================================
// Health Controller — REST endpoints for medical records and care notes
// ============================================================================
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { HealthService } from './health.service';
import { CreateMedicalReportDto, UpdateMedicalReportDto, CreateCareNoteDto } from './health.dto';

@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get('reports')
  async getReports(@Query('elderId') elderId: string) {
    return this.healthService.getReportsByElder(elderId);
  }

  @Get('reports/:id')
  async getReportById(@Param('id') id: string) {
    return this.healthService.getReportById(id);
  }

  @Post('reports')
  async createReport(@Body() dto: CreateMedicalReportDto) {
    return this.healthService.createReport(dto);
  }

  @Put('reports/:id')
  async updateReport(@Param('id') id: string, @Body() dto: UpdateMedicalReportDto) {
    return this.healthService.updateReport(id, dto);
  }

  @Delete('reports/:id')
  async deleteReport(@Param('id') id: string) {
    return this.healthService.deleteReport(id);
  }

  @Get('notes')
  async getCareNotes(@Query('elderId') elderId: string) {
    return this.healthService.getCareNotes(elderId);
  }

  @Post('notes')
  async createCareNote(@Body() dto: CreateCareNoteDto) {
    return this.healthService.createCareNote(dto);
  }
}
