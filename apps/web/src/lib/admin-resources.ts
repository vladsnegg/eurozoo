export type AdminField = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  hint?: string;
};

export type AdminResource = {
  key: string;
  label: string;
  listColumns: string[];
  fields: AdminField[];
  publishable?: boolean;
};

const publishOptions = [
  { value: 'draft', label: 'черновик' },
  { value: 'review', label: 'на проверке' },
  { value: 'published', label: 'опубликовано' },
];

export const ADMIN_RESOURCES: AdminResource[] = [
  {
    key: 'zoos',
    label: 'Зоопарки',
    publishable: true,
    listColumns: ['name', 'slug', 'publishStatus', 'updatedAt', 'id'],
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'name', label: 'Название', type: 'text', required: true },
      { name: 'nameLocal', label: 'Локальное название', type: 'text' },
      {
        name: 'cityId',
        label: 'ID города',
        type: 'text',
        required: true,
        hint: 'UUID из раздела «Города»',
      },
      { name: 'foundedYear', label: 'Год основания', type: 'number' },
      { name: 'areaHa', label: 'Площадь, га', type: 'number' },
      { name: 'annualVisitors', label: 'Посетителей в год', type: 'number' },
      { name: 'website', label: 'Сайт', type: 'text' },
      { name: 'lat', label: 'Широта', type: 'number' },
      { name: 'lng', label: 'Долгота', type: 'number' },
      {
        name: 'status',
        label: 'Статус',
        type: 'select',
        options: [
          { value: 'active', label: 'действует' },
          { value: 'closed', label: 'закрыт' },
          { value: 'planned', label: 'планируется' },
        ],
      },
      { name: 'publishStatus', label: 'Публикация', type: 'select', options: publishOptions },
      { name: 'description', label: 'Описание', type: 'textarea' },
    ],
  },
  {
    key: 'taxa',
    label: 'Таксоны и виды',
    publishable: true,
    listColumns: ['scientificName', 'slug', 'rankId', 'publishStatus'],
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'scientificName', label: 'Научное название', type: 'text', required: true },
      {
        name: 'rankId',
        label: 'ID ранга',
        type: 'number',
        required: true,
        hint: '1 — царство … 7 — вид',
      },
      { name: 'parentId', label: 'ID родительского таксона', type: 'text' },
      { name: 'commonNameRu', label: 'Название (рус.)', type: 'text' },
      { name: 'commonNameEn', label: 'Название (англ.)', type: 'text' },
      { name: 'authority', label: 'Автор описания', type: 'text' },
      { name: 'yearDescribed', label: 'Год описания', type: 'number' },
      { name: 'gbifKey', label: 'GBIF key', type: 'number' },
      { name: 'publishStatus', label: 'Публикация', type: 'select', options: publishOptions },
      { name: 'description', label: 'Описание', type: 'textarea' },
    ],
  },
  {
    key: 'sources',
    label: 'Источники',
    listColumns: ['title', 'type', 'reliability', 'accessedAt'],
    fields: [
      { name: 'title', label: 'Название', type: 'text', required: true },
      { name: 'url', label: 'URL', type: 'text', required: true },
      {
        name: 'type',
        label: 'Тип',
        type: 'select',
        required: true,
        options: [
          { value: 'official_site', label: 'официальный сайт' },
          { value: 'scientific', label: 'научный' },
          { value: 'database', label: 'база данных' },
          { value: 'media', label: 'СМИ' },
          { value: 'community', label: 'сообщество' },
        ],
      },
      {
        name: 'reliability',
        label: 'Надёжность',
        type: 'select',
        required: true,
        options: [
          { value: 'official', label: 'официальная' },
          { value: 'scientific', label: 'научная' },
          { value: 'database', label: 'база данных' },
          { value: 'media', label: 'СМИ' },
          { value: 'community', label: 'сообщество' },
        ],
      },
      { name: 'publisher', label: 'Издатель', type: 'text' },
      { name: 'publishedAt', label: 'Дата публикации', type: 'date' },
      { name: 'accessedAt', label: 'Дата доступа', type: 'date', required: true },
      { name: 'license', label: 'Лицензия', type: 'text' },
    ],
  },
  {
    key: 'countries',
    label: 'Страны',
    listColumns: ['name', 'iso2', 'iso3', 'euMember'],
    fields: [
      { name: 'iso2', label: 'ISO2', type: 'text', required: true },
      { name: 'iso3', label: 'ISO3', type: 'text', required: true },
      { name: 'name', label: 'Название', type: 'text', required: true },
      { name: 'nameLocal', label: 'Локальное название', type: 'text' },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'euMember', label: 'Член ЕС', type: 'checkbox' },
    ],
  },
  {
    key: 'cities',
    label: 'Города',
    listColumns: ['name', 'slug', 'lat', 'lng'],
    fields: [
      { name: 'countryId', label: 'ID страны', type: 'text', required: true },
      { name: 'regionId', label: 'ID региона', type: 'text' },
      { name: 'name', label: 'Название', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'lat', label: 'Широта', type: 'number' },
      { name: 'lng', label: 'Долгота', type: 'number' },
      { name: 'population', label: 'Население', type: 'number' },
    ],
  },
  {
    key: 'organizations',
    label: 'Организации',
    publishable: true,
    listColumns: ['name', 'acronym', 'type', 'publishStatus'],
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'name', label: 'Название', type: 'text', required: true },
      { name: 'acronym', label: 'Аббревиатура', type: 'text' },
      {
        name: 'type',
        label: 'Тип',
        type: 'select',
        required: true,
        options: [
          { value: 'association', label: 'ассоциация' },
          { value: 'program_operator', label: 'оператор программ' },
          { value: 'conservation', label: 'природоохранная' },
          { value: 'research', label: 'исследовательская' },
          { value: 'government', label: 'государственная' },
        ],
      },
      { name: 'countryId', label: 'ID страны', type: 'text' },
      { name: 'foundedYear', label: 'Год основания', type: 'number' },
      { name: 'website', label: 'Сайт', type: 'text' },
      { name: 'publishStatus', label: 'Публикация', type: 'select', options: publishOptions },
      { name: 'description', label: 'Описание', type: 'textarea' },
    ],
  },
  {
    key: 'programs',
    label: 'Программы',
    publishable: true,
    listColumns: ['name', 'code', 'status', 'publishStatus'],
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'name', label: 'Название', type: 'text', required: true },
      {
        name: 'code',
        label: 'Тип',
        type: 'select',
        required: true,
        options: [
          { value: 'EEP', label: 'EEP' },
          { value: 'ESB', label: 'ESB' },
          { value: 'STUDBOOK', label: 'Племенная книга' },
          { value: 'OTHER', label: 'Другое' },
        ],
      },
      { name: 'organizationId', label: 'ID организации', type: 'text' },
      { name: 'startedYear', label: 'Год начала', type: 'number' },
      { name: 'endedYear', label: 'Год окончания', type: 'number' },
      {
        name: 'status',
        label: 'Статус',
        type: 'select',
        options: [
          { value: 'active', label: 'активна' },
          { value: 'completed', label: 'завершена' },
          { value: 'suspended', label: 'приостановлена' },
        ],
      },
      { name: 'publishStatus', label: 'Публикация', type: 'select', options: publishOptions },
      { name: 'description', label: 'Описание', type: 'textarea' },
    ],
  },
  {
    key: 'research',
    label: 'Исследования',
    publishable: true,
    listColumns: ['title', 'status', 'publishStatus'],
    fields: [
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'title', label: 'Название', type: 'text', required: true },
      { name: 'summary', label: 'Краткое описание', type: 'textarea' },
      { name: 'startedYear', label: 'Год начала', type: 'number' },
      { name: 'endedYear', label: 'Год окончания', type: 'number' },
      {
        name: 'status',
        label: 'Статус',
        type: 'select',
        options: [
          { value: 'active', label: 'активное' },
          { value: 'completed', label: 'завершённое' },
          { value: 'planned', label: 'запланированное' },
          { value: 'cancelled', label: 'отменённое' },
        ],
      },
      { name: 'publishStatus', label: 'Публикация', type: 'select', options: publishOptions },
      { name: 'leadOrganizationId', label: 'ID организации', type: 'text' },
    ],
  },
  {
    key: 'news',
    label: 'Новости зоопарков',
    listColumns: ['title', 'publishedAt', 'publishStatus'],
    fields: [
      {
        name: 'zooId',
        label: 'ID зоопарка',
        type: 'text',
        required: true,
        hint: 'UUID зоопарка из раздела «Зоопарки»',
      },
      { name: 'title', label: 'Заголовок', type: 'text', required: true },
      { name: 'summary', label: 'Краткое описание', type: 'textarea' },
      { name: 'url', label: 'Ссылка на новость', type: 'text', required: true },
      { name: 'sourceName', label: 'Источник', type: 'text' },
      { name: 'publishedAt', label: 'Дата публикации', type: 'date', required: true },
      { name: 'publishStatus', label: 'Публикация', type: 'select', options: publishOptions },
    ],
  },
  {
    key: 'synonyms',
    label: 'Синонимы поиска',
    listColumns: ['term', 'synonym', 'language'],
    fields: [
      { name: 'term', label: 'Термин', type: 'text', required: true },
      { name: 'synonym', label: 'Синоним', type: 'text', required: true },
      { name: 'language', label: 'Язык', type: 'text' },
      { name: 'weight', label: 'Вес', type: 'number' },
    ],
  },
];

export function adminResource(key: string): AdminResource | undefined {
  return ADMIN_RESOURCES.find((resource) => resource.key === key);
}
