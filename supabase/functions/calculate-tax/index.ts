type PeriodCode = 'q1' | 'h1' | 'm9' | 'year';

type DbProfile = {
  initial_income_current_year: number;
  usn_rate: number;
};

type DbIncome = {
  date: string;
  amount: number;
  tax_status: string;
};

type DbSettings = {
  year: number;
  usn_income_rate: number;
  fixed_contribution: number;
  additional_contribution_rate: number;
  additional_contribution_threshold: number;
  additional_contribution_max: number;
  usn_q1_due_date: string;
  usn_h1_due_date: string;
  usn_9m_due_date: string;
  usn_year_due_date: string;
  fixed_contribution_due_date: string;
  additional_contribution_due_date: string;
};

type Result = {
  period: PeriodCode;
  label: string;
  incomeTotal: number;
  usnBeforeDeduction: number;
  fixedContribution: number;
  additionalContribution: number;
  availableDeduction: number;
  deductionApplied: number;
  previousAccruedTax: number;
  taxToPay: number;
  dueDate: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const periods = [
  ['q1', 'Q1', 3, 'usn_q1_due_date'],
  ['h1', 'H1', 6, 'usn_h1_due_date'],
  ['m9', '9M', 9, 'usn_9m_due_date'],
  ['year', 'Year', 12, 'usn_year_due_date'],
] as const;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = requireEnv('SUPABASE_URL').replace(/\/$/, '');
    const anonKey = requireEnv('SUPABASE_ANON_KEY');
    const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const token = extractBearerToken(request.headers.get('Authorization'));
    if (!token) return json({ error: 'Authorization bearer token is required' }, 401);

    const user = await getUser(supabaseUrl, anonKey, token);
    if (!user?.id) return json({ error: 'Invalid user session' }, 401);

    const body = await safeJson(request);
    const year = Number(body?.year ?? 2026);

    const db = createRestClient(supabaseUrl, serviceKey);
    const profiles = await db.get<DbProfile[]>(`ip_profiles?select=initial_income_current_year,usn_rate&user_id=eq.${user.id}&limit=1`);
    const profile = profiles[0];
    if (!profile) return json({ error: 'IP profile is required before calculation' }, 400);

    const incomes = await db.get<DbIncome[]>(`income_transactions?select=date,amount,tax_status&user_id=eq.${user.id}&order=date.asc`);
    const settingsRows = await db.get<DbSettings[]>(`tax_year_settings?select=*&year=eq.${year}&region_code=eq.RU&limit=1`);
    const settings = settingsRows[0] ?? defaultSettings(year, Number(profile.usn_rate));
    const results = calculate(incomes, profile, settings);

    await db.delete(`tax_calculations?user_id=eq.${user.id}&year=eq.${year}`);
    await db.post('tax_calculations', results.map((item) => ({
      user_id: user.id,
      year,
      period: item.period,
      income_total: item.incomeTotal,
      usn_rate: Number(profile.usn_rate || settings.usn_income_rate),
      usn_before_deduction: item.usnBeforeDeduction,
      fixed_contribution: item.fixedContribution,
      additional_contribution: item.additionalContribution,
      deduction_applied: item.deductionApplied,
      previous_payments: item.previousAccruedTax,
      tax_to_pay: item.taxToPay,
      calculation_json: item,
    }))
      .catch((error) => console.error('tax_calculations insert failed', error));

    await db.post('audit_logs', [{
      user_id: user.id,
      action: 'calculate_tax',
      entity_type: 'tax_calculation',
      new_value: { year, periods: results.length },
    }]).catch((error) => console.error('audit insert failed', error));

    return json({ source: 'edge', year, generatedAt: new Date().toISOString(), results });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});

function calculate(incomes: DbIncome[], profile: DbProfile, settings: DbSettings): Result[] {
  let previousAccruedTax = 0;
  return periods.map(([period, label, monthEnd, dueKey]) => {
    const incomeTotal = incomeBase(incomes, Number(profile.initial_income_current_year ?? 0), monthEnd);
    const usnBeforeDeduction = roundMoney(incomeTotal * (Number(profile.usn_rate || settings.usn_income_rate) / 100));
    const additionalContribution = period === 'year' ? extraContribution(incomeTotal, settings) : 0;
    const fixedContribution = Number(settings.fixed_contribution);
    const availableDeduction = roundMoney(fixedContribution + additionalContribution);
    const deductionApplied = roundMoney(Math.min(usnBeforeDeduction, availableDeduction));
    const accrued = roundMoney(Math.max(0, usnBeforeDeduction - deductionApplied));
    const taxToPay = roundMoney(Math.max(0, accrued - previousAccruedTax));
    const result = {
      period: period as PeriodCode,
      label,
      incomeTotal,
      usnBeforeDeduction,
      fixedContribution,
      additionalContribution,
      availableDeduction,
      deductionApplied,
      previousAccruedTax,
      taxToPay,
      dueDate: String(settings[dueKey]),
    };
    previousAccruedTax = accrued;
    return result;
  });
}

function incomeBase(incomes: DbIncome[], initial: number, monthEnd: number): number {
  const current = incomes
    .filter((item) => item.tax_status === 'taxable')
    .filter((item) => new Date(item.date).getMonth() + 1 <= monthEnd)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  return roundMoney(Math.max(0, initial + current));
}

function extraContribution(incomeTotal: number, settings: DbSettings): number {
  const excess = Math.max(0, incomeTotal - Number(settings.additional_contribution_threshold));
  const calculated = excess * (Number(settings.additional_contribution_rate) / 100);
  return roundMoney(Math.min(calculated, Number(settings.additional_contribution_max)));
}

function defaultSettings(year: number, rate: number): DbSettings {
  return {
    year,
    usn_income_rate: rate || 6,
    fixed_contribution: 57390,
    additional_contribution_rate: 1,
    additional_contribution_threshold: 300000,
    additional_contribution_max: 321818,
    usn_q1_due_date: `${year}-04-28`,
    usn_h1_due_date: `${year}-07-28`,
    usn_9m_due_date: `${year}-10-28`,
    usn_year_due_date: `${year + 1}-04-28`,
    fixed_contribution_due_date: `${year}-12-28`,
    additional_contribution_due_date: `${year + 1}-07-01`,
  };
}

function createRestClient(url: string, key: string) {
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  return {
    async get<T>(path: string): Promise<T> {
      const response = await fetch(`${url}/rest/v1/${path}`, { headers });
      return parseResponse<T>(response);
    },
    async post<T>(path: string, body: unknown): Promise<T> {
      const response = await fetch(`${url}/rest/v1/${path}`, { method: 'POST', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify(body) });
      return parseResponse<T>(response);
    },
    async delete(path: string): Promise<void> {
      const response = await fetch(`${url}/rest/v1/${path}`, { method: 'DELETE', headers: { ...headers, Prefer: 'return=minimal' } });
      if (!response.ok) throw new Error(await response.text());
    },
  };
}

async function getUser(url: string, anonKey: string, token: string): Promise<{ id?: string }> {
  const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
  if (!response.ok) return {};
  return response.json();
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await response.text());
  if (response.status === 204) return undefined as T;
  return response.json();
}

async function safeJson(request: Request): Promise<Record<string, unknown> | null> {
  try { return await request.json(); } catch { return null; }
}

function extractBearerToken(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/^Bearer\s+/i, '').trim();
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function roundMoney(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
