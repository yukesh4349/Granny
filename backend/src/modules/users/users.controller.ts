// ============================================================================
// Users Controller — Profile & family management endpoints
// ============================================================================
import { Controller, Get, Put, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdateProfileDto, CreateFamilyGroupDto, GrantConsentDto } from './users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  @Put('me')
  async updateMe(@CurrentUser('sub') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(userId, dto);
  }

  @Put('me/profile')
  async updateMyProfile(@CurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post('family-group')
  async createFamilyGroup(@Body() dto: CreateFamilyGroupDto) {
    return this.usersService.createFamilyGroup(dto);
  }

  @Post('family-group/link')
  async linkToFamily(
    @CurrentUser('sub') userId: string,
    @Body() body: { familyGroupId: string },
  ) {
    return this.usersService.linkToFamily(userId, body.familyGroupId);
  }

  @Post('consent')
  async grantConsent(@Body() dto: GrantConsentDto) {
    return this.usersService.grantConsent(dto);
  }

  @Get('family/:familyGroupId/members')
  async getFamilyMembers(@Param('familyGroupId') familyGroupId: string) {
    return this.usersService.getFamilyMembers(familyGroupId);
  }
}
