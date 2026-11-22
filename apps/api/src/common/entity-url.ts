export function entityUrl(type: string, slug: string): string {
  switch (type) {
    case 'zoo':
      return `/zoos/${slug}`;
    case 'species':
    case 'taxon':
      return `/species/${slug}`;
    case 'program':
      return `/programs/${slug}`;
    case 'country':
      return `/countries/${slug}`;
    case 'city':
      return `/cities/${slug}`;
    case 'organization':
      return `/organizations/${slug}`;
    case 'research':
      return `/research/${slug}`;
    case 'source':
      return '/sources';
    default:
      return '/';
  }
}
