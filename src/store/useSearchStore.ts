import { create } from 'zustand';

interface SearchState {
  searchQuery: string;
  debouncedQuery: string;
  isSearching: boolean;
  setSearchQuery: (query: string) => void;
  setDebouncedQuery: (query: string) => void;
  setIsSearching: (isSearching: boolean) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchQuery: '',
  debouncedQuery: '',
  isSearching: false,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setDebouncedQuery: (query) => set({ debouncedQuery: query, isSearching: false }),
  setIsSearching: (isSearching) => set({ isSearching }),
  clearSearch: () => set({ searchQuery: '', debouncedQuery: '', isSearching: false }),
}));
