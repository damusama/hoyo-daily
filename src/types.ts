export type GameId = "genshin" | "starrail" | "hi3";
export type TaskKind = "daily" | "weekly" | "login" | "custom";

// 元のTodo型を土台に、ゲーム・日課の分類情報を追加
export type Todo = {
  id: string;
  name: string;
  isDone: boolean;
  priority: number;
  deadline: Date | null;
  gameId?: GameId | "all";
  kind?: TaskKind;
  note?: string;
  createdAt?: string;
};

export type StaminaState = {
  current: number;
  max: number;
  updatedAt: string;
  regenMinutes: number;
};

export type DailyRecord = {
  date: string;
  completed: string[];
};

export type AppData = {
  todos: Todo[];
  stamina: Record<GameId, StaminaState>;
  uids: Record<GameId, string>;
  history: DailyRecord[];
  resetHour: Record<GameId, number>;
};
