import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const visible = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "done") return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await api.listTodos();
      setTodos(data);
    } catch (e) {
      setError(e.message || "Failed to load todos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function add(e) {
    e.preventDefault();
    const v = title.trim();
    if (!v) return;
    setError("");
    try {
      const created = await api.createTodo(v);
      setTodos((p) => [created, ...p]);
      setTitle("");
    } catch (e2) {
      setError(e2.message || "Failed to add");
    }
  }

  async function toggle(t) {
    setError("");
    try {
      const updated = await api.updateTodo(t.id, { completed: !t.completed });
      setTodos((p) => p.map((x) => (x.id === t.id ? updated : x)));
    } catch (e) {
      setError(e.message || "Failed to update");
    }
  }

  async function rename(t, newTitle) {
    const v = newTitle.trim();
    if (!v || v === t.title) return;
    setError("");
    try {
      const updated = await api.updateTodo(t.id, { title: v });
      setTodos((p) => p.map((x) => (x.id === t.id ? updated : x)));
    } catch (e) {
      setError(e.message || "Failed to rename");
    }
  }

  async function remove(t) {
    setError("");
    try {
      await api.deleteTodo(t.id);
      setTodos((p) => p.filter((x) => x.id !== t.id));
    } catch (e) {
      setError(e.message || "Failed to delete");
    }
  }

  return (
    <div className="page">
      <div className="card">
        <header className="header">
          <h1>To-Do List</h1>
          <p className="muted">React + Express + PostgreSQL (بدون Docker)</p>
        </header>

        <form className="row" onSubmit={add}>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task..." maxLength={200} />
          <button className="btn" type="submit">Add</button>
        </form>

        <div className="row row-space">
          <div className="filters">
            <button className={`pill ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
            <button className={`pill ${filter === "active" ? "active" : ""}`} onClick={() => setFilter("active")}>Active</button>
            <button className={`pill ${filter === "done" ? "active" : ""}`} onClick={() => setFilter("done")}>Done</button>
          </div>
          <button className="pill" onClick={refresh} disabled={loading}>Refresh</button>
        </div>

        {error ? <div className="error">{error}</div> : null}

        {loading ? (
          <div className="muted">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="muted">No tasks yet.</div>
        ) : (
          <ul className="list">
            {visible.map((t) => (
              <TodoItem key={t.id} todo={t} onToggle={() => toggle(t)} onRename={(nt) => rename(t, nt)} onRemove={() => remove(t)} />
            ))}
          </ul>
        )}

        <footer className="footer muted">Tip: double click the title to edit.</footer>
      </div>
    </div>
  );
}

function TodoItem({ todo, onToggle, onRename, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(todo.title);

  useEffect(() => setValue(todo.title), [todo.title]);

  function commit() {
    setEditing(false);
    onRename(value);
  }

  return (
    <li className={`item ${todo.completed ? "done" : ""}`}>
      <label className="check">
        <input type="checkbox" checked={todo.completed} onChange={onToggle} />
        <span />
      </label>

      <div className="content">
        {editing ? (
          <input
            className="edit"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setEditing(false); setValue(todo.title); }
            }}
            autoFocus
            maxLength={200}
          />
        ) : (
          <div className="title" onDoubleClick={() => setEditing(true)}>{todo.title}</div>
        )}
        <div className="meta">#{todo.id} • {new Date(todo.created_at).toLocaleString()}</div>
      </div>

      <button className="icon" onClick={onRemove} title="Delete">🗑️</button>
    </li>
  );
}
