export type UserRole = 'admin' | 'professor';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

export type ResourceType = 'room' | 'tablet' | 'equipment' | 'other';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  totalQuantity: number;
  description?: string;
  active: boolean;
}

export type ShiftType = 'matutino' | 'vespertino';

export interface Period {
  id: string;
  number: string;
  name: string;
  shift: ShiftType;
  startTime: string;
  endTime: string;
}

export interface Booking {
  id: string;
  resourceId: string;
  resourceName: string;
  date: string; // YYYY-MM-DD
  periodId: string;
  periodName: string;
  quantity: number;
  professorName: string;
  professorEmail: string;
  turma: string;
  justification: string;
  status: 'active' | 'completed' | 'cancelled';
  wasUsed?: boolean;
  adminNote?: string;
  createdAt: string;
}

export interface Block {
  id: string;
  resourceId: string; // 'all' or specific resourceId
  resourceName?: string;
  date: string; // YYYY-MM-DD
  periodId: string; // 'all_day' or specific periodId
  reason: string;
  createdBy: string;
  createdAt: string;
}

export const DEFAULT_PERIODS: Period[] = [
  // MATUTINO (MANHÃ) - Exactly 4 periods
  { id: 'mat-1', number: '1º', name: '1º Período (07:30 - 08:26)', shift: 'matutino', startTime: '07:30', endTime: '08:26' },
  { id: 'mat-2', number: '2º', name: '2º Período (08:26 - 09:22)', shift: 'matutino', startTime: '08:26', endTime: '09:22' },
  { id: 'mat-3', number: '3º', name: '3º Período (09:38 - 10:34)', shift: 'matutino', startTime: '09:38', endTime: '10:34' },
  { id: 'mat-4', number: '4º', name: '4º Período (10:34 - 11:30)', shift: 'matutino', startTime: '10:34', endTime: '11:30' },

  // VESPERTINO (TARDE) - Exactly 4 periods
  { id: 'vesp-1', number: '1º', name: '1º Período (13:15 - 14:11)', shift: 'vespertino', startTime: '13:15', endTime: '14:11' },
  { id: 'vesp-2', number: '2º', name: '2º Período (14:11 - 15:07)', shift: 'vespertino', startTime: '14:11', endTime: '15:07' },
  { id: 'vesp-3', number: '3º', name: '3º Período (15:23 - 16:19)', shift: 'vespertino', startTime: '15:23', endTime: '16:19' },
  { id: 'vesp-4', number: '4º', name: '4º Período (16:19 - 17:15)', shift: 'vespertino', startTime: '16:19', endTime: '17:15' },
];
