import { create } from "zustand";

export const useVHLStore = create((set) => ({
    vlines: 1,
    hlines: 1,
    actions:{
        setVlines: (v) => set({ vlines: v }),
        setHlines: (h) => set({ hlines: h }),
    }
}));
