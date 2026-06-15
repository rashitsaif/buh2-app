import { CalendarClock, Landmark, WalletCards } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import type { CalendarTask, IpProfile, TaxPeriodResult } from '../types';
import { formatDate, formatMoney } from '../lib/format';

interface Props {
  profile: IpProfile | null;
  taxResults: TaxPeriodResult[];
  tasks: CalendarTask[];
  onStart: () => void;
}

export function Dashboard({ profile, taxResults, tasks, onStart }: Props) {
  const year = taxResults.at(-1);
  const nextTask = tasks.find((task) => task.status === 'soon' || task.status === 'planned' || task.status === 'overdue');

  if (!profile) {
    return (
      <section className="card p-8 lg:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">MVP</p>
        <h2 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-slate-950 lg:text-6xl">Buh2 dashboard</h2>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Start with the profile setup.</p>
        <button onClick={onStart} className="btn-primary mt-8">Setup profile</button>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">{profile.ipFullName || 'Profile'}</h2>
          <p className="mt-2 text-slate-600">Rate {profile.usnRate}% · no employees</p>
        </div>
        <button onClick={onStart} className="btn-secondary">Edit profile</button>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Income" value={formatMoney(year?.incomeTotal ?? 0)} caption="Included operations." icon={<WalletCards size={22} />} />
        <MetricCard title="Base amount" value={formatMoney(year?.usnBeforeDeduction ?? 0)} caption="Calculated from the profile rate." icon={<Landmark size={22} />} />
        <MetricCard title="Current amount" value={formatMoney(year?.taxToPay ?? 0)} caption="After deductions." icon={<Landmark size={22} />} />
        <MetricCard title="Next date" value={nextTask ? formatDate(nextTask.dueDate) : '—'} caption={nextTask?.title ?? 'No urgent tasks.'} icon={<CalendarClock size={22} />} />
      </div>
    </section>
  );
}
