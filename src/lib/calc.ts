import type { IncomeTransaction, TaxPeriodResult, TaxYearSettings } from '../types';

const periods = [
  ['q1', 'Q1', 3, 'usnQ1DueDate'],
  ['h1', 'H1', 6, 'usnH1DueDate'],
  ['m9', '9M', 9, 'usn9mDueDate'],
  ['year', 'Year', 12, 'usnYearDueDate'],
] as const;

export function incomeBase(items: IncomeTransaction[], initial = 0, monthEnd = 12): number {
  return Math.max(0, initial + items
    .filter((x) => x.taxStatus === 'taxable')
    .filter((x) => new Date(x.date).getMonth() + 1 <= monthEnd)
    .reduce((sum, x) => sum + x.amount, 0));
}

export function extraPart(total: number, s: TaxYearSettings): number {
  return Math.min(Math.max(0, total - s.additionalContributionThreshold) * (s.additionalContributionRate / 100), s.additionalContributionMax);
}

export function calcPeriods(items: IncomeTransaction[], s: TaxYearSettings, initial = 0): TaxPeriodResult[] {
  let prev = 0;
  return periods.map(([period, label, monthEnd, dueKey]) => {
    const incomeTotal = incomeBase(items, initial, monthEnd);
    const usnBeforeDeduction = incomeTotal * (s.usnIncomeRate / 100);
    const additionalContribution = period === 'year' ? extraPart(incomeTotal, s) : 0;
    const availableDeduction = s.fixedContribution + additionalContribution;
    const deductionApplied = Math.min(usnBeforeDeduction, availableDeduction);
    const accrued = Math.max(0, usnBeforeDeduction - deductionApplied);
    const taxToPay = Math.max(0, accrued - prev);
    const previousAccruedTax = prev;
    prev = accrued;
    return { period, label, incomeTotal, usnBeforeDeduction, fixedContribution: s.fixedContribution, additionalContribution, availableDeduction, deductionApplied, previousAccruedTax, taxToPay, dueDate: String(s[dueKey]) };
  });
}
