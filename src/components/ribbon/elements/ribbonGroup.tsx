import { DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DropdownMenu, DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

interface RibbonGroupProps {
    label: string;
    children: ReactNode;
    first?: boolean;
    dropdownNode?: ReactNode;
}

export function RibbonGroup({ label, children, dropdownNode, first = false }: RibbonGroupProps) {
    return (
        <div className="flex">
            <div className="flex flex-col px-4 pt-2 h-full">
                <div className="flex gap-1 flex-1">{children}</div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={[
                            "flex gap-1 items-center justify-center py-1 px-2 my-1",
                            "uppercase tracking-wide text-[10px] font-semibold text-slate-400",
                            "hover:bg-zinc-900/50"
                        ].join(" ")}>
                            {label}
                            <ChevronDown size={12.5} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className={["w-56 bg-zinc-800 border-zinc-700 rounded-none mt-2 text-white", first && "ml-2"].join(" ")} align="center">
                        <DropdownMenuSeparator />
                        {dropdownNode}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="border-r border-zinc-700 my-2"></div>
        </div>
    );
}
