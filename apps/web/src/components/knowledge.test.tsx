import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IucnBadge, SourceBadge } from './knowledge';

describe('IucnBadge', () => {
  it('renders code and Russian label', () => {
    render(
      <IucnBadge
        iucn={{ code: 'EN', nameRu: 'Исчезающий', severity: 4, color: '#c25e00' }}
      />,
    );
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('Исчезающий')).toBeInTheDocument();
  });

  it('renders explicit unknown state when status is missing', () => {
    render(<IucnBadge iucn={null} />);
    expect(screen.getByText('статус IUCN не указан')).toBeInTheDocument();
  });
});

describe('SourceBadge', () => {
  it('exposes source details with verification date and link', () => {
    render(
      <SourceBadge
        item={{
          sourceId: '00000000-0000-0000-0000-000000000001',
          title: 'Zoo Praha — официальный сайт',
          url: 'https://www.zoopraha.cz',
          publisher: 'Zoo Praha',
          type: 'official_site',
          reliability: 'official',
          confidence: 1,
          retrievedAt: '2026-11-17',
          verifiedAt: '2026-11-17',
          status: 'current',
        }}
      />,
    );
    expect(screen.getByText('источник')).toBeInTheDocument();
    expect(screen.getByText('Проверено: 17.11.2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Открыть первоисточник' })).toHaveAttribute(
      'href',
      'https://www.zoopraha.cz',
    );
  });
});
