// ============================================================================
// Health Service — Medical reports & care notes management
// ============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMedicalReportDto, UpdateMedicalReportDto, CreateCareNoteDto } from './health.dto';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async getReportsByElder(elderId: string) {
    return (this.prisma as any).medicalReport.findMany({
      where: { elderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReportById(id: string) {
    const report = await (this.prisma as any).medicalReport.findUnique({
      where: { id },
    });
    if (!report) throw new NotFoundException('Medical report not found');
    return report;
  }

  async createReport(dto: CreateMedicalReportDto) {
    return (this.prisma as any).medicalReport.create({
      data: {
        elderId: dto.elderId,
        title: dto.title,
        doctorName: dto.doctorName,
        reportDate: dto.reportDate,
        category: dto.category,
        fileUrl: dto.fileUrl,
        summary: dto.summary,
        notes: dto.notes,
      },
    });
  }

  async updateReport(id: string, dto: UpdateMedicalReportDto) {
    await this.getReportById(id);
    return (this.prisma as any).medicalReport.update({
      where: { id },
      data: dto,
    });
  }

  async deleteReport(id: string) {
    await this.getReportById(id);
    return (this.prisma as any).medicalReport.delete({
      where: { id },
    });
  }

  async getCareNotes(elderId: string) {
    return (this.prisma as any).careNote.findMany({
      where: { elderId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createCareNote(dto: CreateCareNoteDto) {
    return (this.prisma as any).careNote.create({
      data: {
        elderId: dto.elderId,
        title: dto.title,
        conditionDetails: dto.conditionDetails,
        careInstructions: dto.careInstructions,
        aiGuidance: dto.aiGuidance,
      },
    });
  }
}
