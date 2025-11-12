import * as React from "react";
import { cn } from "@/lib/utils";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export interface RibbonDropdownSeperatorProps
    extends React.ComponentPropsWithoutRef<typeof DropdownMenuSeparator> { }

export const RibbonDropdownSeperator = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuSeparator>,
    RibbonDropdownSeperatorProps
>(function RibbonDropdownSeperator({ className, ...props }, ref) {
    return (
        <DropdownMenuSeparator
            ref={ref}
            className={cn(
                "border-zinc-700 bg-zinc-700",
                className
            )}
            {...props}
        />
    );
});
