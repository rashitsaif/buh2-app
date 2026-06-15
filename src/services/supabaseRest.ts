export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: AuthUser;
}

const SESSION_KEY = 'buh2-supabase-session-v1';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function baseUrl(): string {
  if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL is not set');
  return SUPABASE_URL.replace(/\/$/, '');
}

function anonKey(): string {
  if (!SUPABASE_ANON_KEY) throw new Error('VITE_SUPABASE_ANON_KEY is not set');
  return SUPABASE_ANON_KEY;
}

export function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session.access_token || !session.user?.id) return null;
    return session;
  } catch {
    return null;
  }
}

export function storeSession(session: AuthSession | null): void {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function signUp(email: string, password: string): Promise<AuthSession | null> {
  const result = await authRequest('/signup', { email, password });
  const session = normalizeSession(result);
  if (session) storeSession(session);
  return session;
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const result = await authRequest('/token?grant_type=password', { email, password });
  const session = normalizeSession(result);
  if (!session) throw new Error('Email confirmation may be required before login.');
  storeSession(session);
  return session;
}

export async function signOut(session: AuthSession | null): Promise<void> {
  if (session) {
    await fetch(`${baseUrl()}/auth/v1/logout`, {
      method: 'POST',
      headers: authHeaders(session),
    }).catch(() => undefined);
  }
  storeSession(null);
}

async function authRequest(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(`${baseUrl()}/auth/v1${path}`, {
    method: 'POST',
    headers: {
      apikey: anonKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const message = await readError(response);
    throw new Error(message || `Auth error: ${response.status}`);
  }
  return response.json();
}

export async function restGet<T>(path: string, session: AuthSession): Promise<T> {
  const response = await fetch(`${baseUrl()}/rest/v1/${path}`, { headers: restHeaders(session) });
  return parseResponse<T>(response);
}

export async function restPost<T>(path: string, session: AuthSession, body: unknown, prefer = 'return=representation'): Promise<T> {
  const response = await fetch(`${baseUrl()}/rest/v1/${path}`, {
    method: 'POST',
    headers: restHeaders(session, prefer),
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

export async function restPatch<T>(path: string, session: AuthSession, body: unknown, prefer = 'return=representation'): Promise<T> {
  const response = await fetch(`${baseUrl()}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: restHeaders(session, prefer),
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

export async function restDelete(path: string, session: AuthSession): Promise<void> {
  const response = await fetch(`${baseUrl()}/rest/v1/${path}`, { method: 'DELETE', headers: restHeaders(session) });
  if (!response.ok) throw new Error(await readError(response));
}

function authHeaders(session: AuthSession): HeadersInit {
  return { apikey: anonKey(), Authorization: `Bearer ${session.access_token}` };
}

function restHeaders(session: AuthSession, prefer?: string): HeadersInit {
  return { ...authHeaders(session), 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await readError(response));
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.msg || data.message || data.error_description || JSON.stringify(data);
  } catch {
    return response.statusText;
  }
}

function normalizeSession(value: unknown): AuthSession | null {
  const data = value as { access_token?: string; refresh_token?: string; expires_at?: number; user?: AuthUser };
  if (!data.access_token || !data.user?.id) return null;
  return { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at, user: data.user };
}
