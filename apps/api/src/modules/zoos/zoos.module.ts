import { Module } from '@nestjs/common';
import { SourcesModule } from '../sources/sources.module';
import { ZoosController } from './zoos.controller';
import { ZoosRepository } from './zoos.repository';
import { ZoosService } from './zoos.service';

@Module({
  imports: [SourcesModule],
  controllers: [ZoosController],
  providers: [ZoosRepository, ZoosService],
  exports: [ZoosService],
})
export class ZoosModule {}
