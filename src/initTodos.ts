import type { Todo } from "./types";
import { v4 as uuid } from "uuid";

export const initTodos: Todo[] = [
  { id: uuid(), name: "デイリー依頼を完了する", isDone: false, priority: 1, deadline: null, gameId: "genshin", kind: "daily" },
  { id: uuid(), name: "天然樹脂を消費する", isDone: false, priority: 1, deadline: null, gameId: "genshin", kind: "daily" },
  { id: uuid(), name: "ほよラボのログインボーナスを受け取る", isDone: false, priority: 2, deadline: null, gameId: "genshin", kind: "login" },
  { id: uuid(), name: "デイリー訓練を完了する", isDone: false, priority: 1, deadline: null, gameId: "starrail", kind: "daily" },
  { id: uuid(), name: "開拓力を消費する", isDone: false, priority: 1, deadline: null, gameId: "starrail", kind: "daily" },
  { id: uuid(), name: "ほよラボのログインボーナスを受け取る", isDone: false, priority: 2, deadline: null, gameId: "starrail", kind: "login" },
  { id: uuid(), name: "デイリー任務を完了する", isDone: false, priority: 1, deadline: null, gameId: "hi3", kind: "daily" },
  { id: uuid(), name: "APを消費する", isDone: false, priority: 1, deadline: null, gameId: "hi3", kind: "daily" },
  { id: uuid(), name: "ほよラボのログインボーナスを受け取る", isDone: false, priority: 2, deadline: null, gameId: "hi3", kind: "login" },
];
