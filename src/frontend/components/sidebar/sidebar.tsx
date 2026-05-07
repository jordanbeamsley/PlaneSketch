import { useState } from "react";
import type { ActivityMode } from "./activityBar";
import ActivityBar from "./activityBar";
import { X } from "lucide-react";

function PanelHeader({
    title,
    panelId,
    onClose,
}: {
    title: string;
    panelId: string;
    onClose: () => void;
}) {
    return (
        <div className="flex justify-between">
            <span
                id={panelId}
                className="inline-flex items-center text-zinc-400"
            >
                {title}
            </span>
            <button aria-label={`Close ${title} panel`} onClick={onClose}>
                <X />
            </button>
        </div>
    );
}

export default function Sidebar() {
    const [activeMode, setActiveMode] = useState<ActivityMode>("entities");
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-full">
            <ActivityBar
                activeMode={activeMode}
                onModeChange={(m) => setActiveMode(m)}
            />
            {sidebarOpen && (
                <div className="w-60 bg-zinc-800">
                    <PanelHeader title="constaints" />
                </div>
            )}
        </div>
    );
}
