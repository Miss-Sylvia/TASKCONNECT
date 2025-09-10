// state/useTaskDraft.js
import { create } from 'zustand';

/**
 * Global draft store used by PostTask, DeliveryDetails, ConfirmTask, etc.
 * Keeps data when navigating back/forward.
 */
export const useTaskDraft = create((set, get) => ({
  draft: {},
  setDraft: (patch) => set({ draft: { ...get().draft, ...patch } }),
  resetDraft: () => set({ draft: {} }),
}));
