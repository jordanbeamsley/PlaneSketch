import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useEntities } from "@/frontend/context/sessionContext";
import { ChevronRightIcon, CircleDot, CircleSmall, Minus } from "lucide-react";
import type { ReactNode } from "react";

const short = (id: string) => id.slice(0, 5);
const fmt = (n: number) => n.toFixed(1);

function EntityItem({
    onClick,
    children,
}: {
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            className="py-1.5 pl-11 flex w-full text-xs text-zinc-500 font-mono text-nowrap hover:bg-zinc-700/70 hover:cursor-pointer"
            onClick={() => onClick()}
        >
            {children}
        </button>
    );
}

function EntityCategory({
    name,
    icon,
    children,
}: {
    name: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <Collapsible defaultOpen className="mb-">
            <CollapsibleTrigger asChild>
                <button className="flex flex-row group text-zinc-300 text-sm items-center mb-2 px-2 hover:cursor-pointer">
                    <ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90 mr-2 text-zinc-500" />
                    {icon}
                    <span>{name}</span>
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent>{children}</CollapsibleContent>
        </Collapsible>
    );
}

export default function EntitiesSidebar() {
    const { nodes, segments, circles } = useEntities();

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto py-3">
            <EntityCategory
                name="Nodes"
                icon={<CircleSmall className="mr-2" size={16} />}
            >
                {nodes.map(({ id, p }) => (
                    <EntityItem key={id} onClick={() => {}}>
                        <span className="text-zinc-400/90 uppercase mr-4">
                            P_{short(id)}
                        </span>
                        ({fmt(p.x)}, {fmt(p.y)})
                    </EntityItem>
                ))}
            </EntityCategory>
            <EntityCategory
                name="Segments"
                icon={<Minus className="mr-2" size={16} />}
            >
                {segments.map(({ id, p1, p2 }) => (
                    <EntityItem key={id} onClick={() => {}}>
                        <span className="text-zinc-400/90 uppercase mr-4">
                            S_{short(id)}
                        </span>
                        {short(p1)} → {short(p2)}
                    </EntityItem>
                ))}
            </EntityCategory>
            <EntityCategory
                name="Circles"
                icon={<CircleDot className="mr-2" size={16} />}
            >
                {circles.map(({ id }) => (
                    <div key={id}></div>
                ))}
            </EntityCategory>
        </div>
    );
}
