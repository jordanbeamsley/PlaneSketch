import { ChevronRightIcon, Dot, X } from "lucide-react";
import type { ActivityMode } from "./activityBar";
import { Toggle } from "@/components/ui/toggle";
import {
    useConstraints,
    useEntities,
    type GeometryEntry,
} from "@/frontend/context/sessionContext";
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

function EntityRow({ entry }: { entry: GeometryEntry }) {
    if (entry.kind === "node") {
        const { id, p } = entry.data;
        return (
            <div className="px-3 py-1 text-xs text-zinc-400 font-mono">
                <span className="text-zinc-300">node</span> {short(id)} (
                {fmt(p.x)}, {fmt(p.y)})
            </div>
        );
    }
    if (entry.kind === "segment") {
        const { id, p1, p2 } = entry.data;
        return (
            <div className="px-3 py-1 text-xs text-zinc-400 font-mono">
                <span className="text-zinc-300">seg </span> {short(id)}{" "}
                {short(p1)} → {short(p2)}
            </div>
        );
    }
    if (entry.kind === "circle") {
        const { id, centre, radius } = entry.data;
        return (
            <div className="px-3 py-1 text-xs text-zinc-400 font-mono">
                <span className="text-zinc-300">circ</span> {short(id)} c:
                {short(centre)} r:{fmt(radius)}
            </div>
        );
    }
    // arc
    const { id, center, start, end } = entry.data;
    return (
        <div className="px-3 py-1 text-xs text-zinc-400 font-mono">
            <span className="text-zinc-300">arc </span> {short(id)} c:
            {short(center)} {short(start)} → {short(end)}
        </div>
    );
}

function EntitiesSidebar() {
    const { nodes, segments, circles, arcs } = useEntities();

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto py-3 px-2">
            <Collapsible defaultOpen className="mb-4">
                <CollapsibleTrigger asChild>
                    <button className="flex flex-row group text-zinc-300 text-sm items-center mb-2">
                        <ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90 mr-2 text-zinc-500" />
                        <Dot />
                        <span>Nodes</span>
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4">
                    {nodes.map(({ id, p }) => (
                        <div className="px-3 py-1.5 text-xs text-zinc-400 font-mono">
                            <span className="text-zinc-300 uppercase mr-3">
                                P_{short(id)}
                            </span>
                            ({fmt(p.x)}, {fmt(p.y)})
                        </div>
                    ))}
                </CollapsibleContent>
            </Collapsible>
            <Collapsible defaultOpen className="mb-4">
                <CollapsibleTrigger asChild>
                    <button className="flex flex-row group text-zinc-300 text-sm items-center mb-2">
                        <ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90 mr-2 text-zinc-500" />
                        <Dot />
                        <span>Segments</span>
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4">
                    {segments.map(({ id, p1, p2 }) => (
                        <div className="px-3 py-1 text-xs text-zinc-400 font-mono">
                            <span className="text-zinc-300 uppercase mr-3">
                                S_{short(id)}
                            </span>
                            {short(p1)} → {short(p2)}
                        </div>
                    ))}
                </CollapsibleContent>
            </Collapsible>
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
        <div className="flex flex-col h-full bg-zinc-800">
            <PanelHeader title={PANEL_TITLES[activeMode]} onClose={onClose} />
            {activeMode === "constraints" && <ConstraintsSidebar />}
            {activeMode === "entities" && <EntitiesSidebar />}
        </div>
    );
}
