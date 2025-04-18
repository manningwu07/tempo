"use client";
import { Navbar } from "../navBar";
import { useGoalsView } from "~/context/goalsViewContext";

export default function Goals() {
  const { view } = useGoalsView();
  return (
    <div>
      <nav>
        <Navbar />
        <h1>{view === "short" ? "Short-Term Goals" : "Long-Term Goals"}</h1>
      </nav>
    </div>
  );
}
