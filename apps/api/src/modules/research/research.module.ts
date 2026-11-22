import { Module } from '@nestjs/common';
import { SourcesModule } from '../sources/sources.module';
import { ResearchController } from './research.controller';
import { ResearchRepository } from './research.repository';
import { ResearchService } from './research.service';

@Module({
  imports: [SourcesModule],
  controllers: [ResearchController],
  providers: [ResearchRepository, ResearchService],
})
export class ResearchModule {}
