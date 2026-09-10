// ============================================================================
// Games Controller
// ============================================================================
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { GamesService } from './games.service';
import { StartSessionDto, SubmitAttemptDto, EndSessionDto } from './games.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('catalog')
  async getCatalog() {
    return this.gamesService.getGameCatalog();
  }

  @Post('session/start')
  async startSession(
    @CurrentUser('sub') userId: string,
    @Body() dto: StartSessionDto,
  ) {
    return this.gamesService.startSession(userId, dto);
  }

  @Post('session/attempt')
  async submitAttempt(@Body() dto: SubmitAttemptDto) {
    return this.gamesService.submitAttempt(dto);
  }

  @Post('session/end')
  async endSession(@Body() dto: EndSessionDto) {
    return this.gamesService.endSession(dto);
  }

  @Get('sessions')
  async getUserSessions(
    @CurrentUser('sub') userId: string,
    @Query('gameKey') gameKey?: string,
    @Query('limit') limit?: string,
  ) {
    return this.gamesService.getUserSessions(userId, gameKey, Number(limit) || 20);
  }

  @Get('session/:id')
  async getSession(@Param('id') id: string) {
    return this.gamesService.getSessionById(id);
  }
}
