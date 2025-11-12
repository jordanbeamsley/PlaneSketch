import * as React from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RibbonToolButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: ReactNode;
    label: string;
    shortLabel?: string; // optional 2–3 letter code
    active?: boolean;

    tooltip?: string;
    tooltipShortcut?: string;
}

export const RibbonToolButton = React.forwardRef<
    HTMLButtonElement,
    RibbonToolButtonProps
>(function RibbonToolButton(
    {
        icon,
        label,
        shortLabel,
        active = false,
        className,
        tooltip,
        tooltipShortcut,
        ...rest },
    ref
) {
    const tooltipLabel = tooltip ?? label;
    const showTooltip = Boolean(tooltip || tooltipShortcut);

    const button = (
        <button
            ref={ref}
            type="button"
            className={clsx(
                "flex min-w-16 h-16 flex-col items-center justify-center rounded-md px-1.5 py-1 bg-none",
                "text-[11px] leading-tight text-slate-100",
                "hover:bg-slate-700/80 active:bg-slate-700 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                active && "bg-sky-700/70",
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

    if (!showTooltip) return button;

    return (
        <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="bottom" className="flex flex-col gap-0.5">
                <span>{tooltipLabel}</span>
                <code className="mt-0.5 rounded bg-slate-800 mx-auto px-1 py-[1px] font-mono text-[10px] text-slate-300">
                    {tooltipShortcut}
                </code>
            </TooltipContent>
        </Tooltip>
    );
});
