import { Circle, Minus, Square, SquareMousePointer } from "lucide-react";
import { RibbonGroup } from "./RibbonGroup";
import { RibbonToolButton } from "./RibbonToolButton";
import { useToolStore } from "@/store/toolStore";

interface TabPanelProps {
    id: string;
}

export function RibbonHome({ id }: TabPanelProps) {
    const { tool, setTool } = useToolStore();

    return (
        <section
            id={id}
            role="tabpanel"
            aria-labelledby="ribbon-tab-home"
            className="flex overflow-x-auto text-xs h-full"
        >
            <RibbonGroup label="Select">
                <RibbonToolButton icon={<SquareMousePointer size={18} />} label="Select" onClick={() => setTool("select")} active={tool === "select"} />
            </RibbonGroup>
            <RibbonGroup label="Draw">
                <RibbonToolButton icon={<Minus size={18} />} label="Line" onClick={() => setTool("line")} active={tool === "line"} />
                <RibbonToolButton icon={<Square size={18} />} label="Rectangle" onClick={() => setTool("rectangle")} active={tool === "rectangle"} />
                <RibbonToolButton icon={<Circle size={18} />} label="Circle" onClick={() => setTool("circle")} active={tool === "circle"} />
            </RibbonGroup>
            {/*
            <RibbonGroup label="Modify">
                <RibbonToolButton label="Trim" shortLabel="TR" />
                <RibbonToolButton label="Extend" shortLabel="EX" />
                <RibbonToolButton label="Offset" shortLabel="OF" />
            </RibbonGroup>

            <RibbonGroup label="Constraints">
                <RibbonToolButton label="Coincident" shortLabel="CO" />
                <RibbonToolButton label="Parallel" shortLabel="PA" />
                <RibbonToolButton label="Perpendicular" shortLabel="PE" />
            </RibbonGroup>
            */}
        </section>
    );
}
