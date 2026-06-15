import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  caption?: string;
  icon?: ReactNode;
}

export function MetricCard({ title, value, caption, icon }: MetricCardProps) {
  return (
    <article className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <strong className="mt-2 block text-2xl font-bold text-slate-950">{value}</strong>
        </div>
        {icon ? <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div> : null}
      </div>
      {caption ? <p className="text-sm leading-6 text-slate-600">{caption}</p> : null}
    </article>
  );
}
