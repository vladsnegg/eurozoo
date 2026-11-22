export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'нет данных';
  return new Intl.NumberFormat('ru-RU').format(value);
}

export function formatYear(value: number | null | undefined): string {
  return value === null || value === undefined ? 'нет данных' : String(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return 'нет данных';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'нет данных';
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    date,
  );
}

export function formatRange(
  min: number | null | undefined,
  max: number | null | undefined,
  unit: string,
): string {
  if ((min === null || min === undefined) && (max === null || max === undefined)) return 'нет данных';
  if (min !== null && min !== undefined && max !== null && max !== undefined) {
    return `${formatNumber(min)}–${formatNumber(max)} ${unit}`;
  }
  return `${formatNumber(min ?? max)} ${unit}`;
}

export function formatCoord(
  lat: number | null | undefined,
  lng: number | null | undefined,
): string {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return 'координаты не указаны';
  }
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${ns} · ${Math.abs(lng).toFixed(2)}°${ew}`;
}

export const ENTITY_LABELS: Record<string, string> = {
  zoo: 'Зоопарк',
  species: 'Вид',
  taxon: 'Таксон',
  country: 'Страна',
  city: 'Город',
  program: 'Программа',
  organization: 'Организация',
  research: 'Исследование',
  event: 'Событие',
  education: 'Образование',
  facility: 'Инфраструктура',
  source: 'Источник',
};

export const PROGRAM_CODE_LABELS: Record<string, string> = {
  EEP: 'EEP',
  ESB: 'ESB',
  STUDBOOK: 'Племенная книга',
  OTHER: 'Другое',
};

export const PARTICIPATION_LABELS: Record<string, string> = {
  coordinator: 'координатор',
  participant: 'участник',
  former: 'бывший участник',
};

export const ORG_TYPE_LABELS: Record<string, string> = {
  association: 'ассоциация',
  program_operator: 'оператор программ',
  conservation: 'природоохранная',
  research: 'исследовательская',
  government: 'государственная',
};

export const AUDIENCE_LABELS: Record<string, string> = {
  children: 'дети',
  schools: 'школы',
  adults: 'взрослые',
  families: 'семьи',
  professionals: 'специалисты',
};

export const FORMAT_LABELS: Record<string, string> = {
  tour: 'экскурсия',
  workshop: 'мастер-класс',
  lecture: 'лекция',
  course: 'курс',
  exhibition: 'выставка',
};
