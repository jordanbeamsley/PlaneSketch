import { MoveHorizontal, MoveVertical } from "lucide-react";
import { RibbonGroup } from "../elements/ribbonGroup";
import { RibbonToolButton } from "../elements/ribbonToolButton";
import { useToolStore } from "@/shared/store/toolStore";
import { useSelectionCounts } from "@/frontend/context/sessionContext";
import { evaluateConstraintGeom } from "@/cad/models/sketch/constraints";
import { useEffect } from "react";

interface TabPanelProps {
    id: string;
}

export function RibbonConstraints({ id }: TabPanelProps) {
    const { tool, activeConstraintKind, activateConstraint } = useToolStore();
    const counts = useSelectionCounts();

    const verticalStatus = evaluateConstraintGeom(counts, "vertical");
    const horizontalStatus = evaluateConstraintGeom(counts, "horizontal");

    useEffect(() => {
        console.log("vertical:", verticalStatus, "-", "horizontal:", horizontalStatus)
    })

    return (
        <section
            id={id}
            role="tabpanel"
            aria-labelledby="ribbon-tab-home"
            className="flex overflow-x-auto text-xs h-full"
        >
            <RibbonGroup label="Constraints">
                <RibbonToolButton
                    icon={<MoveVertical size={18} />}
                    label="Vertical"
                    onClick={() => { (verticalStatus !== "excluded") && activateConstraint("vertical") }}
                    active={tool === "constraint" && activeConstraintKind === "vertical"}
                    disabled={verticalStatus === "excluded"}
                    tooltip="Line"
                    tooltipShortcut="l"
                />
                <RibbonToolButton
                    icon={<MoveHorizontal size={18} />}
                    label="Horizontal"
                    onClick={() => { (horizontalStatus !== "excluded") && activateConstraint("horizontal") }}
                    active={tool === "constraint" && activeConstraintKind === "horizontal"}
                    disabled={horizontalStatus === "excluded"}
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
