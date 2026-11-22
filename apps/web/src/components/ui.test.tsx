import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState, Pagination } from './ui';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="Ничего не найдено" description="Сбросьте фильтры." />);
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    expect(screen.getByText('Сбросьте фильтры.')).toBeInTheDocument();
  });
});

describe('Pagination', () => {
  it('keeps filters and moves to the next page', () => {
    render(
      <Pagination
        page={1}
        pageSize={24}
        total={72}
        pathname="/zoos"
        query={{ country: 'czechia', page: undefined }}
      />,
    );
    const next = screen.getByRole('link', { name: /Вперёд/ });
    expect(next).toHaveAttribute('href', '/zoos?country=czechia&page=2');
  });

  it('hides when everything fits on one page', () => {
    const { container } = render(
      <Pagination page={1} pageSize={24} total={5} pathname="/zoos" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
