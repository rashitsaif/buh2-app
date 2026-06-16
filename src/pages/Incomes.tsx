import { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import type { IncomeTransaction, OperationType, TaxStatus } from '../types';
import { formatMoney } from '../lib/format';
import { parseStatementFile, type StatementImportResult } from '../lib/importStatement';

interface Props {
  incomes: IncomeTransaction[];
  onAdd: (income: IncomeTransaction) => void | Promise<void>;
  onAddMany: (incomes: IncomeTransaction[], fileName?: string, rowsTotal?: number) => void | Promise<void>;
  onUpdateStatus: (id: string, taxStatus: TaxStatus) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function Incomes({ incomes, onAdd, onAddMany, onUpdateStatus, onDelete }: Props) {
  const [importResult, setImportResult] = useState<StatementImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const operationType = form.get('operationType') as OperationType;
    void onAdd({
      id: crypto.randomUUID(),
      date: String(form.get('date')),
      amount: Number(form.get('amount')),
      counterpartyName: String(form.get('counterpartyName')),
      description: String(form.get('description')),
      operationType,
      taxStatus: operationType === 'income' ? 'taxable' : 'needs_review',
      createdAt: new Date().toISOString(),
    });
    event.currentTarget.reset();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      setImportResult(await parseStatementFile(file));
    } catch (error) {
      setImportResult({ fileName: file.name, rowsTotal: 0, transactions: [], errors: [error instanceof Error ? error.message : 'Import failed.'] });
    } finally {
      setIsImporting(false);
      event.currentTarget.value = '';
    }
  }

  async function confirmImport() {
    if (!importResult?.transactions.length) return;
    await onAddMany(importResult.transactions, importResult.fileName, importResult.rowsTotal);
    setImportResult(null);
  }

  const total = incomes.filter((x) => x.taxStatus === 'taxable').reduce((sum, x) => sum + x.amount, 0);

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Operations</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">Income</h2>
        <p className="mt-3 text-slate-600">Add operations manually or import a bank statement in CSV/XLSX format.</p>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-3"><div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><UploadCloud size={22} /></div><div><h3 className="text-xl font-black text-slate-950">Import statement</h3><p className="text-sm text-slate-500">CSV, XLS or XLSX</p></div></div>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600 transition hover:border-slate-900 hover:bg-white">
            <UploadCloud className="mb-3" size={28} />
            <span className="font-bold text-slate-900">Choose bank file</span>
            <span className="mt-1">The importer detects date, amount, counterparty and description columns.</span>
            <input className="hidden" type="file" accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileChange} />
          </label>
          {isImporting ? <p className="mt-4 text-sm font-semibold text-slate-600">Parsing file...</p> : null}
          {importResult ? <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700"><strong>{importResult.fileName}</strong><p className="mt-1">Rows: {importResult.rowsTotal}. Ready: {importResult.transactions.length}. Errors: {importResult.errors.length}.</p><div className="mt-3 flex gap-2"><button className="btn-primary px-4 py-2" disabled={!importResult.transactions.length} onClick={confirmImport}>Import</button><button className="btn-secondary px-4 py-2" onClick={() => setImportResult(null)}>Cancel</button></div></div> : null}
        </div>
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 p-5"><strong>Import preview</strong></div>
          <div className="max-h-72 overflow-auto">
            {importResult ? <table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-100 text-slate-600"><tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Counterparty</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Description</th></tr></thead><tbody className="divide-y divide-slate-100">{importResult.transactions.slice(0, 20).map((item) => <tr key={item.id}><td className="px-5 py-3">{item.date}</td><td className="px-5 py-3 font-semibold">{item.counterpartyName}</td><td className="px-5 py-3 font-bold">{formatMoney(item.amount)}</td><td className="px-5 py-3 text-slate-600">{item.description}</td></tr>)}</tbody></table> : <p className="p-5 text-sm text-slate-500">Upload a file to preview imported operations before saving.</p>}
          </div>
          {importResult?.errors.length ? <div className="border-t border-amber-100 bg-amber-50 p-4 text-xs leading-5 text-amber-900">{importResult.errors.slice(0, 5).map((error) => <p key={error}>{error}</p>)}</div> : null}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <form onSubmit={handleSubmit} className="card p-6">
          <h3 className="text-xl font-black text-slate-950">Add operation</h3>
          <div className="mt-5 space-y-4">
            <label><span className="label">Date</span><input className="input" type="date" name="date" defaultValue="2026-06-01" required /></label>
            <label><span className="label">Amount</span><input className="input" type="number" min="0" step="1" name="amount" required /></label>
            <label><span className="label">Counterparty</span><input className="input" name="counterpartyName" required /></label>
            <label><span className="label">Description</span><textarea className="input min-h-24" name="description" required /></label>
            <label><span className="label">Type</span><select className="input" name="operationType" defaultValue="income"><option value="income">Income</option><option value="not_income">Not income</option><option value="refund">Refund</option><option value="personal_transfer">Personal transfer</option><option value="other">Other</option></select></label>
          </div>
          <button className="btn-primary mt-6 w-full" type="submit">Add</button>
        </form>
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 p-5"><strong>Total included: {formatMoney(total)}</strong></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-100 text-slate-600"><tr><th className="px-5 py-4">Date</th><th className="px-5 py-4">Counterparty</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {incomes.map((item) => <tr key={item.id}><td className="px-5 py-4">{item.date}</td><td className="px-5 py-4"><strong>{item.counterpartyName}</strong><p className="text-xs text-slate-500">{item.description}</p></td><td className="px-5 py-4 font-bold">{formatMoney(item.amount)}</td><td className="px-5 py-4"><select className="input py-2" value={item.taxStatus} onChange={(e) => void onUpdateStatus(item.id, e.target.value as TaxStatus)}><option value="taxable">Include</option><option value="not_taxable">Exclude</option><option value="needs_review">Review</option></select></td><td className="px-5 py-4"><button className="font-semibold text-red-600" onClick={() => void onDelete(item.id)}>Delete</button></td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
