import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ContentPacksController } from './content-packs.controller';
import { ContentPacksService } from './content-packs.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ContentPacksController],
  providers: [ContentPacksService, JwtAuthGuard],
  exports: [ContentPacksService],
})
export class ContentPacksModule {}
