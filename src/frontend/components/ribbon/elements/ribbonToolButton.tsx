import type { ReactNode, ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { WithTooltip } from "@/frontend/components/base/withTooltip";

interface RibbonToolButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: ReactNode;
    label: string;
    shortLabel?: string;
    active?: boolean;
    tooltip?: string;
    tooltipShortcut?: string;
}

export function RibbonToolButton({
    icon,
    label,
    shortLabel,
    active = false,
    disabled = false,
    className,
    tooltip,
    tooltipShortcut,
    ...rest
}: RibbonToolButtonProps) {
    const button = (
        <button
            type="button"
            disabled={disabled}
            className={clsx(
                "flex min-w-16 h-16 flex-col items-center justify-center rounded-md px-1.5 py-1 bg-none",
                "text-[11px] leading-tight",
                "hover:bg-slate-700/80 active:bg-slate-700 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                active && "bg-sky-700/70",
                disabled ? "text-gray-700" : "text-slate-100",
                className
            )}
            {...rest}
        >
            {icon && <span className="mb-2">{icon}</span>}
            <span className="truncate">{label}</span>
            {shortLabel && (
                <span className="mt-0.5 text-[9px] text-slate-400">{shortLabel}</span>
            )}
        </button>
    );

    if (!tooltip && !tooltipShortcut) return button;

    return (
        <WithTooltip label={tooltip ?? label} shortcut={tooltipShortcut} side="bottom">
            {button}
        </WithTooltip>
    );
}
