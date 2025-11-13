import { useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { layer } from "../layer";
import { ManipulableDrawer } from "../manipulable";
import { PointerManager, pointerManagerWithOffset } from "../pointer";
import { Vec2 } from "../vec2";
import { Canvas } from "./Canvas";

interface DemoProps {
  id: string;
  title: string;
  drawer: ManipulableDrawer<any>;
  height: number;
  padding?: number;
  debugView: boolean;
  snapRadius: number;
}

export function Demo({
  id,
  title,
  drawer,
  height,
  padding = 0,
  debugView,
  snapRadius,
}: DemoProps) {
  const pointerRef = useRef<PointerManager | null>(null);

  // Memoize the draw callback to prevent unnecessary re-renders
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      // Initialize pointer manager on first draw
      if (!pointerRef.current) {
        pointerRef.current = new PointerManager(canvas);
      }

      const pointer = pointerRef.current;
      pointer.prepareForDraw();
      canvas.style.cursor = "default";

      const lyr = layer(ctx);

      // Clear with white background
      lyr.fillStyle = "white";
      const rect = canvas.getBoundingClientRect();
      lyr.fillRect(0, 0, rect.width, rect.height);

      // Update debug settings
      drawer.config.debugView = debugView;
      drawer.config.snapRadius = snapRadius;

      // Draw the demo with padding (offset both layer and pointer)
      const paddingVec = Vec2(padding, padding);
      const lyrOffset = layer(ctx);
      lyr.place(lyrOffset, paddingVec);
      drawer.draw(lyrOffset, pointerManagerWithOffset(pointer, paddingVec));

      lyr.draw();
    },
    [drawer, padding, debugView, snapRadius],
  );

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm" id={id}>
      <h2 className="text-xl font-semibold text-gray-900 mb-4 m-0">
        <Link
          to={`/${id}`}
          className="no-underline text-gray-900 hover:text-gray-700 transition-colors"
        >
          {title}
        </Link>
      </h2>
      <Canvas height={height + padding * 2} draw={draw} />
    </div>
  );
}
