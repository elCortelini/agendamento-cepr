import fs from 'fs';
import path from 'path';
import { Resource, Booking, Block, User } from './types';

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

export interface DBData {
  resources: Resource[];
  bookings: Booking[];
  blocks: Block[];
  users: User[];
}

const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'res-lab-inf',
    name: 'Laboratório de Informática',
    type: 'room',
    totalQuantity: 1,
    description: 'Laboratório principal com 30 computadores.',
    active: true,
  },
  {
    id: 'res-carrinho-tablets-a',
    name: 'Carrinho de Chromebooks',
    type: 'tablet',
    totalQuantity: 30,
    description: 'Carrinho móvel contendo 30 Chromebooks.',
    active: true,
  },
  {
    id: 'res-sala-video',
    name: 'Sala de Vídeo / Multimídia',
    type: 'room',
    totalQuantity: 1,
    description: 'Sala climatizada com data show.',
    active: true,
  },
  {
    id: 'res-projetor-movel',
    name: 'Projetor Móvel',
    type: 'equipment',
    totalQuantity: 3,
    description: 'Kit móvel contendo Projetor + Caixa de som.',
    active: true,
  },
];

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'Administrador Pedro Rizzi',
    email: 'admin@pedrorizzi.edu.br',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    role: 'admin',
  },
  {
    id: 'usr-prof-1',
    name: 'Soraya Luiza de Barros',
    email: 'soraya.barros@pedrorizzi.edu.br',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    role: 'professor',
  },
  {
    id: 'usr-prof-2',
    name: 'André Luiz Dalsochio Gomes',
    email: 'andre.gomes@pedrorizzi.edu.br',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'professor',
  },
  {
    id: 'usr-prof-3',
    name: 'Elevi Cortolini',
    email: 'elevi.cortolini@pedrorizzi.edu.br',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'professor',
  },
];

function getInitialData(): DBData {
  const today = new Date().toISOString().split('T')[0];
  return {
    resources: INITIAL_RESOURCES,
    users: INITIAL_USERS,
    bookings: [
      {
        id: 'book-1',
        resourceId: 'res-lab-inf',
        resourceName: 'Laboratório de Informática',
        date: today,
        periodId: 'mat-4',
        periodName: '4º Período (10:34 - 11:30)',
        quantity: 1,
        professorName: 'SORAYA LUIZA DE BARROS',
        professorEmail: 'soraya.barros@pedrorizzi.edu.br',
        turma: '5º Ano A',
        justification: 'Atividade pedagógica de Informática.',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'book-2',
        resourceId: 'res-carrinho-tablets-a',
        resourceName: 'Carrinho de Chromebooks',
        date: today,
        periodId: 'mat-2',
        periodName: '2º Período (08:26 - 09:22)',
        quantity: 15,
        professorName: 'ANDRÉ LUIZ DALSOCHIO GOMES',
        professorEmail: 'andre.gomes@pedrorizzi.edu.br',
        turma: '8º Ano B',
        justification: 'Pesquisa escolar no Khan Academy.',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'book-3',
        resourceId: 'res-sala-video',
        resourceName: 'Sala de Vídeo / Multimídia',
        date: today,
        periodId: 'mat-4',
        periodName: '4º Período (10:34 - 11:30)',
        quantity: 1,
        professorName: 'PROERD - 501',
        professorEmail: 'proerd@pedrorizzi.edu.br',
        turma: '501',
        justification: 'Apresentação do Programa PROERD.',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ],
    blocks: [
      {
        id: 'blk-1',
        resourceId: 'all',
        resourceName: 'Todos os Recursos',
        date: today,
        periodId: 'mat-1',
        reason: 'Pré-Conselho',
        createdBy: 'admin@pedrorizzi.edu.br',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'blk-2',
        resourceId: 'all',
        resourceName: 'Todos os Recursos',
        date: today,
        periodId: 'mat-2',
        reason: 'Pré-Conselho',
        createdBy: 'admin@pedrorizzi.edu.br',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'blk-3',
        resourceId: 'all',
        resourceName: 'Todos os Recursos',
        date: today,
        periodId: 'mat-3',
        reason: 'Pré-Conselho',
        createdBy: 'admin@pedrorizzi.edu.br',
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function readDB(): DBData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const data = getInitialData();
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return data;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      resources: parsed.resources || INITIAL_RESOURCES,
      users: parsed.users || INITIAL_USERS,
      bookings: parsed.bookings || [],
      blocks: parsed.blocks || [],
    };
  } catch (error) {
    console.error('Error reading DB:', error);
    return getInitialData();
  }
}

export function writeDB(data: DBData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

export function getResourceAvailability(
  resourceId: string,
  date: string,
  periodId: string
): { availableQuantity: number; totalQuantity: number; isBlocked: boolean; blockReason?: string } {
  const db = readDB();
  const resource = db.resources.find((r) => r.id === resourceId);

  if (!resource || !resource.active) {
    return { availableQuantity: 0, totalQuantity: 0, isBlocked: true, blockReason: 'Recurso inativo ou inexistente.' };
  }

  const block = db.blocks.find(
    (b) =>
      b.date === date &&
      (b.resourceId === 'all' || b.resourceId === resourceId) &&
      (b.periodId === 'all_day' || b.periodId === periodId)
  );

  if (block) {
    return {
      availableQuantity: 0,
      totalQuantity: resource.totalQuantity,
      isBlocked: true,
      blockReason: block.reason,
    };
  }

  const reservedSum = db.bookings
    .filter((b) => b.resourceId === resourceId && b.date === date && b.periodId === periodId && b.status === 'active')
    .reduce((sum, b) => sum + b.quantity, 0);

  const available = Math.max(0, resource.totalQuantity - reservedSum);

  return {
    availableQuantity: available,
    totalQuantity: resource.totalQuantity,
    isBlocked: false,
  };
}
