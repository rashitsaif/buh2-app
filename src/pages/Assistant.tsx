import { useState } from 'react';
import type { CalendarTask, IpProfile, TaxPeriodResult } from '../types';
import { formatDate, formatMoney } from '../lib/format';

interface Props {
  profile: IpProfile | null;
  taxResults: TaxPeriodResult[];
  tasks: CalendarTask[];
}

export function Assistant({ profile, taxResults, tasks }: Props) {
  const [question, setQuestion] = useState('Explain my current calculation');
  const [answer, setAnswer] = useState('');

  function handleAsk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnswer(makeAnswer(question, profile, taxResults, tasks));
  }

  return (
    <section>
      <div className="mb-8"><p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Helper</p><h2 className="mt-2 text-3xl font-black text-slate-950">Assistant</h2><p className="mt-3 text-slate-600">Stage 1 uses deterministic explanations.</p></div>
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <div className="card p-6"><form onSubmit={handleAsk}><label><span className="label">Question</span><textarea className="input min-h-36" value={question} onChange={(e) => setQuestion(e.target.value)} /></label><button className="btn-primary mt-5" type="submit">Explain</button></form>{answer ? <div className="mt-6 rounded-3xl bg-slate-950 p-6 text-white"><p className="whitespace-pre-line leading-7 text-slate-100">{answer}</p></div> : null}</div>
        <div className="card p-6"><h3 className="text-xl font-black text-slate-950">Rules</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600"><li>Code calculates numbers.</li><li>The helper does not edit data.</li><li>Complex cases need manual review.</li></ul></div>
      </div>
    </section>
  );
}

function makeAnswer(question: string, profile: IpProfile | null, rows: TaxPeriodResult[], tasks: CalendarTask[]): string {
  if (!profile) return 'Set up the profile first.';
  const year = rows.at(-1);
  const next = tasks.find((x) => x.status === 'soon' || x.status === 'planned' || x.status === 'overdue');
  if (question.toLowerCase().includes('date') || question.toLowerCase().includes('when')) {
    return next ? ['Next task: ' + next.title, 'Date: ' + formatDate(next.dueDate), 'Amount: ' + formatMoney(next.amount)].join('\n') : 'No urgent tasks.';
  }
  return ['Profile rate: ' + profile.usnRate + '%', 'Income: ' + formatMoney(year?.incomeTotal ?? 0), 'Before deduction: ' + formatMoney(year?.usnBeforeDeduction ?? 0), 'Deduction used: ' + formatMoney(year?.deductionApplied ?? 0), 'Current amount: ' + formatMoney(year?.taxToPay ?? 0)].join('\n');
}
