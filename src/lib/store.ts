import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cliente } from '@/types';

interface AppStore {
  clienteAtivo: Cliente | null;
  setClienteAtivo: (cliente: Cliente | null) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      clienteAtivo: null,
      setClienteAtivo: (cliente) => set({ clienteAtivo: cliente }),
    }),
    { name: 'contentai-store' }
  )
);
