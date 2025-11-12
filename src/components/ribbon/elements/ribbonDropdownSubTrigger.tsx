
import * as React from "react";
import { DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface RibbonDropdownItemProps
    extends React.ComponentPropsWithoutRef<typeof DropdownMenuSubTrigger> { }

export const RibbonDropdownSubTrigger = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuSubTrigger>,
    RibbonDropdownItemProps
>(function RibbonDropdownSubTrigger({ className, ...props }, ref) {
    return (
        <DropdownMenuSubTrigger
            ref={ref}
            className={cn(
                "rounded-none focus:bg-slate-700/80 focus:text-white",
                "data-[state=open]:bg-slate-700/80 data-[state=open]:text-white",
                className
            )}
            {...props}
        />
    );
});
