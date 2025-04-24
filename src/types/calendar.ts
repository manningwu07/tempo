import type { ColorKey } from "~/components/colorPicker";

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  notifications?: Date[];
  goalId?: string;
  goalColor?: ColorKey;
  taskId?: string;
  taskColor?: ColorKey;
  type?: "goal" | "task";
};

