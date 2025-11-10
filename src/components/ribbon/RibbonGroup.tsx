import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

interface RibbonGroupProps {
    label: string;
    children: ReactNode;
}

export function RibbonGroup({ label, children }: RibbonGroupProps) {
    return (
        <div className="flex flex-col [&:not(:last-child)]:border-r border-zinc-700 px-4 pt-2 h-full">
            <div className="flex gap-1 flex-1">{children}</div>
            <div className="flex gap-1 items-center justify-center uppercase tracking-wide text-[10px] font-semibold text-slate-400 py-1">
                {label}
                <ChevronDown size={12.5} />
            </div>
        </div>
    );
}
