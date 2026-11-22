import Link from 'next/link';
import type { ReactNode } from 'react';

export function FilterForm({
  action,
  resetHref,
  children,
  total,
}: {
  action: string;
  resetHref: string;
  children: ReactNode;
  total?: number;
}) {
  return (
    <form method="get" action={action} className="filter-panel">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      <div className="filter-actions">
        <button type="submit" className="btn btn-primary btn-sm">
          Применить
        </button>
        <Link href={resetHref} className="text-sm font-semibold text-muted hover:text-accent">
          Сбросить
        </Link>
        {typeof total === 'number' ? <span className="result-count">Найдено: {total}</span> : null}
      </div>
    </form>
  );
}

export function SelectField({
  label,
  name,
  value,
  options,
  anyLabel = 'Любой',
}: {
  label: string;
  name: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
  anyLabel?: string;
}) {
  const id = `filter-${name}`;
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} name={name} defaultValue={value ?? ''} className="select">
        <option value="">{anyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function NumberField({
  label,
  name,
  value,
  min,
  max,
  placeholder,
}: {
  label: string;
  name: string;
  value?: string;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  const id = `filter-${name}`;
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        defaultValue={value ?? ''}
        placeholder={placeholder}
        className="input"
      />
    </label>
  );
}

export function CheckboxField({
  label,
  name,
  checked,
}: {
  label: string;
  name: string;
  checked: boolean;
}) {
  const id = `filter-${name}`;
  return (
    <label
      htmlFor={id}
      className="flex min-h-[42px] cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-surface-soft px-3 py-2.5 text-sm font-medium transition hover:border-border-strong"
    >
      <input id={id} name={name} type="checkbox" value="true" defaultChecked={checked} />
      {label}
    </label>
  );
}
