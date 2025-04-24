import type { ColorKey } from "~/components/colorPicker";

export interface PositionedEvent extends CalendarEvent {
  _positionData?: {
    totalColumns: number;
    column: number;
  };
}

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

