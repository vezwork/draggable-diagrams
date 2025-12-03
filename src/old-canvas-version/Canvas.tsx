import { useEffect, useRef } from "react";

interface CanvasProps {
  height: number;
  draw: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void;
}

export function Canvas({ height, draw }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);

  // Keep draw ref up to date
  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Setup canvas with devicePixelRatio
    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.scale(dpr, dpr);
    };

    setupCanvas();

    // Re-setup on resize
    const resizeObserver = new ResizeObserver(() => {
      setupCanvas();
    });
    resizeObserver.observe(canvas);

    // Start draw loop
    let animationFrameId: number;
    const drawLoop = () => {
      drawRef.current(ctx, canvas);
      animationFrameId = requestAnimationFrame(drawLoop);
    };
    drawLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full touch-none"
      style={{ height: `${height}px` }}
    />
  );
}
