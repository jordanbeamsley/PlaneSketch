import * as React from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface RibbonDropdownItemProps
    extends React.ComponentPropsWithoutRef<typeof DropdownMenuItem> { }

export const RibbonDropdownItem = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuItem>,
    RibbonDropdownItemProps
>(function RibbonDropdownItem({ className, ...props }, ref) {
    return (
        <DropdownMenuItem
            ref={ref}
            className={cn(
                "rounded-none focus:bg-slate-700/80 focus:text-white",
                className
            )}
            {...props}
        />
    );
});
