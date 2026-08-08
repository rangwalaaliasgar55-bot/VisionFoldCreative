import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  isAuthModalOpen: boolean;
  unreadCount: number;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  setAuthModalOpen: (open: boolean) => void;
  setUnreadCount: (count: number) => void;
}

export const useStore = create<AppState>((set) => ({
  user: JSON.parse(localStorage.getItem("vf_user") || "null"),
  token: localStorage.getItem("vf_token"),
  isAuthModalOpen: false,
  unreadCount: 0,
  setUser: (user) => {
    if (user) localStorage.setItem("vf_user", JSON.stringify(user));
    else localStorage.removeItem("vf_user");
    set({ user });
  },
  setToken: (token) => {
    if (token) localStorage.setItem("vf_token", token);
    else localStorage.removeItem("vf_token");
    set({ token });
  },
  logout: () => {
    localStorage.removeItem("vf_token");
    localStorage.removeItem("vf_user");
    set({ user: null, token: null });
  },
  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
