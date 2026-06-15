import type { TaxPeriodResult, TaxYearSettings } from '../types';
import { formatDate, formatMoney } from '../lib/format';

interface Props {
  taxResults: TaxPeriodResult[];
  settings: TaxYearSettings;
}

export function Taxes({ taxResults, settings }: Props) {
  const year = taxResults.at(-1);
  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Calculations</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">USN and contributions</h2>
        <p className="mt-3 text-slate-600">All final numbers are calculated by code.</p>
      </div>
      <div className="mb-5 grid gap-5 md:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-slate-500">Fixed contribution</p><strong className="mt-2 block text-2xl">{formatMoney(settings.fixedContribution)}</strong><p className="mt-2 text-sm text-slate-500">Due: {formatDate(settings.fixedContributionDueDate)}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Extra 1%</p><strong className="mt-2 block text-2xl">{formatMoney(year?.additionalContribution ?? 0)}</strong><p className="mt-2 text-sm text-slate-500">Max: {formatMoney(settings.additionalContributionMax)}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Deduction used</p><strong className="mt-2 block text-2xl">{formatMoney(year?.deductionApplied ?? 0)}</strong><p className="mt-2 text-sm text-slate-500">Cannot go below zero.</p></div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-600"><tr><th className="px-5 py-4">Period</th><th className="px-5 py-4">Income</th><th className="px-5 py-4">Before deduction</th><th className="px-5 py-4">Deduction</th><th className="px-5 py-4">Previous</th><th className="px-5 py-4">Current</th><th className="px-5 py-4">Due</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {taxResults.map((item) => <tr key={item.period}><td className="px-5 py-4 font-bold">{item.label}</td><td className="px-5 py-4">{formatMoney(item.incomeTotal)}</td><td className="px-5 py-4">{formatMoney(item.usnBeforeDeduction)}</td><td className="px-5 py-4">{formatMoney(item.deductionApplied)}</td><td className="px-5 py-4">{formatMoney(item.previousAccruedTax)}</td><td className="px-5 py-4 font-black">{formatMoney(item.taxToPay)}</td><td className="px-5 py-4">{formatDate(item.dueDate)}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
