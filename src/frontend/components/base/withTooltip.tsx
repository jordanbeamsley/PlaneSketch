import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/frontend/components/ui/tooltip";

interface WithTooltipProps {
    label?: string;
    shortcut?: string;
    side?: "top" | "bottom" | "left" | "right";
    children: ReactNode;
}

export function WithTooltip({ label, shortcut, side = "bottom", children }: WithTooltipProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent side={side} className="flex flex-col gap-0.5">
                <span>{label}</span>
                {shortcut && (
                    <code className="mt-0.5 rounded bg-slate-800 mx-auto px-1 py-[1px] font-mono text-[10px] text-slate-300">
                        {shortcut}
                    </code>
                )}
            </TooltipContent>
        </Tooltip>
    );
}
