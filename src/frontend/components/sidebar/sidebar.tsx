import { X } from "lucide-react";
import type { ActivityMode } from "./activityBar";
import { Toggle } from "@/components/ui/toggle";
import { useConstraints } from "@/frontend/context/sessionContext";
import EntitiesSidebar from "./sidebars/entitiesSidebar";

const PANEL_TITLES: Record<ActivityMode, string> = {
    constraints: "Constraints",
    entities: "Entities",
    variables: "Variables",
};

function PanelHeader({
    title,
    onClose,
}: {
    title: string;
    onClose: () => void;
}) {
    return (
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700">
            <span className="text-sm font-medium text-zinc-300">{title}</span>
            <button
                type="button"
                aria-label={`Close ${title} panel`}
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
                <X size={14} />
            </button>
        </div>
    );
}

function ConstraintsSidebar() {
    const constraints = useConstraints();

    return (
        <div className="flex flex-col">
            <Toggle>Toggle</Toggle>
            {constraints.map((c) => (
                <div key={c.id} className="px-3 py-1 text-xs text-zinc-400">
                    {c.kind}
                    {c.id}
                </div>
            ))}
        </div>
    );
}

export default function Sidebar({
    activeMode,
    onClose,
}: {
    activeMode: ActivityMode;
    onClose: () => void;
}) {
    return (
        <div className="flex flex-col h-full bg-zinc-800 overflow-hidden">
            <PanelHeader title={PANEL_TITLES[activeMode]} onClose={onClose} />
            {activeMode === "constraints" && <ConstraintsSidebar />}
            {activeMode === "entities" && <EntitiesSidebar />}
        </div>
    );
}
