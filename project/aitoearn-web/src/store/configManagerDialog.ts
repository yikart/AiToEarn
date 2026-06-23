import { create } from 'zustand'

export type ConfigManagerDialogSource = 'sidebar' | 'api-error' | 'manual'

interface ConfigManagerDialogState {
  open: boolean
  source?: ConfigManagerDialogSource
  openDialog: (source?: ConfigManagerDialogSource) => void
  closeDialog: () => void
}

export const useConfigManagerDialogStore = create<ConfigManagerDialogState>(set => ({
  open: false,
  source: undefined,
  openDialog: (source = 'manual') => set({ open: true, source }),
  closeDialog: () => set({ open: false, source: undefined }),
}))
