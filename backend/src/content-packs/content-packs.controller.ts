import { Body, Controller, Get, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';

import { ContentPacksService, CreateContentPackSchema } from './content-packs.service';
import { getAuthUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { ok } from '../common/envelope';
import { ZodPipe } from '../common/zod.pipe';

function requireAdmin(req: Request) {
  const user = getAuthUser(req);
  if (user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
  return user;
}

@Controller('content-packs')
export class ContentPacksController {
  constructor(@Inject(ContentPacksService) private readonly packs: ContentPacksService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Query('subjectId') subjectId?: string) {
    return ok(await this.packs.list(subjectId));
  }

  @Get(':id/manifest')
  @UseGuards(JwtAuthGuard)
  async manifest(@Param('id') id: string) {
    return ok(await this.packs.getManifest(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body(new ZodPipe(CreateContentPackSchema)) dto: Parameters<ContentPacksService['create']>[0],
    @Req() req: Request,
  ) {
    requireAdmin(req);
    return ok(await this.packs.create(dto));
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publish(@Param('id') id: string, @Req() req: Request) {
    requireAdmin(req);
    return ok(await this.packs.publish(id));
  }
}
