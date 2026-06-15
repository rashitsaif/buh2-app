import type { AppState } from '../types';

const STORAGE_KEY = 'buh2-app-state-v1';

export const DEFAULT_STATE: AppState = {
  profile: null,
  incomes: [
    {
      id: crypto.randomUUID(),
      date: '2026-01-15',
      amount: 85000,
      counterpartyName: 'ООО «Пример Клиент»',
      description: 'Оплата услуг по договору №1',
      operationType: 'income',
      taxStatus: 'taxable',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      date: '2026-03-04',
      amount: 120000,
      counterpartyName: 'ИП Иванов И.И.',
      description: 'Оплата консультационных услуг',
      operationType: 'income',
      taxStatus: 'taxable',
      createdAt: new Date().toISOString(),
    },
  ],
  completedTaskIds: [],
};

export function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_STATE;
  try {
    return { ...DEFAULT_STATE, ...JSON.parse(raw) } as AppState;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
