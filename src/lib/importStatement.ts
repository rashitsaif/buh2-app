import * as XLSX from 'xlsx';
import type { IncomeTransaction } from '../types';

type Cell = string | number | boolean | Date | null | undefined;

export interface StatementImportResult {
  fileName: string;
  rowsTotal: number;
  transactions: IncomeTransaction[];
  errors: string[];
}

interface ColumnMap {
  date: number;
  amount: number;
  counterparty: number;
  description: number;
  inn?: number;
}

export async function parseStatementFile(file: File): Promise<StatementImportResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const rows = ext === 'xlsx' || ext === 'xls' ? await readSpreadsheet(file) : parseCsv(await file.text());
  return rowsToTransactions(file.name, rows);
}

async function readSpreadsheet(file: File): Promise<Cell[][]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, raw: false, defval: '' });
}

function parseCsv(text: string): Cell[][] {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return normalized.split('\n').filter((line) => line.trim().length > 0).map(parseCsvLine);
}

function parseCsvLine(line: string): string[] {
  const separator = line.includes(';') ? ';' : ',';
  const result: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === separator && !quoted) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function rowsToTransactions(fileName: string, rawRows: Cell[][]): StatementImportResult {
  const rows = rawRows.filter((row) => row.some((cell) => String(cell ?? '').trim().length > 0));
  const errors: string[] = [];
  if (rows.length === 0) return { fileName, rowsTotal: 0, transactions: [], errors: ['File is empty.'] };

  const hasHeader = looksLikeHeader(rows[0]);
  const header = hasHeader ? rows[0].map((cell) => String(cell ?? '')) : [];
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const map = hasHeader ? detectColumns(header) : defaultMap();

  const transactions = dataRows.flatMap((row, index) => {
    const rowNumber = index + (hasHeader ? 2 : 1);
    const date = parseDate(row[map.date]);
    const amount = parseAmount(row[map.amount]);
    const counterparty = getCell(row, map.counterparty) || 'Unknown counterparty';
    const description = getCell(row, map.description) || 'Imported bank operation';
    const inn = map.inn === undefined ? undefined : getCell(row, map.inn);

    if (!date) {
      errors.push(`Row ${rowNumber}: date was not recognized.`);
      return [];
    }
    if (!amount || amount <= 0) {
      errors.push(`Row ${rowNumber}: amount is empty or not positive.`);
      return [];
    }

    return [{
      id: crypto.randomUUID(),
      date,
      amount,
      counterpartyName: counterparty,
      counterpartyInn: inn,
      description,
      operationType: 'income',
      taxStatus: 'taxable',
      comment: `Imported from ${fileName}`,
      createdAt: new Date().toISOString(),
    } satisfies IncomeTransaction];
  });

  return { fileName, rowsTotal: dataRows.length, transactions, errors };
}

function looksLikeHeader(row: Cell[]): boolean {
  const text = row.map((cell) => normalize(String(cell ?? ''))).join(' ');
  return ['date', 'дата', 'amount', 'сумма', 'назначение', 'counterparty', 'контрагент'].some((word) => text.includes(word));
}

function detectColumns(header: string[]): ColumnMap {
  const normalized = header.map(normalize);
  return {
    date: findColumn(normalized, ['date', 'дата', 'operation date', 'posted']),
    amount: findColumn(normalized, ['amount', 'sum', 'сумма', 'credit', 'приход', 'income', 'зачисление']),
    counterparty: findColumn(normalized, ['counterparty', 'контрагент', 'payer', 'плательщик', 'name', 'организация']),
    description: findColumn(normalized, ['description', 'назначение', 'purpose', 'details', 'comment', 'payment']),
    inn: findOptionalColumn(normalized, ['inn', 'инн']),
  };
}

function defaultMap(): ColumnMap {
  return { date: 0, amount: 1, counterparty: 2, description: 3 };
}

function findColumn(headers: string[], variants: string[]): number {
  const index = findOptionalColumn(headers, variants);
  return index ?? 0;
}

function findOptionalColumn(headers: string[], variants: string[]): number | undefined {
  const index = headers.findIndex((header) => variants.some((variant) => header.includes(normalize(variant))));
  return index >= 0 ? index : undefined;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е').trim();
}

function getCell(row: Cell[], index: number): string {
  return String(row[index] ?? '').trim();
}

function parseAmount(value: Cell): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const raw = String(value ?? '').replace(/\s/g, '').replace(/[^0-9,.-]/g, '');
  if (!raw) return null;
  const normalized = raw.includes(',') && raw.lastIndexOf(',') > raw.lastIndexOf('.')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw.replace(/,/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.abs(parsed) : null;
}

function parseDate(value: Cell): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number' && value > 20000) {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  const raw = String(value ?? '').trim();
  const ru = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (ru) {
    const year = ru[3].length === 2 ? `20${ru[3]}` : ru[3];
    return `${year}-${ru[2].padStart(2, '0')}-${ru[1].padStart(2, '0')}`;
  }
  const iso = raw.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}
