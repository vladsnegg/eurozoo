import { Module } from '@nestjs/common';
import { GeographyController } from './geography.controller';
import { GeographyRepository } from './geography.repository';
import { GeographyService } from './geography.service';

@Module({
  controllers: [GeographyController],
  providers: [GeographyRepository, GeographyService],
  exports: [GeographyService],
})
export class GeographyModule {}
