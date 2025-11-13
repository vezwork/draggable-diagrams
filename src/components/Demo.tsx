import { useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useDemoContext } from "../DemoContext";
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
}

export function Demo({ id, title, drawer, height, padding = 0 }: DemoProps) {
  const { debugView, snapRadius } = useDemoContext();
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 m-0">
          <Link
            to={`/${id}`}
            className="no-underline text-gray-900 hover:text-gray-700 transition-colors"
          >
            {title}
          </Link>
        </h2>
        {drawer.manipulable.sourceFile && (
          <a
            href={`https://github.com/joshuahhh/draggable-diagrams/blob/main/src/${drawer.manipulable.sourceFile}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-700 no-underline"
          >
            source
          </a>
        )}
      </div>
      <Canvas height={height + padding * 2} draw={draw} />
    </div>
  );
}
