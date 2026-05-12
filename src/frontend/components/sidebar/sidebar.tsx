import {
    ChevronRightIcon,
    CircleDot,
    CircleSmall,
    Minus,
    X,
} from "lucide-react";
import type { ReactNode } from "react";
import type { ActivityMode } from "./activityBar";
import { Toggle } from "@/components/ui/toggle";
import { useConstraints, useEntities } from "@/frontend/context/sessionContext";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

const PANEL_TITLES: Record<ActivityMode, string> = {
    constraints: "Constraints",
    entities: "Entities",
    variables: "Variables",
};

function PanelHeader({
    title,
    onClose,
}: {
    title: string;
    onClose: () => void;
}) {
    return (
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700">
            <span className="text-sm font-medium text-zinc-300">{title}</span>
            <button
                type="button"
                aria-label={`Close ${title} panel`}
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
                <X size={14} />
            </button>
        </div>
    );
}

function ConstraintsSidebar() {
    const constraints = useConstraints();

    return (
        <div className="flex flex-col">
            <Toggle>Toggle</Toggle>
            {constraints.map((c) => (
                <div key={c.id} className="px-3 py-1 text-xs text-zinc-400">
                    {c.kind}
                    {c.id}
                </div>
            ))}
        </div>
    );
}

const short = (id: string) => id.slice(0, 5);
const fmt = (n: number) => n.toFixed(1);

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
        <Collapsible defaultOpen className="mb-4">
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

function EntitiesSidebar() {
    const { nodes, segments, circles } = useEntities();

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto py-3">
            <EntityCategory
                name="Nodes"
                icon={<CircleSmall className="mr-2" size={16} />}
            >
                {nodes.map(({ id, p }) => (
                    <button
                        key={id}
                        className="py-1.5 pl-11 flex w-full text-xs text-zinc-500 font-mono text-nowrap hover:bg-zinc-700/70 hover:cursor-pointer"
                    >
                        <span className="text-zinc-400/90 uppercase mr-4">
                            P_{short(id)}
                        </span>
                        ({fmt(p.x)}, {fmt(p.y)})
                    </button>
                ))}
            </EntityCategory>
            <EntityCategory
                name="Segments"
                icon={<Minus className="mr-2" size={16} />}
            >
                {segments.map(({ id, p1, p2 }) => (
                    <div
                        key={id}
                        className="py-1.5 pl-11 text-xs text-zinc-500 font-mono text-nowrap"
                    >
                        <span className="text-zinc-400/90 uppercase mr-4">
                            S_{short(id)}
                        </span>
                        {short(p1)} → {short(p2)}
                    </div>
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

export default function Sidebar({
    activeMode,
    onClose,
}: {
    activeMode: ActivityMode;
    onClose: () => void;
}) {
    return (
        <div className="flex flex-col h-full bg-zinc-800 overflow-hidden">
            <PanelHeader title={PANEL_TITLES[activeMode]} onClose={onClose} />
            {activeMode === "constraints" && <ConstraintsSidebar />}
            {activeMode === "entities" && <EntitiesSidebar />}
        </div>
    );
}
