import { useEffect, useMemo, useState } from 'react';
import { Layout } from './components/Layout';
import { SETTINGS_2026 } from './data/settings';
import { calcPeriods } from './lib/calc';
import { makeTasks } from './lib/tasks';
import { loadState, saveState } from './lib/storage';
import { Assistant } from './pages/Assistant';
import { Calendar } from './pages/Calendar';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { Incomes } from './pages/Incomes';
import { Onboarding } from './pages/Onboarding';
import { Taxes } from './pages/Taxes';
import type { AppState, IncomeTransaction, PageKey, TaxStatus } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const settings = useMemo(() => ({ ...SETTINGS_2026, usnIncomeRate: state.profile?.usnRate ?? SETTINGS_2026.usnIncomeRate }), [state.profile?.usnRate]);

  const taxResults = useMemo(
    () => calcPeriods(state.incomes, settings, state.profile?.initialIncomeCurrentYear ?? 0),
    [state.incomes, settings, state.profile?.initialIncomeCurrentYear],
  );

  const tasks = useMemo(
    () => makeTasks(taxResults, settings, state.completedTaskIds),
    [taxResults, settings, state.completedTaskIds],
  );

  function addIncome(income: IncomeTransaction) {
    setState((current) => ({ ...current, incomes: [income, ...current.incomes] }));
  }

  function updateIncomeStatus(id: string, taxStatus: TaxStatus) {
    setState((current) => ({ ...current, incomes: current.incomes.map((item) => (item.id === id ? { ...item, taxStatus } : item)) }));
  }

  function deleteIncome(id: string) {
    setState((current) => ({ ...current, incomes: current.incomes.filter((item) => item.id !== id) }));
  }

  function toggleTaskDone(id: string) {
    setState((current) => ({
      ...current,
      completedTaskIds: current.completedTaskIds.includes(id)
        ? current.completedTaskIds.filter((item) => item !== id)
        : [...current.completedTaskIds, id],
    }));
  }

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'dashboard' ? <Dashboard profile={state.profile} taxResults={taxResults} tasks={tasks} onStart={() => setActivePage('onboarding')} /> : null}
      {activePage === 'onboarding' ? <Onboarding profile={state.profile} onSave={(profile) => { setState((current) => ({ ...current, profile })); setActivePage('dashboard'); }} /> : null}
      {activePage === 'incomes' ? <Incomes incomes={state.incomes} onAdd={addIncome} onUpdateStatus={updateIncomeStatus} onDelete={deleteIncome} /> : null}
      {activePage === 'taxes' ? <Taxes taxResults={taxResults} settings={settings} /> : null}
      {activePage === 'calendar' ? <Calendar tasks={tasks} onToggleDone={toggleTaskDone} /> : null}
      {activePage === 'documents' ? <Documents profile={state.profile} incomes={state.incomes} taxResults={taxResults} /> : null}
      {activePage === 'assistant' ? <Assistant profile={state.profile} taxResults={taxResults} tasks={tasks} /> : null}
    </Layout>
  );
}
