import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

type ViewportState = {
    zoomTicks: number;
}

type ViewportAction = {
    update: (ticks: number) => void;
}

export const useViewportStore = create<ViewportState & ViewportAction>()(
    subscribeWithSelector((set) => ({
        zoomTicks: 0,
        update: (ticks) => set({ zoomTicks: ticks })
    }))
)
