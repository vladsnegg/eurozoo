import { Module } from '@nestjs/common';
import { RelatedController } from './related.controller';
import { RelatedRepository } from './related.repository';
import { RelatedService } from './related.service';

@Module({
  controllers: [RelatedController],
  providers: [RelatedRepository, RelatedService],
  exports: [RelatedService, RelatedRepository],
})
export class RelatedModule {}
