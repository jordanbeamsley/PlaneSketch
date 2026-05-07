import { Tooltip, TooltipContent } from "@radix-ui/react-tooltip";
import React, { type ReactNode } from "react";
import { TooltipTrigger } from "../ui/tooltip";

export interface TooltipButtonProps {
    button: ReactNode
    tooltip?: string;
    tooltipShortcut?: string;
}

export const TooltipButton = React.forwardRef<
    HTMLButtonElement,
    TooltipButtonProps
>(function TooltipButton(
    {
        button,
        tooltip,
        tooltipShortcut
    }
) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="bottom" className="flex flex-col gap-0.5">
                <span>{tooltip}</span>
                <code className="mt-0.5 rounded bg-slate-800 mx-auto px-1 py-[1px] font-mono text-[10px] text-slate-300">
                    {tooltipShortcut}
                </code>
            </TooltipContent>
        </Tooltip>
    )
});
