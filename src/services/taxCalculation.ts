import type { TaxPeriodResult } from '../types';
import type { AuthSession } from './supabaseRest';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface EdgeCalculationResponse {
  source: 'edge';
  year: number;
  generatedAt: string;
  results: TaxPeriodResult[];
}

export async function calculateTaxOnEdge(session: AuthSession, year = 2026): Promise<EdgeCalculationResponse> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase ENV is not configured.');
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/calculate-tax`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ year }),
  });
  if (!response.ok) {
    const message = await readError(response);
    throw new Error(message || `Edge calculation failed: ${response.status}`);
  }
  return response.json();
}

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.error || data.message || JSON.stringify(data);
  } catch {
    return response.statusText;
  }
}
