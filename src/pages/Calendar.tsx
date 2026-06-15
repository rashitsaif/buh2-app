import type { CalendarTask } from '../types';
import { daysUntil, formatDate, formatMoney } from '../lib/format';

interface Props {
  tasks: CalendarTask[];
  onToggleDone: (id: string) => void;
}

const labels: Record<CalendarTask['status'], string> = {
  planned: 'Planned',
  soon: 'Soon',
  overdue: 'Overdue',
  done: 'Done',
  not_required: 'Not required',
};

export function Calendar({ tasks, onToggleDone }: Props) {
  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Dates</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">Calendar</h2>
        <p className="mt-3 text-slate-600">Track required actions and mark them complete.</p>
      </div>
      <div className="grid gap-4">
        {tasks.map((task) => {
          const days = daysUntil(task.dueDate);
          return (
            <article key={task.id} className="card p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <div className="mb-2 flex gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{labels[task.status]}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{days >= 0 ? `${days} days` : `${Math.abs(days)} days late`}</span></div>
                  <h3 className="text-xl font-black text-slate-950">{task.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[430px]">
                  <div className="rounded-2xl bg-slate-100 p-4"><p className="text-xs font-semibold text-slate-500">Date</p><strong className="mt-1 block">{formatDate(task.dueDate)}</strong></div>
                  <div className="rounded-2xl bg-slate-100 p-4"><p className="text-xs font-semibold text-slate-500">Amount</p><strong className="mt-1 block">{formatMoney(task.amount)}</strong></div>
                  <button className="btn-secondary" onClick={() => onToggleDone(task.id)}>{task.status === 'done' ? 'Return' : 'Done'}</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
