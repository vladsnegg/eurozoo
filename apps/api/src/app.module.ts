import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { ZoosModule } from './modules/zoos/zoos.module';
import { SpeciesModule } from './modules/species/species.module';
import { GeographyModule } from './modules/geography/geography.module';
import { ConservationModule } from './modules/conservation/conservation.module';
import { ResearchModule } from './modules/research/research.module';
import { StatsModule } from './modules/stats/stats.module';
import { SourcesModule } from './modules/sources/sources.module';
import { SearchModule } from './modules/search/search.module';
import { RelatedModule } from './modules/related/related.module';
import { GraphModule } from './modules/graph/graph.module';
import { NewsModule } from './modules/news/news.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    AdminModule,
    ZoosModule,
    SpeciesModule,
    GeographyModule,
    ConservationModule,
    ResearchModule,
    StatsModule,
    SourcesModule,
    SearchModule,
    RelatedModule,
    GraphModule,
    NewsModule,
  ],
})
export class AppModule {}
