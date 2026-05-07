import clsx from "clsx";
import { Link, Spline, Variable } from "lucide-react";
import type { ReactNode } from "react";
import { WithTooltip } from "../base/withTooltip";

export type ActivityMode = "constraints" | "entities" | "variables";

type ActivityModeButton = {
    id: ActivityMode;
    icon: React.ReactNode;
    label: string;
};

const ACTIVITY_MODE_BUTTONS: ActivityModeButton[] = [
    { id: "constraints", icon: <Link />, label: "Constraints" },
    { id: "entities", icon: <Spline />, label: "Entities" },
    { id: "variables", icon: <Variable />, label: "Variables" },
];

interface ActivityBarButtonProps {
    icon: ReactNode;
    onClick: () => void;
    active?: boolean;

    tooltip?: string;
    tooltipShortcut?: string;
}

export function ActivityBarButton({
    icon,
    onClick,
    active,
    tooltip,
    tooltipShortcut,
}: ActivityBarButtonProps) {
    const button = (
        <div className="flex flex-row">
            <button
                type="button"
                onClick={onClick}
                className={clsx(
                    "flex flex-row justify-between bg-none rounded-md",
                    "hover:bg-slate-700/80 active:bg-slate-700 cursor-pointer text-slate-600",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                )}
            >
                {icon && (
                    <span
                        className={clsx(
                            "flex items-center justify-center w-12 h-12",
                            active && "text-slate-200",
                        )}
                    >
                        {icon}
                    </span>
                )}
            </button>
            <div
                className={clsx(
                    active && "ml-1 w-0.5 my-2 bg-sky-700 rounded-md",
                )}
            ></div>
        </div>
    );

    if (!tooltip && !tooltipShortcut) return button;

    return (
        <WithTooltip label={tooltip} shortcut={tooltipShortcut} side="right">
            {button}
        </WithTooltip>
    );
}

export default function ActivityBar({
    activeMode,
    onModeChange,
}: {
    activeMode: ActivityMode;
    onModeChange: (m: ActivityMode) => void;
}) {
    return (
        <nav
            aria-label="Sidebar panels"
            role="tablist"
            className="flex py-2 pl-1 bg-zinc-800 border-r border-zinc-700"
        >
            <div className="flex-col">
                {ACTIVITY_MODE_BUTTONS.map((activity) => (
                    <ActivityBarButton
                        key={activity.id}
                        icon={activity.icon}
                        active={activeMode === activity.id}
                        tooltip={activity.label}
                        onClick={() => onModeChange(activity.id)}
                    />
                ))}
            </div>
        </nav>
    );
}
