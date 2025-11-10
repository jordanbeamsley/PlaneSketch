import Ribbon from "@/components/ribbon/ribbon";
import { PixiStage } from "../pixi/PixiStage";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {

    return (
        <div className="w-screen h-screen overflow-hidden flex flex-col">
            <TooltipProvider>
                <Ribbon />
            </TooltipProvider>
            <div id="canvas-container" className="flex-1">
                <PixiStage />
            </div>
        </div>
    );
}

export default App;
