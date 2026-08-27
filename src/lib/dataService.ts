import { Resource, Booking, Block, DEFAULT_PERIODS } from './types';

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

function getInitialBookings(): Booking[] {
  const today = new Date().toISOString().split('T')[0];
  return [
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
  ];
}

function getInitialBlocks(): Block[] {
  const today = new Date().toISOString().split('T')[0];
  return [
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
  ];
}

// LocalStorage Keys
const KEYS = {
  RESOURCES: 'cepr_resources_v2',
  BOOKINGS: 'cepr_bookings_v2',
  BLOCKS: 'cepr_blocks_v2',
};

// Client-side helper functions
export const DataService = {
  getResources(): Resource[] {
    if (typeof window === 'undefined') return INITIAL_RESOURCES;
    try {
      const saved = localStorage.getItem(KEYS.RESOURCES);
      if (saved) return JSON.parse(saved);
      localStorage.setItem(KEYS.RESOURCES, JSON.stringify(INITIAL_RESOURCES));
    } catch (e) {}
    return INITIAL_RESOURCES;
  },

  saveResource(resourceData: Omit<Resource, 'id' | 'active'> & { id?: string; active?: boolean }): Resource {
    const resources = this.getResources();
    const newRes: Resource = {
      id: resourceData.id || `res-${Date.now()}`,
      name: resourceData.name,
      type: resourceData.type,
      totalQuantity: resourceData.totalQuantity || 1,
      description: resourceData.description || '',
      active: resourceData.active !== undefined ? resourceData.active : true,
    };

    const existingIndex = resources.findIndex((r) => r.id === newRes.id);
    if (existingIndex !== -1) {
      resources[existingIndex] = newRes;
    } else {
      resources.push(newRes);
    }

    try {
      localStorage.setItem(KEYS.RESOURCES, JSON.stringify(resources));
    } catch (e) {}
    return newRes;
  },

  deleteResource(id: string): void {
    const resources = this.getResources().filter((r) => r.id !== id);
    try {
      localStorage.setItem(KEYS.RESOURCES, JSON.stringify(resources));
    } catch (e) {}
  },

  getBookings(date?: string, email?: string): Booking[] {
    if (typeof window === 'undefined') return getInitialBookings();
    let bookings: Booking[] = [];
    try {
      const saved = localStorage.getItem(KEYS.BOOKINGS);
      if (saved) {
        bookings = JSON.parse(saved);
      } else {
        bookings = getInitialBookings();
        localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
      }
    } catch (e) {
      bookings = getInitialBookings();
    }

    if (date) {
      bookings = bookings.filter((b) => b.date === date);
    }
    if (email) {
      bookings = bookings.filter((b) => b.professorEmail.toLowerCase() === email.toLowerCase());
    }
    return bookings;
  },

  saveBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'status'> & { id?: string }): Booking {
    const bookings = this.getBookings();
    const newBooking: Booking = {
      id: booking.id || `book-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...booking,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    try {
      localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
    } catch (e) {}
    return newBooking;
  },

  deleteBooking(id: string): void {
    const bookings = this.getBookings().filter((b) => b.id !== id);
    try {
      localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
    } catch (e) {}
  },

  getBlocks(date?: string): Block[] {
    if (typeof window === 'undefined') return getInitialBlocks();
    let blocks: Block[] = [];
    try {
      const saved = localStorage.getItem(KEYS.BLOCKS);
      if (saved) {
        blocks = JSON.parse(saved);
      } else {
        blocks = getInitialBlocks();
        localStorage.setItem(KEYS.BLOCKS, JSON.stringify(blocks));
      }
    } catch (e) {
      blocks = getInitialBlocks();
    }

    if (date) {
      blocks = blocks.filter((b) => b.date === date);
    }
    return blocks;
  },

  saveBlock(block: Omit<Block, 'id' | 'createdAt'>): Block {
    const blocks = this.getBlocks();
    const newBlock: Block = {
      id: `blk-${Date.now()}`,
      ...block,
      createdAt: new Date().toISOString(),
    };

    blocks.push(newBlock);
    try {
      localStorage.setItem(KEYS.BLOCKS, JSON.stringify(blocks));
    } catch (e) {}
    return newBlock;
  },

  deleteBlock(id: string): void {
    const blocks = this.getBlocks().filter((b) => b.id !== id);
    try {
      localStorage.setItem(KEYS.BLOCKS, JSON.stringify(blocks));
    } catch (e) {}
  },
};
