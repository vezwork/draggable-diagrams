import { useState } from "react";
import { HashRouter, Link, Route, Routes, useParams } from "react-router-dom";
import { Demo } from "./components/Demo";
import { demos } from "./demos";

function DemoList() {
  const [debugView, setDebugView] = useState(false);
  const [snapRadius, setSnapRadius] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="text-center py-10 px-5 max-w-6xl mx-auto">
        <h1 className="text-3xl font-normal text-gray-800">
          Draggable diagrams
        </h1>
      </div>
      <div className="flex flex-col gap-5 px-5 pb-5 max-w-6xl mx-auto flex-1">
        {demos.map((demo) => (
          <Demo
            key={demo.id}
            id={demo.id}
            title={demo.title}
            drawer={demo.createDrawer()}
            height={demo.height}
            padding={demo.padding}
            debugView={debugView}
            snapRadius={snapRadius}
          />
        ))}
      </div>
      <div className="mt-auto bg-white/95 py-4 px-5 border-t border-gray-200 flex gap-5 items-center justify-center shadow-[0_-2px_4px_rgba(0,0,0,0.1)]">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={debugView}
            onChange={(e) => setDebugView(e.target.checked)}
          />
          Debug View
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="range"
            min="0"
            max="20"
            value={snapRadius}
            onChange={(e) => setSnapRadius(Number(e.target.value))}
          />
          Snap Radius
        </label>
      </div>
    </div>
  );
}

function SingleDemo() {
  const { id } = useParams<{ id: string }>();
  const [debugView, setDebugView] = useState(false);
  const [snapRadius, setSnapRadius] = useState(0);

  const demo = demos.find((d) => d.id === id);

  if (!demo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="text-center py-10 px-5 max-w-6xl mx-auto">
          <h1 className="text-3xl font-normal text-gray-800">Demo not found</h1>
          <div className="mt-5">
            <Link to="/" className="text-blue-600 text-sm hover:text-blue-700">
              ← Back to all demos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="text-center py-10 px-5 max-w-6xl mx-auto">
        <h1 className="text-3xl font-normal text-gray-800">
          Draggable diagrams
        </h1>
      </div>
      <div className="text-center py-2.5 px-5 max-w-6xl mx-auto">
        <Link
          to="/"
          className="text-blue-600 text-sm hover:text-blue-700 no-underline"
        >
          ← Back to all demos
        </Link>
      </div>
      <div className="flex flex-col gap-5 px-5 pb-5 max-w-6xl mx-auto flex-1">
        <Demo
          id={demo.id}
          title={demo.title}
          drawer={demo.createDrawer()}
          height={demo.height}
          padding={demo.padding}
          debugView={debugView}
          snapRadius={snapRadius}
        />
      </div>
      <div className="mt-auto bg-white/95 py-4 px-5 border-t border-gray-200 flex gap-5 items-center justify-center shadow-[0_-2px_4px_rgba(0,0,0,0.1)]">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={debugView}
            onChange={(e) => setDebugView(e.target.checked)}
          />
          Debug View
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="range"
            min="0"
            max="20"
            value={snapRadius}
            onChange={(e) => setSnapRadius(Number(e.target.value))}
          />
          Snap Radius
        </label>
      </div>
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<DemoList />} />
        <Route path="/:id" element={<SingleDemo />} />
      </Routes>
    </HashRouter>
  );
}
