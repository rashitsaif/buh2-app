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

Добавлен импорт банковских выписок:

- CSV, XLS и XLSX.
- Автоопределение колонок date, amount, counterparty, description, inn.
- Предпросмотр операций перед сохранением.
- Массовое добавление импортированных операций.
- Таблица import_batches и связь import_batch_id с income_transactions.
- Импорт работает локально и через Supabase.

## ENV

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

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

## Следующие этапы

1. PDF/XLSX документы.
2. Edge Functions для расчётов.
3. ИИ через backend.
4. ЮKassa и подписки.
