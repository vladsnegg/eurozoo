'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="panel mx-auto mt-16 max-w-[620px] p-8" role="alert">
      <span className="eyebrow">Ошибка</span>
      <h1 className="mt-4 text-3xl">Не удалось загрузить страницу</h1>
      <p className="text-muted">
        Произошла ошибка. Попробуйте повторить запрос. Если проблема повторяется, сообщите код
        ошибки.
      </p>
      {error.digest ? <p className="text-sm text-muted">Код: {error.digest}</p> : null}
      <button type="button" onClick={reset} className="btn btn-primary mt-2">
        Повторить
      </button>
    </div>
  );
}
