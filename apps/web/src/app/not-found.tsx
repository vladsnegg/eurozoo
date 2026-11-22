import Link from 'next/link';
import { ArrowRightIcon } from '@/components/icons';

export default function NotFound() {
  return (
    <div className="panel mx-auto mt-16 max-w-[620px] p-8">
      <span className="eyebrow">404</span>
      <h1 className="mt-4 text-3xl">Страница не найдена</h1>
      <p className="text-muted">
        Возможно, объект был переименован или ссылка устарела. Проверьте адрес или вернитесь в
        каталог.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/" className="btn btn-primary">
          На главную <ArrowRightIcon size={15} />
        </Link>
        <Link href="/zoos" className="btn btn-outline">
          К зоопаркам
        </Link>
      </div>
    </div>
  );
}
