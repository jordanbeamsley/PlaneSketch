import { useEffect } from "react";
import { PixiStage } from "../pixi/PixiStage";
import { useToolStore } from "../store/toolStore";

function App() {
	const { tool, setTool } = useToolStore();

	useEffect(() => {
		//for (const s of shapes) s.gfx.eventMode = (tool === "select") ? "static" : "none";
	}, [tool])

	return (
		<div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
			<div style={{ position: 'absolute', zIndex: 10, padding: 10 }}>
				<button onClick={() => setTool('select')}>Select</button>
				<button onClick={() => setTool('line')}>Line</button>
				<button onClick={() => setTool('circle')}>Circle</button>
				<button onClick={() => setTool('rect')}>Square</button>
			</div>
			<div className="flex-1">
				<PixiStage />
			</div>
		</div>
	);
}

export default App;
