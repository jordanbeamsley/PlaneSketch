import { Circle, Minus, Square, SquareMousePointer } from "lucide-react";
import { useToolStore } from "@/store/toolStore";
import { RibbonGroup } from "../elements/ribbonGroup";
import { RibbonToolButton } from "../elements/ribbonToolButton";
import { DropdownMenuGroup, DropdownMenuPortal, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { RibbonDropdownItem } from "../elements/ribbonDropdownItem";
import { RibbonDropdownSubTrigger } from "../elements/ribbonDropdownSubTrigger";
import { RibbonDropdownSeperator } from "../elements/ribbonDropdownSeperator";

interface TabPanelProps {
    id: string;
}

export function RibbonHome({ id }: TabPanelProps) {
    const { tool, setTool } = useToolStore();

    const drawDropdown = (
        <DropdownMenuGroup>
            <RibbonDropdownItem>
                Line
                <DropdownMenuShortcut className="font-mono">l</DropdownMenuShortcut>
            </RibbonDropdownItem>
            <DropdownMenuSub>
                <RibbonDropdownSubTrigger>Rectangle</RibbonDropdownSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent className="rounded-none bg-zinc-800 text-white border-zinc-700 w-56 ml-2">
                        <RibbonDropdownItem>2-Point Rectangle <DropdownMenuShortcut className="font-mono">r</DropdownMenuShortcut> </RibbonDropdownItem>
                        <RibbonDropdownItem>3-Point Rectangle</RibbonDropdownItem>
                        <RibbonDropdownItem>Centre Rectangle</RibbonDropdownItem>
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSub>
                <RibbonDropdownSubTrigger>Circle</RibbonDropdownSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent className="rounded-none bg-zinc-800 text-white border-zinc-700 w-56 ml-2">
                        <RibbonDropdownItem>Centre Diameter Circle <DropdownMenuShortcut className="font-mono">c</DropdownMenuShortcut> </RibbonDropdownItem>
                        <RibbonDropdownItem>2-Point Circle</RibbonDropdownItem>
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSub>
                <RibbonDropdownSubTrigger>Arc</RibbonDropdownSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent className="rounded-none bg-zinc-800 text-white border-zinc-700 w-56 ml-2">
                        <RibbonDropdownItem>3-Point Arc</RibbonDropdownItem>
                        <RibbonDropdownItem>Centre Point Arc</RibbonDropdownItem>
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
            <RibbonDropdownSeperator></RibbonDropdownSeperator>
            <RibbonDropdownItem>Mirror</RibbonDropdownItem>
            <RibbonDropdownItem>Circular Pattern</RibbonDropdownItem>
            <RibbonDropdownItem>Rectangular Pattern</RibbonDropdownItem>
        </DropdownMenuGroup>
    );

    return (
        <section
            id={id}
            role="tabpanel"
            aria-labelledby="ribbon-tab-home"
            className="flex overflow-x-auto text-xs h-full"
        >
            <RibbonGroup label="Select" first={true}>
                <RibbonToolButton
                    icon={<SquareMousePointer size={18} />}
                    label="Select"
                    onClick={() => setTool("select")}
                    active={tool === "select"}
                    tooltip="Select"
                    tooltipShortcut="Esc"
                />
            </RibbonGroup>
            <RibbonGroup label="Draw" dropdownNode={drawDropdown}>
                <RibbonToolButton
                    icon={<Minus size={18} />}
                    label="Line" onClick={() => setTool("line")}
                    active={tool === "line"}
                    tooltip="Line"
                    tooltipShortcut="l"
                />
                <RibbonToolButton
                    icon={<Square size={18} />}
                    label="Rectangle"
                    onClick={() => setTool("rectangle")}
                    active={tool === "rectangle"}
                    tooltip="Rectangle"
                    tooltipShortcut="r"
                />
                <RibbonToolButton
                    icon={<Circle size={18} />}
                    label="Circle"
                    onClick={() => setTool("circle")}
                    active={tool === "circle"}
                    tooltip="Circle"
                    tooltipShortcut="c"
                />
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
