import type { ReactNode } from "react";
import clsx from "clsx";

interface RibbonToolButtonProps {
    icon?: ReactNode;
    label: string;
    shortLabel?: string;          // optional 2–3 letter code
    active?: boolean;
    onClick?: () => void;
}

export function RibbonToolButton({
    icon,
    label,
    shortLabel,
    active = false,
    onClick,
}: RibbonToolButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                "flex min-w-16 h-16 flex-col items-center justify-center rounded-md px-1.5 py-1",
                "text-[11px] leading-tight text-slate-100",
                "hover:bg-slate-700/80 active:bg-slate-700 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                active && "bg-sky-700/70"
            )}
        >
            {icon && <span className="mb-2">{icon}</span>}
            <span className="truncate">{label}</span>
            {shortLabel && (
                <span className="mt-0.5 text-[9px] text-slate-400">
                    {shortLabel}
                </span>
            )}
        </button>
    );
}
