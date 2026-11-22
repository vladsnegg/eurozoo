import { Inject, Injectable } from '@nestjs/common';
import type { NewsSummaryDto, Paginated } from '@eurozoo/shared';
import { paginated } from '../../common/http/query';
import { NewsRepository } from './news.repository';

@Injectable()
export class NewsService {
  constructor(@Inject(NewsRepository) private readonly repo: NewsRepository) {}

  async list(
    zooSlug: string | undefined,
    page: number,
    pageSize: number,
  ): Promise<Paginated<NewsSummaryDto>> {
    const { rows, total } = await this.repo.list({
      zooSlug,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const items: NewsSummaryDto[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      url: row.url,
      sourceName: row.sourceName,
      publishedAt: row.publishedAt.toISOString(),
      zoo: {
        id: row.zoo.id,
        slug: row.zoo.slug,
        name: row.zoo.name,
        locationLabel: row.zoo.locationLabel,
        city: {
          name: row.zoo.city.name,
          slug: row.zoo.city.slug,
          country: {
            id: row.zoo.city.country.id,
            slug: row.zoo.city.country.slug,
            name: row.zoo.city.country.name,
            iso2: row.zoo.city.country.iso2,
          },
        },
      },
    }));

    return paginated(items, total, page, pageSize);
  }
}
