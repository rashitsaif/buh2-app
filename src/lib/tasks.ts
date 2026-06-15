import type { CalendarTask, TaxPeriodResult, TaxYearSettings } from '../types';
import { daysUntil } from './format';

export function makeTasks(rows: TaxPeriodResult[], s: TaxYearSettings, done: string[] = []): CalendarTask[] {
  const base: CalendarTask[] = rows.map((x) => ({
    id: `pay-usn-${x.period}-${s.year}`,
    type: x.period === 'year' ? 'pay_usn_year' : 'pay_usn_advance',
    title: x.period === 'year' ? 'Итоговый УСН' : `Аванс УСН: ${x.label}`,
    description: 'Расчёт по доходам и уменьшению на взносы.',
    amount: x.taxToPay,
    dueDate: x.dueDate,
    status: status(`pay-usn-${x.period}-${s.year}`, x.dueDate, x.taxToPay, done),
  }));

  const extra = rows.at(-1)?.additionalContribution ?? 0;

  return [
    ...base,
    {
      id: `pay-fixed-${s.year}`,
      type: 'pay_fixed_contribution',
      title: 'Фиксированные взносы',
      description: 'Обязательный платёж ИП за себя.',
      amount: s.fixedContribution,
      dueDate: s.fixedContributionDueDate,
      status: status(`pay-fixed-${s.year}`, s.fixedContributionDueDate, s.fixedContribution, done),
    },
    {
      id: `pay-extra-${s.year}`,
      type: 'pay_additional_contribution',
      title: 'Дополнительный 1%',
      description: 'Считается с дохода сверх порога.',
      amount: extra,
      dueDate: s.additionalContributionDueDate,
      status: status(`pay-extra-${s.year}`, s.additionalContributionDueDate, extra, done),
    },
    {
      id: `submit-declaration-${s.year}`,
      type: 'submit_declaration',
      title: 'Декларация УСН',
      description: 'MVP готовит черновик данных.',
      amount: 0,
      dueDate: s.usnDeclarationDueDate,
      status: status(`submit-declaration-${s.year}`, s.usnDeclarationDueDate, 1, done),
    },
  ].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function status(id: string, dueDate: string, amount: number, done: string[]): CalendarTask['status'] {
  if (done.includes(id)) return 'done';
  if (amount <= 0) return 'not_required';
  const d = daysUntil(dueDate);
  if (d < 0) return 'overdue';
  if (d <= 14) return 'soon';
  return 'planned';
}
