import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CityDetailDto,
  CountryDetailDto,
  CountrySummaryDto,
  Paginated,
} from '@eurozoo/shared';
import { paginated } from '../../common/http/query';
import { GeographyRepository } from './geography.repository';

@Injectable()
export class GeographyService {
  constructor(@Inject(GeographyRepository) private readonly repo: GeographyRepository) {}

  async countries(
    page: number,
    pageSize: number,
    order: 'asc' | 'desc',
  ): Promise<Paginated<CountrySummaryDto>> {
    const { rows, total } = await this.repo.countries((page - 1) * pageSize, pageSize, order);
    return paginated(
      rows.map((row) => ({
        id: row.id,
        iso2: row.iso2,
        iso3: row.iso3,
        name: row.name,
        nameLocal: row.name_local,
        slug: row.slug,
        euMember: row.eu_member,
        zooCount: row.zoo_count,
        speciesCount: row.species_count,
      })),
      total,
      page,
      pageSize,
    );
  }

  async country(slug: string): Promise<CountryDetailDto> {
    const country = await this.repo.country(slug);
    if (!country) throw new NotFoundException(`Страна «${slug}» не найдена`);

    const [zoos, speciesCount] = await Promise.all([
      this.repo.zoosOfCountry(slug),
      this.repo.speciesCountOfCountry(slug),
    ]);

    const countryRef = {
      id: country.id,
      slug: country.slug,
      name: country.name,
      iso2: country.iso2,
    };

    return {
      id: country.id,
      iso2: country.iso2,
      iso3: country.iso3,
      name: country.name,
      nameLocal: country.nameLocal,
      slug: country.slug,
      euMember: country.euMember,
      zooCount: zoos.length,
      speciesCount,
      regions: country.regions.map((region) => ({
        id: region.id,
        name: region.name,
        slug: region.slug,
      })),
      cities: country.cities.map((city) => ({
        id: city.id,
        name: city.name,
        slug: city.slug,
        lat: city.lat,
        lng: city.lng,
        population: city.population,
        country: countryRef,
      })),
      zoos,
      organizations: country.organizations.map((org) => ({
        id: org.id,
        slug: org.slug,
        name: org.name,
      })),
    };
  }

  async city(slug: string): Promise<CityDetailDto> {
    const city = await this.repo.city(slug);
    if (!city) throw new NotFoundException(`Город «${slug}» не найден`);

    return {
      id: city.id,
      name: city.name,
      slug: city.slug,
      lat: city.lat,
      lng: city.lng,
      population: city.population,
      country: {
        id: city.country.id,
        slug: city.country.slug,
        name: city.country.name,
        iso2: city.country.iso2,
      },
      region: city.region
        ? { id: city.region.id, name: city.region.name, slug: city.region.slug }
        : null,
      zoos: city.zoos,
    };
  }
}
