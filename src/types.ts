export type PageKey = 'dashboard' | 'onboarding' | 'incomes' | 'taxes' | 'calendar' | 'documents' | 'assistant';

export type OperationType =
  | 'income'
  | 'not_income'
  | 'refund'
  | 'personal_transfer'
  | 'bank_fee'
  | 'mistake'
  | 'other';

export type TaxStatus = 'taxable' | 'not_taxable' | 'needs_review';

export interface IpProfile {
  inn: string;
  ipFullName: string;
  regionCode: string;
  registrationDate: string;
  taxSystem: 'usn';
  taxObject: 'income';
  hasEmployees: boolean;
  usnRate: number;
  initialIncomeCurrentYear: number;
}

export interface IncomeTransaction {
  id: string;
  date: string;
  amount: number;
  counterpartyName: string;
  counterpartyInn?: string;
  description: string;
  operationType: OperationType;
  taxStatus: TaxStatus;
  comment?: string;
  createdAt: string;
}

export interface TaxYearSettings {
  year: number;
  usnIncomeRate: number;
  fixedContribution: number;
  additionalContributionRate: number;
  additionalContributionThreshold: number;
  additionalContributionMax: number;
  usnQ1DueDate: string;
  usnH1DueDate: string;
  usn9mDueDate: string;
  usnYearDueDate: string;
  usnDeclarationDueDate: string;
  fixedContributionDueDate: string;
  additionalContributionDueDate: string;
}

export interface TaxPeriodResult {
  period: 'q1' | 'h1' | 'm9' | 'year';
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
}

export interface CalendarTask {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'planned' | 'soon' | 'overdue' | 'done' | 'not_required';
  type: 'pay_usn_advance' | 'pay_usn_year' | 'pay_fixed_contribution' | 'pay_additional_contribution' | 'submit_declaration';
}

export interface AppState {
  profile: IpProfile | null;
  incomes: IncomeTransaction[];
  completedTaskIds: string[];
}
