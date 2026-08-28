import { Resource, Booking, Block, DEFAULT_PERIODS } from './types';

const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'res-lab-inf',
    name: 'Laboratório de Informática',
    type: 'room',
    totalQuantity: 1,
    description: 'Laboratório principal equipado com 30 computadores.',
    active: true,
  },
  {
    id: 'res-lousa-1',
    name: 'TV Lousa Digital 1 (1º Andar)',
    type: 'equipment',
    totalQuantity: 1,
    description: 'Lousa digital interativa 1.',
    active: true,
  },
  {
    id: 'res-lousa-2',
    name: 'TV Lousa Digital 2 (2º Andar)',
    type: 'equipment',
    totalQuantity: 1,
    description: 'Lousa digital interativa 2.',
    active: true,
  },
  {
    id: 'res-biblioteca',
    name: 'Espaço da Biblioteca',
    type: 'room',
    totalQuantity: 1,
    description: 'Espaço da biblioteca para leitura e atividades.',
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
];

function getInitialBookings(): Booking[] {
  return [];
}

function getInitialBlocks(): Block[] {
  return [];
}

// LocalStorage Keys
const KEYS = {
  RESOURCES: 'cepr_resources_v4',
  BOOKINGS: 'cepr_bookings_v4',
  BLOCKS: 'cepr_blocks_v4',
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
