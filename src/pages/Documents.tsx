import type { IncomeTransaction, IpProfile, TaxPeriodResult } from '../types';
import { downloadTextFile, formatMoney } from '../lib/format';

interface Props {
  profile: IpProfile | null;
  incomes: IncomeTransaction[];
  taxResults: TaxPeriodResult[];
}

export function Documents({ profile, incomes, taxResults }: Props) {
  const year = taxResults.at(-1);

  function downloadIncomeReport() {
    const rows = [['Date', 'Counterparty', 'Description', 'Amount', 'Status'], ...incomes.map((x) => [x.date, x.counterpartyName, x.description, String(x.amount), x.taxStatus])];
    downloadTextFile('income-report.csv', rows.map((row) => row.map(escapeCsv).join(';')).join('\n'), 'text/csv;charset=utf-8');
  }

  function downloadDraft() {
    const content = [
      'USN draft data',
      `Name: ${profile?.ipFullName ?? ''}`,
      `INN: ${profile?.inn ?? ''}`,
      `Income: ${formatMoney(year?.incomeTotal ?? 0)}`,
      `Before deduction: ${formatMoney(year?.usnBeforeDeduction ?? 0)}`,
      `Deduction: ${formatMoney(year?.deductionApplied ?? 0)}`,
      `Current amount: ${formatMoney(year?.taxToPay ?? 0)}`,
      'Check these values before filing.',
    ].join('\n');
    downloadTextFile('usn-draft.txt', content);
  }

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Files</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">Documents</h2>
        <p className="mt-3 text-slate-600">Stage 1 has CSV and text drafts. PDF/XLSX comes next.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Income report" text="CSV with all operations and statuses." action="Download CSV" onClick={downloadIncomeReport} />
        <Card title="USN draft" text="Key values for manual review." action="Download draft" onClick={downloadDraft} />
        <Card title="Invoice" text="PDF template will be added later." action="Soon" disabled />
        <Card title="Act" text="PDF template will be added later." action="Soon" disabled />
        <Card title="KUDIR" text="XLSX export will be added later." action="Soon" disabled />
      </div>
    </section>
  );
}

function Card({ title, text, action, disabled, onClick }: { title: string; text: string; action: string; disabled?: boolean; onClick?: () => void }) {
  return <article className="card p-6"><h3 className="text-xl font-black text-slate-950">{title}</h3><p className="mt-3 min-h-16 text-sm leading-6 text-slate-600">{text}</p><button className={disabled ? 'btn-secondary mt-5 opacity-50' : 'btn-primary mt-5'} disabled={disabled} onClick={onClick}>{action}</button></article>;
}

function escapeCsv(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}
