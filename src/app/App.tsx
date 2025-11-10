import { PixiStage } from "../pixi/PixiStage";
import Ribbon from "@/components/ribbon";

function App() {

    return (
        <div className="w-screen h-screen overflow-hidden flex flex-col">
            <Ribbon />
            <div id="canvas-container" className="flex-1">
                <PixiStage />
            </div>
        </div>
    );
}

export default App;
