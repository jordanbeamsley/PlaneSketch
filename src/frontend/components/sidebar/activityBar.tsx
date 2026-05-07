import clsx from "clsx";
import { Link, Spline, Variable } from "lucide-react";
import type { ReactNode } from "react";
import { WithTooltip } from "../base/withTooltip";

export type ActivityMode = "constraints" | "entities" | "variables";

type ActivityModeButton = { id: ActivityMode, icon: React.ReactNode, label: string };

const ACTIVITY_MODE_BUTTONS: ActivityModeButton[] = [
    { id: "constraints", icon: <Link />, label: "Constraints" },
    { id: "entities", icon: <Spline />, label: "Entities" },
    { id: "variables", icon: <Variable />, label: "Variables" }
];

interface ActivityBarButtonProps {
    icon: ReactNode;
    active?: boolean;

    tooltip?: string;
    tooltipShortcut?: string;
}

export function ActivityBarButton({ icon, active, tooltip, tooltipShortcut }: ActivityBarButtonProps) {
    const button = (
        <button
            type="button"
            className={clsx(
                "flex min-w-16 h-16 flex-col items-center justify-center rounded-md px-1.5 py-1 bg-none",
                "hover:bg-slate-700/80 active:bg-slate-700 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                active && "bg-sky-700/70",
            )}
        >
            {icon && <span className="mb-2">{icon}</span>}
        </button>
    );

    if (!tooltip && !tooltipShortcut) return button;

    return (
        <WithTooltip label={tooltip} shortcut={tooltipShortcut} side="bottom">
            {button}
        </WithTooltip>
    )
}

export default function ActivityBar({ activeMode, onModeChange }: { activeMode: ActivityMode; onModeChange: (m: ActivityMode) => void; }) {

    return (
        <nav aria-label="Sidebar panels" role="tablist" className="flex flex-col bg-zinc-800">
            {ACTIVITY_MODE_BUTTONS.map((activity) => (
                <ActivityBarButton
                    key={activity.id}
                    icon={activity.icon}
                    active={activeMode === activity.id}
                />
            ))}
        </nav>

    )
}
