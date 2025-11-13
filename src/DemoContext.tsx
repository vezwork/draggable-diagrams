import { createContext, ReactNode, useContext } from "react";

interface DemoContextValue {
  debugView: boolean;
  snapRadius: number;
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export function DemoProvider({
  debugView,
  snapRadius,
  children,
}: {
  debugView: boolean;
  snapRadius: number;
  children: ReactNode;
}) {
  return (
    <DemoContext.Provider value={{ debugView, snapRadius }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoContext() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemoContext must be used within a DemoProvider");
  }
  return context;
}
