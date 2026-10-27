import { create } from 'zustand'

export type BreadcrumbItem = { label: string; href?: string }

type BreadcrumbStore = {
  items: BreadcrumbItem[] | null
  setItems: (items: BreadcrumbItem[]) => void
  clearItems: () => void
}

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
  items: null,
  setItems: (items) => set({ items }),
  clearItems: () => set({ items: null }),
}))
