"use client";
import { createContext, useState, useContext, type ReactNode } from "react";

export type GoalsView = "short" | "long";

interface GoalsViewContextValue {
  view: GoalsView;
  setView: (v: GoalsView) => void;
}

const GoalsViewContext = createContext<GoalsViewContextValue>({
  view: "short",
  setView: () => {},
});

export function GoalsViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<GoalsView>("short");
  return (
    <GoalsViewContext.Provider value={{ view, setView }}>
      {children}
    </GoalsViewContext.Provider>
  );
}

export function useGoalsView() {
  return useContext(GoalsViewContext);
}
