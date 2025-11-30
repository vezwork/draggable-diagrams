import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { ConfigCheckbox } from "../config-controls";
import { ErrorBoundary } from "../ErrorBoundary";
import { ManipulableSvg, ManipulableSvgDrawer } from "../manipulable-svg";

interface DemoSvgProps<T extends object> {
  id: string;
  title: string;
  notes?: ReactNode;
  manipulableSvg: ManipulableSvg<T>;
  initialState: T;
  height: number;
  padding?: number;
  initialSnapRadius?: number;
  initialChainDrags?: boolean;
  initialRelativePointerMotion?: boolean;
}

export function DemoSvg<T extends object>({
  id,
  title,
  notes,
  manipulableSvg,
  initialState,
  height,
  padding = 0,
  initialSnapRadius = 10,
  initialChainDrags = true,
  initialRelativePointerMotion = false,
}: DemoSvgProps<T>) {
  const [snapRadius, setSnapRadius] = useState(initialSnapRadius);
  const [chainDrags, setChainDrags] = useState(initialChainDrags);
  const [relativePointerMotion, setRelativePointerMotion] = useState(
    initialRelativePointerMotion,
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
      </div>
      {notes && <div className="mt-2 text-sm text-gray-600">{notes}</div>}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1" style={{ padding }}>
          <ErrorBoundary>
            <ManipulableSvgDrawer
              manipulableSvg={manipulableSvg}
              initialState={initialState}
              config={{
                snapRadius,
                chainDrags,
                relativePointerMotion,
                animationDuration: 300,
              }}
              height={height}
            />
          </ErrorBoundary>
        </div>
        <div
          className={`${false ? "w-64 md:w-52" : "w-48 md:w-32"} bg-gray-50 rounded p-3 flex flex-col gap-2`}
        >
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-gray-700">Snap radius</span>
            <input
              type="range"
              min="0"
              max="50"
              value={snapRadius}
              onChange={(e) => setSnapRadius(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-gray-500 text-center">
              {snapRadius} pixels
            </span>
          </label>
          <ConfigCheckbox
            label="Chain drags automatically"
            value={chainDrags}
            onChange={setChainDrags}
          />
          <ConfigCheckbox
            label="Relative pointer motion"
            value={relativePointerMotion}
            onChange={setRelativePointerMotion}
          />
          {/* {hasConfig(drawer.manipulable) && (
            <>
              <div className="border-t border-gray-300 my-1" />
              {drawer.manipulable.renderConfig(
                manipulableConfig,
                setManipulableConfig,
              )}
            </>
          )} */}
        </div>
      </div>
    </div>
  );
}
