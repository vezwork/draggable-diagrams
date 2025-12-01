// Custom React components that can be used in MDX pages

import { DemoContext } from "../DemoContext";
import { demos } from "../demos";

export { normalizeIndent } from "../normalizeIndent";

export function Callout({
  children,
  type = "info",
}: {
  children: React.ReactNode;
  type?: "info" | "warning" | "success";
}) {
  const colors = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    success: "bg-green-50 border-green-200 text-green-800",
  };

  return (
    <div className={`border-l-4 p-4 mb-4 rounded ${colors[type]}`}>
      {children}
    </div>
  );
}

export function DemoEmbed({ demoId }: { demoId: string }) {
  return (
    <div className="mb-4">
      <DemoContext.Provider
        value={{ debugMode: false, docEmbedMode: true, baseUrl: "/demos" }}
      >
        {demos.find((d) => (d.props as any).id === demoId)}
      </DemoContext.Provider>
    </div>
  );
}
