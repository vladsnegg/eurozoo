import { Module } from '@nestjs/common';
import { SourcesModule } from '../sources/sources.module';
import { SpeciesController } from './species.controller';
import { SpeciesRepository } from './species.repository';
import { SpeciesService } from './species.service';
import { TaxonomyController } from './taxonomy.controller';

@Module({
  imports: [SourcesModule],
  controllers: [SpeciesController, TaxonomyController],
  providers: [SpeciesRepository, SpeciesService],
  exports: [SpeciesService],
})
export class SpeciesModule {}
