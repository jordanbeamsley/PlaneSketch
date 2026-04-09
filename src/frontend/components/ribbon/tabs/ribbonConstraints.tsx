import { MoveHorizontal, MoveVertical } from "lucide-react";
import { RibbonGroup } from "../elements/ribbonGroup";
import { RibbonToolButton } from "../elements/ribbonToolButton";

interface TabPanelProps {
    id: string;
}

export function RibbonConstraints({ id }: TabPanelProps) {

    return (
        <section
            id={id}
            role="tabpanel"
            aria-labelledby="ribbon-tab-home"
            className="flex overflow-x-auto text-xs h-full"
        >
            <RibbonGroup label="Draw">
                <RibbonToolButton
                    icon={<MoveVertical size={18} />}
                    label="Vertical"
                    onClick={() => { return }}
                    active={false}
                    tooltip="Line"
                    tooltipShortcut="l"
                />
                <RibbonToolButton
                    icon={<MoveHorizontal size={18} />}
                    label="Horizontal"
                    onClick={() => { return }}
                    active={false}
                    tooltip="Rectangle"
                    tooltipShortcut="r"
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
