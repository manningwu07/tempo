// TODO
// Add auth for the middleware to check whether session cookies is valid + which user is it

// Use a toggle to switch between
// Short term and long term goals

// Short term is GC + Notion
// Long term is just notion + yearly GC

// In the future
// Add custom/new features.
//   1. Create "no notifications" option for page
//   2. Calendar, no calendar, cards, no cards. (so notion, google calendar, or both layout/setup)

import { GoalsViewProvider } from "~/context/goalsViewContext";

export default function GoalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GoalsViewProvider>{children}</GoalsViewProvider>;
}
