import { useMemo, useState } from 'react';
import type { IncomeTransaction, IpProfile, TaxPeriodResult } from '../types';
import { formatMoney } from '../lib/format';
import { exportIncomeReportXlsx, exportKudirXlsx, exportUsnDraftXlsx, printAct, printInvoice, type DocumentDraftForm } from '../lib/documentExports';

interface Props {
  profile: IpProfile | null;
  incomes: IncomeTransaction[];
  taxResults: TaxPeriodResult[];
}

export function Documents({ profile, incomes, taxResults }: Props) {
  const year = taxResults.at(-1);
  const [form, setForm] = useState<DocumentDraftForm>(() => ({
    customerName: '',
    customerInn: '',
    serviceName: 'Consulting services',
    amount: year?.incomeTotal ?? 0,
    number: '1',
    date: new Date().toISOString().slice(0, 10),
  }));
  const taxableTotal = useMemo(() => incomes.filter((item) => item.taxStatus === 'taxable').reduce((sum, item) => sum + item.amount, 0), [incomes]);

  function updateField<K extends keyof DocumentDraftForm>(key: K, value: DocumentDraftForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Files</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">Documents</h2>
        <p className="mt-3 text-slate-600">Generate XLSX reports and printable commercial documents. Use browser print to save invoice or act as PDF.</p>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className="card p-6">
          <h3 className="text-xl font-black text-slate-950">Document details</h3>
          <div className="mt-5 space-y-4">
            <label><span className="label">Document number</span><input className="input" value={form.number} onChange={(e) => updateField('number', e.target.value)} /></label>
            <label><span className="label">Date</span><input className="input" type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)} /></label>
            <label><span className="label">Customer</span><input className="input" value={form.customerName} onChange={(e) => updateField('customerName', e.target.value)} placeholder="Company or person" /></label>
            <label><span className="label">Customer INN</span><input className="input" value={form.customerInn} onChange={(e) => updateField('customerInn', e.target.value)} /></label>
            <label><span className="label">Service</span><textarea className="input min-h-24" value={form.serviceName} onChange={(e) => updateField('serviceName', e.target.value)} /></label>
            <label><span className="label">Amount</span><input className="input" type="number" min="0" step="1" value={form.amount} onChange={(e) => updateField('amount', Number(e.target.value))} /></label>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Card title="Income report" text={`All operations. Taxable total: ${formatMoney(taxableTotal)}.`} action="Download XLSX" onClick={() => exportIncomeReportXlsx(profile, incomes)} />
          <Card title="KUDIR draft" text="Draft book of income records based on taxable operations." action="Download XLSX" onClick={() => exportKudirXlsx(profile, incomes)} />
          <Card title="USN draft" text="Tax periods, income base, contributions, deductions and amounts." action="Download XLSX" onClick={() => exportUsnDraftXlsx(profile, taxResults)} />
          <Card title="Invoice" text="Printable invoice draft. Save as PDF from the print dialog." action="Print / PDF" onClick={() => printInvoice(profile, form)} />
          <Card title="Act" text="Printable act draft. Save as PDF from the print dialog." action="Print / PDF" onClick={() => printAct(profile, form)} />
          <Card title="Year result" text={`Current calculated amount: ${formatMoney(year?.taxToPay ?? 0)}.`} action="Download XLSX" onClick={() => exportUsnDraftXlsx(profile, taxResults)} />
        </div>
      </div>

      {!profile ? <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">Set up the IP profile first. Documents will still generate, but seller details will be empty.</div> : null}
    </section>
  );
}

function Card({ title, text, action, onClick }: { title: string; text: string; action: string; onClick: () => void }) {
  return <article className="card p-6"><h3 className="text-xl font-black text-slate-950">{title}</h3><p className="mt-3 min-h-16 text-sm leading-6 text-slate-600">{text}</p><button className="btn-primary mt-5" onClick={onClick}>{action}</button></article>;
}
