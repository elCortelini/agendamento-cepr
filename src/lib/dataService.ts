import { Resource, Booking, Block } from './types';

const FIREBASE_BASE_URL = 'https://agendamento-cepr-default-rtdb.firebaseio.com';

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

// Helper to safely parse object/array from Firebase
function parseFirebaseData<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(Boolean);
  if (typeof data === 'object') {
    return Object.values(data).filter(Boolean) as T[];
  }
  return [];
}

export const DataService = {
  // Sync Cloud Data with Local Storage on load
  async syncCloudData(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      // Fetch Bookings from Firebase
      const resBookings = await fetch(`${FIREBASE_BASE_URL}/bookings.json`);
      if (resBookings.ok) {
        const rawBookings = await resBookings.json();
        const cloudBookings = parseFirebaseData<Booking>(rawBookings);
        if (cloudBookings.length > 0) {
          localStorage.setItem('cepr_bookings_v5', JSON.stringify(cloudBookings));
        }
      }

      // Fetch Blocks from Firebase
      const resBlocks = await fetch(`${FIREBASE_BASE_URL}/blocks.json`);
      if (resBlocks.ok) {
        const rawBlocks = await resBlocks.json();
        const cloudBlocks = parseFirebaseData<Block>(rawBlocks);
        if (cloudBlocks.length > 0) {
          localStorage.setItem('cepr_blocks_v5', JSON.stringify(cloudBlocks));
        }
      }
    } catch (e) {
      console.warn('Using local cache fallback:', e);
    }
  },

  getResources(): Resource[] {
    if (typeof window === 'undefined') return INITIAL_RESOURCES;
    try {
      const saved = localStorage.getItem('cepr_resources_v5');
      if (saved) return JSON.parse(saved);
      localStorage.setItem('cepr_resources_v5', JSON.stringify(INITIAL_RESOURCES));
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
      localStorage.setItem('cepr_resources_v5', JSON.stringify(resources));
      fetch(`${FIREBASE_BASE_URL}/resources/${newRes.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRes),
      }).catch(() => {});
    } catch (e) {}
    return newRes;
  },

  deleteResource(id: string): void {
    const resources = this.getResources().filter((r) => r.id !== id);
    try {
      localStorage.setItem('cepr_resources_v5', JSON.stringify(resources));
      fetch(`${FIREBASE_BASE_URL}/resources/${id}.json`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  },

  getBookings(date?: string, email?: string): Booking[] {
    if (typeof window === 'undefined') return [];
    let bookings: Booking[] = [];
    try {
      const keysToSearch = ['cepr_bookings_v5', 'cepr_bookings_v4', 'cepr_bookings_v3', 'cepr_bookings_v2'];
      for (const k of keysToSearch) {
        const saved = localStorage.getItem(k);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            for (const item of parsed) {
              if (!bookings.some((b) => b.id === item.id)) {
                bookings.push(item);
              }
            }
          }
        }
      }
    } catch (e) {}

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

    // If editing existing
    const existingIdx = bookings.findIndex((b) => b.id === newBooking.id);
    if (existingIdx !== -1) {
      bookings[existingIdx] = newBooking;
    } else {
      bookings.push(newBooking);
    }

    try {
      localStorage.setItem('cepr_bookings_v5', JSON.stringify(bookings));
      // Save to Firebase Cloud DB
      fetch(`${FIREBASE_BASE_URL}/bookings/${newBooking.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      }).catch(() => {});
    } catch (e) {}
    return newBooking;
  },

  deleteBooking(id: string): void {
    const bookings = this.getBookings().filter((b) => b.id !== id);
    try {
      localStorage.setItem('cepr_bookings_v5', JSON.stringify(bookings));
      // Delete from Firebase Cloud DB
      fetch(`${FIREBASE_BASE_URL}/bookings/${id}.json`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  },

  getBlocks(date?: string): Block[] {
    if (typeof window === 'undefined') return [];
    let blocks: Block[] = [];
    try {
      const keysToSearch = ['cepr_blocks_v5', 'cepr_blocks_v4', 'cepr_blocks_v3', 'cepr_blocks_v2'];
      for (const k of keysToSearch) {
        const saved = localStorage.getItem(k);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            for (const item of parsed) {
              if (!blocks.some((b) => b.id === item.id)) {
                blocks.push(item);
              }
            }
          }
        }
      }
    } catch (e) {}

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
      localStorage.setItem('cepr_blocks_v5', JSON.stringify(blocks));
      // Save to Firebase Cloud DB
      fetch(`${FIREBASE_BASE_URL}/blocks/${newBlock.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlock),
      }).catch(() => {});
    } catch (e) {}
    return newBlock;
  },

  deleteBlock(id: string): void {
    const blocks = this.getBlocks().filter((b) => b.id !== id);
    try {
      localStorage.setItem('cepr_blocks_v5', JSON.stringify(blocks));
      // Delete from Firebase Cloud DB
      fetch(`${FIREBASE_BASE_URL}/blocks/${id}.json`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  },
};
