import { Bot, CalendarDays, FileText, Home, Landmark, ListPlus, Settings } from 'lucide-react';
import type { PageKey } from '../types';

const navItems: Array<{ key: PageKey; label: string; icon: typeof Home }> = [
  { key: 'dashboard', label: 'Главная', icon: Home },
  { key: 'onboarding', label: 'Профиль ИП', icon: Settings },
  { key: 'incomes', label: 'Доходы', icon: ListPlus },
  { key: 'taxes', label: 'Налоги', icon: Landmark },
  { key: 'calendar', label: 'Календарь', icon: CalendarDays },
  { key: 'documents', label: 'Документы', icon: FileText },
  { key: 'assistant', label: 'ИИ-помощник', icon: Bot },
];

interface LayoutProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: React.ReactNode;
}

export function Layout({ activePage, onNavigate, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <div className="mb-8 rounded-3xl bg-slate-950 p-5 text-white">
          <p className="text-sm text-slate-300">MVP</p>
          <h1 className="mt-1 text-2xl font-black">Бух2</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">Кабинет для ИП на УСН «доходы» без сотрудников.</p>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            return (
              <button key={item.key} onClick={() => onNavigate(item.key)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${isActive ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          <strong className="text-xl font-black">Бух2</strong>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">MVP</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <button key={item.key} onClick={() => onNavigate(item.key)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${activePage === item.key ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {item.label}
            </button>
          ))}
        </div>
      </header>
      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
