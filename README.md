# buh2-app

MVP веб-приложения «Бух2»: онлайн-кабинет для ИП на УСН «доходы» без сотрудников.

## Этап 1

- Vite + React + TypeScript + Tailwind CSS.
- Профиль ИП.
- Ручной учёт доходов.
- Расчёт УСН и страховых взносов.
- Налоговый календарь.
- Заготовки документов.
- Rule-based помощник.

## Этап 2

- Supabase Auth через REST API без дополнительного SDK.
- Таблицы PostgreSQL для profiles, ip_profiles, income_transactions, tax_year_settings, tax_calculations, calendar_tasks, audit_logs.
- RLS-политики: пользователь видит и меняет только свои данные.
- Триггер создания профиля после регистрации пользователя.
- Сохранение профиля ИП, операций и выполненных задач в Supabase.
- Локальный fallback: если ENV Supabase не заданы, приложение работает через localStorage.

## Этап 3

- CSV, XLS и XLSX импорт банковских выписок.
- Автоопределение колонок date, amount, counterparty, description, inn.
- Предпросмотр операций перед сохранением.
- Массовое добавление импортированных операций.
- Таблица import_batches и связь import_batch_id с income_transactions.

## Этап 4

- income report XLSX;
- KUDIR draft XLSX;
- USN declaration draft XLSX;
- invoice print/PDF draft;
- act print/PDF draft;
- таблица documents с RLS для будущего журнала документов.

## Этап 5

Добавлен backend-расчёт налогов через Supabase Edge Function:

- `supabase/functions/calculate-tax/index.ts`;
- JWT-проверка пользователя через Supabase Auth;
- чтение `ip_profiles`, `income_transactions`, `tax_year_settings` на backend;
- расчёт УСН, фиксированных взносов, 1% и уменьшения налога;
- запись результата в `tax_calculations`;
- запись события в `audit_logs`;
- frontend вызывает Edge Function и использует локальный расчёт как fallback.

## ENV

Frontend:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Edge Function использует встроенные Supabase-переменные окружения:

```bash
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Их не нужно задавать через `supabase secrets set`: имена с префиксом `SUPABASE_` зарезервированы Supabase.

## Запуск

```bash
npm install
npm run dev
```

## Проверка

```bash
npm run build
```

## Supabase

Применить миграции:

```bash
supabase db push
```

Задеплоить функцию:

```bash
supabase functions deploy calculate-tax
```

## Следующие этапы

1. ИИ через backend.
2. ЮKassa и подписки.
3. Админ-панель.
