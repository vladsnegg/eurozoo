import { Controller, Get, Inject } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(@Inject(StatsService) private readonly stats: StatsService) {}

  @Get()
  async overview() {
    return this.stats.stats();
  }

  @Get('highlights')
  async highlights() {
    return this.stats.highlights();
  }
}
