// ============================================================================
// Memory Controller
// ============================================================================
import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { CreateMemoryDto, SearchMemoryDto } from './memory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('memory')
@UseGuards(JwtAuthGuard)
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Post()
  async create(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: CreateMemoryDto,
  ) {
    return this.memoryService.create(userId, dto, role);
  }

  @Get()
  async findAll(
    @CurrentUser('sub') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.memoryService.findAll(userId, Number(limit) || 50, Number(offset) || 0);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.memoryService.findById(id);
  }

  @Post('search')
  async search(
    @CurrentUser('sub') userId: string,
    @Body() dto: SearchMemoryDto,
  ) {
    return this.memoryService.search(userId, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.memoryService.delete(id);
  }
}
