import { create } from "zustand";
import type { Passport, CanonicalItem, Achievement } from "@/types";

interface PassportStore {
  passport: Passport | null;
  items: CanonicalItem[];
  achievements: Achievement[];
  isLoading: boolean;
  setPassport: (p: Passport | null) => void;
  setItems: (items: CanonicalItem[]) => void;
  setAchievements: (a: Achievement[]) => void;
  setLoading: (v: boolean) => void;
  reset: () => void;
}

export const usePassportStore = create<PassportStore>((set) => ({
  passport: null,
  items: [],
  achievements: [],
  isLoading: false,
  setPassport: (passport) => set({ passport }),
  setItems: (items) => set({ items }),
  setAchievements: (achievements) => set({ achievements }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ passport: null, items: [], achievements: [], isLoading: false }),
}));
