import { useState } from "react"
import { RibbonHome } from "./RibbonHome";

export type RibbonTabId =
    | "home"
    | "draw"
    | "constraints"
    | "view";

const RIBBON_TABS: { id: RibbonTabId, label: string }[] = [
    { id: "home", label: "Home" },
    { id: "draw", label: "Draw" },
    { id: "constraints", label: "Constraints" },
    { id: "view", label: "View" }
]

export default function Ribbon() {

    const [activeTab, setActiveTab] = useState<RibbonTabId>("home");
    return (
        <div className="select-none w-screen bg-zinc-900">
            <nav className="flex w-full" role="tablist" aria-label="Ribbon tabs">
                {RIBBON_TABS.map((tab) => {
                    const isActive = tab.id === activeTab;
                    return (
                        <button
                            key={tab.id} role="tab" aria-selected={isActive} aria-controls={`ribbon-panel-${tab.id}`}
                            className={[
                                "text-sm px-4 py-1 hover:bg-zinc-800/90 transition-colors duration-200",
                                isActive ? "bg-zinc-800" : "bg-zinc-900"
                            ].join(" ")}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
            <div className="bg-zinc-800 border-b border-zinc-700 h-24 ">
                {activeTab === "home" && (
                    <RibbonHome id="ribbon-panel-home" />
                )}
            </div>
        </div >
    )
}
