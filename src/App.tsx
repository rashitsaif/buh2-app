import { useEffect, useMemo, useState } from 'react';
import { Layout } from './components/Layout';
import { SETTINGS_2026 } from './data/settings';
import { calcPeriods } from './lib/calc';
import { makeTasks } from './lib/tasks';
import { loadState, saveState } from './lib/storage';
import { addRemoteIncome, blankState, deleteRemoteIncome, loadRemoteState, saveRemoteProfile, setRemoteTaskStatus, updateRemoteIncomeStatus } from './services/appRepository';
import type { AuthSession } from './services/supabaseRest';
import { getStoredSession, isSupabaseConfigured, signOut } from './services/supabaseRest';
import { Assistant } from './pages/Assistant';
import { Auth } from './pages/Auth';
import { Calendar } from './pages/Calendar';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { Incomes } from './pages/Incomes';
import { Onboarding } from './pages/Onboarding';
import { Taxes } from './pages/Taxes';
import type { AppState, IncomeTransaction, PageKey, TaxStatus } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [state, setState] = useState<AppState>(() => (isSupabaseConfigured ? blankState() : loadState()));
  const [isLoading, setIsLoading] = useState(Boolean(isSupabaseConfigured && session));
  const [syncMessage, setSyncMessage] = useState('');
  const isCloudMode = Boolean(isSupabaseConfigured && session);

  useEffect(() => { if (!isSupabaseConfigured) saveState(state); }, [state]);

  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    let cancelled = false;
    setIsLoading(true);
    loadRemoteState(session)
      .then((remoteState) => { if (!cancelled) setState(remoteState); })
      .catch((error) => { if (!cancelled) setSyncMessage(error instanceof Error ? error.message : 'Ошибка загрузки данных'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [session]);

  const settings = useMemo(() => ({ ...SETTINGS_2026, usnIncomeRate: state.profile?.usnRate ?? SETTINGS_2026.usnIncomeRate }), [state.profile?.usnRate]);
  const taxResults = useMemo(() => calcPeriods(state.incomes, settings, state.profile?.initialIncomeCurrentYear ?? 0), [state.incomes, settings, state.profile?.initialIncomeCurrentYear]);
  const tasks = useMemo(() => makeTasks(taxResults, settings, state.completedTaskIds), [taxResults, settings, state.completedTaskIds]);

  async function saveProfile(profile: AppState['profile']) {
    if (!profile) return;
    try {
      const savedProfile = isCloudMode ? await saveRemoteProfile(session!, profile) : profile;
      setState((current) => ({ ...current, profile: savedProfile }));
      setActivePage('dashboard');
    } catch (error) { setSyncMessage(error instanceof Error ? error.message : 'Ошибка сохранения профиля'); }
  }

  async function addIncome(income: IncomeTransaction) {
    try {
      const savedIncome = isCloudMode ? await addRemoteIncome(session!, income) : income;
      setState((current) => ({ ...current, incomes: [savedIncome, ...current.incomes] }));
    } catch (error) { setSyncMessage(error instanceof Error ? error.message : 'Ошибка сохранения дохода'); }
  }

  async function updateIncomeStatus(id: string, taxStatus: TaxStatus) {
    try {
      if (isCloudMode) await updateRemoteIncomeStatus(session!, id, taxStatus);
      setState((current) => ({ ...current, incomes: current.incomes.map((item) => (item.id === id ? { ...item, taxStatus } : item)) }));
    } catch (error) { setSyncMessage(error instanceof Error ? error.message : 'Ошибка обновления операции'); }
  }

  async function deleteIncome(id: string) {
    try {
      if (isCloudMode) await deleteRemoteIncome(session!, id);
      setState((current) => ({ ...current, incomes: current.incomes.filter((item) => item.id !== id) }));
    } catch (error) { setSyncMessage(error instanceof Error ? error.message : 'Ошибка удаления операции'); }
  }

  async function toggleTaskDone(id: string) {
    const shouldBeDone = !state.completedTaskIds.includes(id);
    try {
      if (isCloudMode) await setRemoteTaskStatus(session!, id, shouldBeDone);
      setState((current) => ({ ...current, completedTaskIds: current.completedTaskIds.includes(id) ? current.completedTaskIds.filter((item) => item !== id) : [...current.completedTaskIds, id] }));
    } catch (error) { setSyncMessage(error instanceof Error ? error.message : 'Ошибка обновления задачи'); }
  }

  async function handleSignOut() {
    await signOut(session);
    setSession(null);
    setState(blankState());
  }

  if (isSupabaseConfigured && !session) return <Auth onSuccess={setSession} />;
  if (isLoading) return <div className="min-h-screen bg-slate-50 p-10 text-slate-700">Загружаем данные...</div>;

  return (
    <Layout activePage={activePage} onNavigate={setActivePage} authEmail={session?.user.email} isCloudMode={isCloudMode} onSignOut={isCloudMode ? handleSignOut : undefined}>
      {syncMessage ? <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{syncMessage}</div> : null}
      {activePage === 'dashboard' ? <Dashboard profile={state.profile} taxResults={taxResults} tasks={tasks} onStart={() => setActivePage('onboarding')} /> : null}
      {activePage === 'onboarding' ? <Onboarding profile={state.profile} onSave={saveProfile} /> : null}
      {activePage === 'incomes' ? <Incomes incomes={state.incomes} onAdd={addIncome} onUpdateStatus={updateIncomeStatus} onDelete={deleteIncome} /> : null}
      {activePage === 'taxes' ? <Taxes taxResults={taxResults} settings={settings} /> : null}
      {activePage === 'calendar' ? <Calendar tasks={tasks} onToggleDone={toggleTaskDone} /> : null}
      {activePage === 'documents' ? <Documents profile={state.profile} incomes={state.incomes} taxResults={taxResults} /> : null}
      {activePage === 'assistant' ? <Assistant profile={state.profile} taxResults={taxResults} tasks={tasks} /> : null}
    </Layout>
  );
}
