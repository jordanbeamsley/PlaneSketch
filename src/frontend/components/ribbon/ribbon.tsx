import { useState } from "react"
import { RibbonHome } from "./tabs/ribbonHome";

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
                                "text-sm text-white px-4 py-1 hover:bg-zinc-800/70 cursor-pointer border-zinc-700",
                                isActive ? "bg-zinc-800" : "bg-zinc-900 border-b"
                            ].join(" ")}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    );
                })}
                <div className="flex grow border-b border-zinc-700" />
            </nav>
            <div className="bg-zinc-800 border-b border-zinc-700">
                {activeTab === "home" && (
                    <RibbonHome id="ribbon-panel-home" />
                )}
            </div>
        </div >
    )
}
