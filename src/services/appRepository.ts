import type { AppState, IncomeTransaction, IpProfile, TaxStatus } from '../types';
import { DEFAULT_STATE } from '../lib/storage';
import type { AuthSession } from './supabaseRest';
import { restDelete, restGet, restPatch, restPost } from './supabaseRest';

interface DbIpProfile { inn: string; ip_full_name: string; region_code: string; registration_date: string; tax_system: 'usn'; tax_object: 'income'; has_employees: boolean; usn_rate: number; initial_income_current_year: number; }
interface DbIncomeTransaction { id: string; date: string; amount: number; counterparty_name: string; counterparty_inn?: string | null; description: string; operation_type: IncomeTransaction['operationType']; tax_status: TaxStatus; import_batch_id?: string | null; comment?: string | null; created_at: string; }
interface DbCalendarTask { task_key: string; status: string; }
interface DbImportBatch { id: string; file_name: string; rows_total: number; rows_imported: number; status: string; }

export async function loadRemoteState(session: AuthSession): Promise<AppState> {
  const [profiles, incomes, tasks] = await Promise.all([
    restGet<DbIpProfile[]>('ip_profiles?select=*&limit=1', session),
    restGet<DbIncomeTransaction[]>('income_transactions?select=*&order=date.desc,created_at.desc', session),
    restGet<DbCalendarTask[]>('calendar_tasks?select=task_key,status&status=eq.done', session),
  ]);
  return { profile: profiles[0] ? fromDbProfile(profiles[0]) : null, incomes: incomes.map(fromDbIncome), completedTaskIds: tasks.map((task) => task.task_key) };
}

export async function saveRemoteProfile(session: AuthSession, profile: IpProfile): Promise<IpProfile> {
  const rows = await restPost<DbIpProfile[]>('ip_profiles?on_conflict=user_id', session, [{ user_id: session.user.id, ...toDbProfile(profile) }], 'resolution=merge-duplicates,return=representation');
  return fromDbProfile(rows[0]);
}

export async function addRemoteIncome(session: AuthSession, income: IncomeTransaction): Promise<IncomeTransaction> {
  const rows = await restPost<DbIncomeTransaction[]>('income_transactions', session, [{ user_id: session.user.id, ...toDbIncome(income) }]);
  return fromDbIncome(rows[0]);
}

export async function addRemoteIncomes(session: AuthSession, incomes: IncomeTransaction[], fileName = 'manual-import', rowsTotal = incomes.length): Promise<IncomeTransaction[]> {
  if (!incomes.length) return [];
  const batches = await restPost<DbImportBatch[]>('import_batches', session, [{ user_id: session.user.id, file_name: fileName, source: 'bank_upload', status: 'parsed', rows_total: rowsTotal, rows_imported: 0 }]);
  const batchId = batches[0]?.id;
  const rows = await restPost<DbIncomeTransaction[]>('income_transactions', session, incomes.map((income) => ({ user_id: session.user.id, import_batch_id: batchId, ...toDbIncome(income) })));
  if (batchId) await restPatch(`import_batches?id=eq.${encodeURIComponent(batchId)}`, session, { status: 'imported', rows_imported: rows.length }, 'return=minimal');
  return rows.map(fromDbIncome);
}

export async function updateRemoteIncomeStatus(session: AuthSession, id: string, taxStatus: TaxStatus): Promise<void> { await restPatch(`income_transactions?id=eq.${encodeURIComponent(id)}`, session, { tax_status: taxStatus }, 'return=minimal'); }
export async function deleteRemoteIncome(session: AuthSession, id: string): Promise<void> { await restDelete(`income_transactions?id=eq.${encodeURIComponent(id)}`, session); }
export async function setRemoteTaskStatus(session: AuthSession, taskKey: string, isDone: boolean): Promise<void> { await restPost('calendar_tasks?on_conflict=user_id,task_key', session, [{ user_id: session.user.id, task_key: taskKey, status: isDone ? 'done' : 'planned' }], 'resolution=merge-duplicates,return=minimal'); }
export function blankState(): AppState { return { ...DEFAULT_STATE, profile: null, incomes: [], completedTaskIds: [] }; }

function fromDbProfile(row: DbIpProfile): IpProfile { return { inn: row.inn, ipFullName: row.ip_full_name, regionCode: row.region_code, registrationDate: row.registration_date, taxSystem: row.tax_system, taxObject: row.tax_object, hasEmployees: row.has_employees, usnRate: Number(row.usn_rate), initialIncomeCurrentYear: Number(row.initial_income_current_year) }; }
function toDbProfile(profile: IpProfile): DbIpProfile { return { inn: profile.inn, ip_full_name: profile.ipFullName, region_code: profile.regionCode, registration_date: profile.registrationDate, tax_system: profile.taxSystem, tax_object: profile.taxObject, has_employees: profile.hasEmployees, usn_rate: profile.usnRate, initial_income_current_year: profile.initialIncomeCurrentYear }; }
function fromDbIncome(row: DbIncomeTransaction): IncomeTransaction { return { id: row.id, date: row.date, amount: Number(row.amount), counterpartyName: row.counterparty_name, counterpartyInn: row.counterparty_inn ?? undefined, description: row.description, operationType: row.operation_type, taxStatus: row.tax_status, comment: row.comment ?? undefined, createdAt: row.created_at }; }
function toDbIncome(income: IncomeTransaction): Omit<DbIncomeTransaction, 'created_at'> { return { id: income.id, date: income.date, amount: income.amount, counterparty_name: income.counterpartyName, counterparty_inn: income.counterpartyInn, description: income.description, operation_type: income.operationType, tax_status: income.taxStatus, comment: income.comment }; }
