const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = (data && (data.error?.message || data.error || data.message)) || "Request failed";
    throw new Error(typeof msg === "string" ? msg : "Request failed");
  }
  return data;
}

export const api = {
  listTodos: () => request("/api/todos"),
  createTodo: (title) => request("/api/todos", { method: "POST", body: JSON.stringify({ title }) }),
  updateTodo: (id, patch) => request(`/api/todos/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteTodo: (id) => request(`/api/todos/${id}`, { method: "DELETE" }),
};
