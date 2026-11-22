import { Module } from '@nestjs/common';
import { SourcesModule } from '../sources/sources.module';
import {
  ConservationService,
} from './conservation.service';
import { OrganizationsController, ProgramsController } from './conservation.controller';
import { ConservationRepository } from './conservation.repository';

@Module({
  imports: [SourcesModule],
  controllers: [ProgramsController, OrganizationsController],
  providers: [ConservationRepository, ConservationService],
  exports: [ConservationService],
})
export class ConservationModule {}
