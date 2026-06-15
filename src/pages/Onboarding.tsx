import type { IpProfile } from '../types';

interface Props {
  profile: IpProfile | null;
  onSave: (profile: IpProfile) => void;
}

export function Onboarding({ profile, onSave }: Props) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const hasEmployees = form.get('hasEmployees') === 'true';

    if (hasEmployees) {
      alert('Сейчас MVP поддерживает только ИП без сотрудников.');
      return;
    }

    onSave({
      inn: String(form.get('inn') ?? '').trim(),
      ipFullName: String(form.get('ipFullName') ?? '').trim(),
      regionCode: String(form.get('regionCode') ?? '77'),
      registrationDate: String(form.get('registrationDate') ?? ''),
      taxSystem: 'usn',
      taxObject: 'income',
      hasEmployees,
      usnRate: Number(form.get('usnRate') ?? 6),
      initialIncomeCurrentYear: Number(form.get('initialIncomeCurrentYear') ?? 0),
    });
  }

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Настройка</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">Профиль ИП</h2>
        <p className="mt-3 max-w-3xl text-slate-600">Заполните данные. Первая версия поддерживает только УСН «доходы» без сотрудников.</p>
      </div>
      <form onSubmit={handleSubmit} className="card max-w-4xl p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label><span className="label">ФИО ИП</span><input className="input" name="ipFullName" defaultValue={profile?.ipFullName ?? ''} required /></label>
          <label><span className="label">ИНН</span><input className="input" name="inn" defaultValue={profile?.inn ?? ''} required /></label>
          <label><span className="label">Регион</span><input className="input" name="regionCode" defaultValue={profile?.regionCode ?? '77'} /></label>
          <label><span className="label">Дата регистрации</span><input className="input" type="date" name="registrationDate" defaultValue={profile?.registrationDate ?? '2026-01-01'} required /></label>
          <label><span className="label">Ставка УСН, %</span><input className="input" type="number" min="1" max="6" step="0.1" name="usnRate" defaultValue={profile?.usnRate ?? 6} /></label>
          <label><span className="label">Доход с начала года</span><input className="input" type="number" min="0" step="1" name="initialIncomeCurrentYear" defaultValue={profile?.initialIncomeCurrentYear ?? 0} /></label>
          <label><span className="label">Есть сотрудники?</span><select className="input" name="hasEmployees" defaultValue={String(profile?.hasEmployees ?? false)}><option value="false">Нет</option><option value="true">Да — позже</option></select></label>
        </div>
        <button className="btn-primary mt-6" type="submit">Сохранить профиль</button>
      </form>
    </section>
  );
}
