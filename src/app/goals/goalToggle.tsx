"use client";
import { Calendar, Check } from "lucide-react";

import { useGoalsView } from "~/context/goalsViewContext";
export default function GoalToggle() {
  const { view, setView } = useGoalsView();

  const base = "inline-flex rounded-full border bg-white p-1";
  const btn = (active: boolean) =>
    `p-2 rounded-full transition ${
      active ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className={base}>
      <button
        onClick={() => setView("short")}
        className={btn(view === "short")}
        aria-label="Short-term goals"
      >
        <Calendar className="h-4 w-4" />
      </button>
      <button
        onClick={() => setView("long")}
        className={btn(view === "long")}
        aria-label="Long-term goals"
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}
