import { Module } from '@nestjs/common';
import { RelatedModule } from '../related/related.module';
import { GraphController } from './graph.controller';
import { GraphRepository } from './graph.repository';
import { GraphService } from './graph.service';

@Module({
  imports: [RelatedModule],
  controllers: [GraphController],
  providers: [GraphRepository, GraphService],
})
export class GraphModule {}
