import type { IncomeTransaction, OperationType, TaxStatus } from '../types';
import { formatMoney } from '../lib/format';

interface Props {
  incomes: IncomeTransaction[];
  onAdd: (income: IncomeTransaction) => void;
  onUpdateStatus: (id: string, taxStatus: TaxStatus) => void;
  onDelete: (id: string) => void;
}

export function Incomes({ incomes, onAdd, onUpdateStatus, onDelete }: Props) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const operationType = form.get('operationType') as OperationType;
    onAdd({
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

  const total = incomes.filter((x) => x.taxStatus === 'taxable').reduce((sum, x) => sum + x.amount, 0);

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Operations</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">Income</h2>
        <p className="mt-3 text-slate-600">Add operations and mark whether they are included.</p>
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
                {incomes.map((item) => <tr key={item.id}><td className="px-5 py-4">{item.date}</td><td className="px-5 py-4"><strong>{item.counterpartyName}</strong><p className="text-xs text-slate-500">{item.description}</p></td><td className="px-5 py-4 font-bold">{formatMoney(item.amount)}</td><td className="px-5 py-4"><select className="input py-2" value={item.taxStatus} onChange={(e) => onUpdateStatus(item.id, e.target.value as TaxStatus)}><option value="taxable">Include</option><option value="not_taxable">Exclude</option><option value="needs_review">Review</option></select></td><td className="px-5 py-4"><button className="font-semibold text-red-600" onClick={() => onDelete(item.id)}>Delete</button></td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
