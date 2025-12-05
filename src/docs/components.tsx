// Custom React components that can be used in MDX pages

import { Demo } from "../Demo";
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
      {demos.map((d) =>
        d.run(
          (d) =>
            d.id === demoId && (
              <Demo
                demoData={d}
                debugMode={false}
                baseUrl="/demos"
                docEmbedMode={true}
              />
            )
        )
      )}
    </div>
  );
}
