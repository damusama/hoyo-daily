import type { Todo } from "./types";
type Props = { todos: Todo[]; onToggle: (id: string) => void; onDelete: (id: string) => void };
const TodoList = ({ todos, onToggle, onDelete }: Props) => {
  if (!todos.length) return <p className="empty-state">このカテゴリに登録された項目はありません。</p>;
  return <div className="task-list">{todos.map((todo) => <div className={`task-row ${todo.isDone ? "is-done" : ""}`} key={todo.id}>
    <button className="task-check" aria-label={todo.isDone ? "未完了に戻す" : "完了にする"} onClick={() => onToggle(todo.id)}>{todo.isDone ? "✓" : ""}</button>
    <div className="task-main"><span className="task-name">{todo.name}</span>{todo.note && <span className="task-note">{todo.note}</span>}</div>
    <span className="task-kind">{todo.kind === "login" ? "LOGIN" : todo.kind === "weekly" ? "WEEKLY" : todo.kind === "custom" ? "MEMO" : "DAILY"}</span>
    {(todo.isCustom || todo.kind === "custom") && <button className="delete-task" onClick={() => onDelete(todo.id)} aria-label="削除">×</button>}
  </div>)}</div>;
};
export default TodoList;
