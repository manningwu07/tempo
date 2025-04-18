// components/types.ts
export type Task = {
    title: string
    description: string
    color: string
  }
  
  export type Column = {
    id: string
    title: string
    color: string
    tasks: Task[]
  }
  
  // New: a Goal is just a title + color + its own columns
  export type Goal = {
    id: string
    title: string
    color: string
    columns: Column[]
  }
  