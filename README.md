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

Добавлен Supabase-слой:

- Supabase Auth через REST API без дополнительного SDK.
- Таблицы PostgreSQL для profiles, ip_profiles, income_transactions, tax_year_settings, tax_calculations, calendar_tasks, audit_logs.
- RLS-политики: пользователь видит и меняет только свои данные.
- Триггер создания профиля после регистрации пользователя.
- Сохранение профиля ИП, операций и выполненных задач в Supabase.
- Локальный fallback: если ENV Supabase не заданы, приложение работает через localStorage.

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

Применить миграцию:

```bash
supabase db push
```

Или выполнить SQL из файла:

```text
supabase/migrations/202606160001_stage2_auth_rls.sql
```

## Следующие этапы

1. Импорт банковских выписок CSV/XLSX.
2. PDF/XLSX документы.
3. Edge Functions для расчётов.
4. ИИ через backend.
5. ЮKassa и подписки.
