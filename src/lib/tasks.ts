import type { CalendarTask, TaxPeriodResult, TaxYearSettings } from '../types';
import { daysUntil } from './format';

export function makeTasks(rows: TaxPeriodResult[], s: TaxYearSettings, done: string[] = []): CalendarTask[] {
  const base: CalendarTask[] = rows.map((x) => ({
    id: `a-${x.period}-${s.year}`,
    type: x.period === 'year' ? 'pay_usn_year' : 'pay_usn_advance',
    title: x.period,
    description: 'Auto task',
    amount: x.taxToPay,
    dueDate: x.dueDate,
    status: status(`a-${x.period}-${s.year}`, x.dueDate, x.taxToPay, done),
  }));

  const extra = rows.at(-1)?.additionalContribution ?? 0;
  const other: CalendarTask[] = [
    { id: `b-${s.year}`, type: 'pay_fixed_contribution', title: 'Fixed', description: 'Auto task', amount: s.fixedContribution, dueDate: s.fixedContributionDueDate, status: status(`b-${s.year}`, s.fixedContributionDueDate, s.fixedContribution, done) },
    { id: `c-${s.year}`, type: 'pay_additional_contribution', title: 'Extra', description: 'Auto task', amount: extra, dueDate: s.additionalContributionDueDate, status: status(`c-${s.year}`, s.additionalContributionDueDate, extra, done) },
    { id: `d-${s.year}`, type: 'submit_declaration', title: 'Declaration', description: 'Draft data', amount: 0, dueDate: s.usnDeclarationDueDate, status: status(`d-${s.year}`, s.usnDeclarationDueDate, 1, done) },
  ];

  return [...base, ...other].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function status(id: string, dueDate: string, amount: number, done: string[]): CalendarTask['status'] {
  if (done.includes(id)) return 'done';
  if (amount <= 0) return 'not_required';
  const d = daysUntil(dueDate);
  if (d < 0) return 'overdue';
  if (d <= 14) return 'soon';
  return 'planned';
}
