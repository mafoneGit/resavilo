# Resavilo

Веб-приложение Resavilo на Next.js, React и TypeScript.

## Запуск

Требуется Node.js 20+ и pnpm.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Приложение доступно по адресу http://localhost:3000.

## Production

```sh
pnpm build
pnpm start
```

## Структура

- `app/` — страницы, layout и глобальные стили Next.js.
- `components/` — компоненты интерфейса.
- `hooks/` — React hooks.
- `lib/` — вспомогательные функции.
- `public/` — публичные изображения и иконки.
- `styles/` — дополнительные стили из исходного шаблона.
- `assets/brand/` — оригинал логотипа.
- `archive/` — исходный архив приложения.

## Git

Основная ветка — `master`. Для отдельных задач используйте ветки `feature/<name>` или `fix/<name>`.

Локальные `.env` файлы, зависимости и результаты сборки исключены через `.gitignore`. Секреты не следует добавлять в репозиторий.
