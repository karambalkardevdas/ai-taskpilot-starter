import { FormEvent, useEffect, useMemo, useState } from "react";

type Task = {
  id: number;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  created_at: string;
};

type Suggestion = {
  title: string;
  subtasks: string[];
  provider: string;
};

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");


function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [filter, setFilter] = useState("all");
  const [suggestionTitle, setSuggestionTitle] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadTasks() {
    try {
      const response = await fetch(`${API_BASE}/api/tasks`);
      if (!response.ok) throw new Error("Could not load tasks. Is the backend running?");
      setTasks(await response.json());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect to the API.");
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  const visibleTasks = useMemo(
    () => filter === "all" ? tasks : tasks.filter((task) => task.status === filter),
    [tasks, filter]
  );

  const completed = tasks.filter((task) => task.status === "done").length;
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description, priority, status: "todo" })
      });
      if (!response.ok) throw new Error("Task creation failed.");
      setTitle("");
      setDescription("");
      setPriority("medium");
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create task.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(task: Task, status: Task["status"]) {
    setError(`Status editing will be added in the next API milestone. Task: ${task.title}`);
  }

  async function generateSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!suggestionTitle.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/ai/suggest?title=${encodeURIComponent(suggestionTitle)}`, {
        method: "POST"
      });
      if (!response.ok) throw new Error("Could not generate suggestions.");
      setSuggestion(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suggestion request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">T</div>
        <div className="brand-copy">
          <strong>TaskPilot</strong>
          <span>AI WORKSPACE</span>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <div className="nav-item active"><span>▦</span> Overview</div>
        <div className="nav-item"><span>✓</span> My tasks</div>
        <div className="nav-item"><span>✦</span> AI assistant</div>
        <div className="sidebar-bottom">
          <div className="avatar">TP</div>
          <div><strong>Portfolio demo</strong><span>Local development</span></div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div><span className="eyebrow">YOUR WORKSPACE</span><h1>Good work starts here.</h1></div>
          <div className="environment"><span className="status-dot" /> LOCAL DEVELOPMENT</div>
        </header>

        <section className="welcome-card">
          <div className="welcome-copy">
            <span className="pill">✦ YOUR AI-POWERED WORKSPACE</span>
            <h2>Turn your plans<br />into <em>progress.</em></h2>
            <p>Keep your projects moving. Organize your work, focus on what matters, and let TaskPilot help you plan the next step.</p>
          </div>
          <div className="orbit-art" aria-hidden="true">
            <div className="orbit orbit-one"></div><div className="orbit orbit-two"></div>
            <div className="planet">✦</div><div className="floating-card card-a">✓ &nbsp; Plan your next move</div>
            <div className="floating-card card-b">✧ &nbsp; AI ideas, ready to go</div>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card"><span className="stat-icon purple">▦</span><span className="stat-label">ALL TASKS</span><strong>{tasks.length.toString().padStart(2, "0")}</strong><small>Across your workspace</small></div>
          <div className="stat-card"><span className="stat-icon green">✓</span><span className="stat-label">COMPLETED</span><strong>{completed.toString().padStart(2, "0")}</strong><small>Tasks finished</small></div>
          <div className="stat-card"><span className="stat-icon amber">◷</span><span className="stat-label">IN PROGRESS</span><strong>{inProgress.toString().padStart(2, "0")}</strong><small>Moving forward</small></div>
        </section>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <div className="content-grid">
          <section className="panel tasks-panel">
            <div className="panel-heading"><div><span className="eyebrow">STAY ON TRACK</span><h3>Your tasks</h3></div><span className="count-badge">{visibleTasks.length}</span></div>
            <div className="filter-row">
              {["all", "todo", "in_progress", "done"].map((value) => (
                <button key={value} className={filter === value ? "filter active-filter" : "filter"} onClick={() => setFilter(value)}>
                  {value === "all" ? "All tasks" : value.replace("_", " ")}
                </button>
              ))}
            </div>
            <div className="task-list">
              {visibleTasks.length === 0 ? <div className="empty-state"><div className="empty-icon">✧</div><strong>Your next big thing starts here.</strong><span>Add a task using the form to get started.</span></div> :
                visibleTasks.map((task) => (
                  <article className="task-row" key={task.id}>
                    <div className={`task-check ${task.status === "done" ? "checked" : ""}`}>{task.status === "done" ? "✓" : ""}</div>
                    <div className="task-info"><strong>{task.title}</strong><span>{task.description || "No description added"}</span><div className="task-meta"><span className={`priority ${task.priority}`}>{task.priority} priority</span><span className={`task-status ${task.status}`}>{task.status.replace("_", " ")}</span></div></div>
                  </article>
                ))}
            </div>
          </section>

          <div className="right-column">
            <section className="panel create-panel">
              <div className="panel-heading"><div><span className="eyebrow">MAKE IT HAPPEN</span><h3>Create a task</h3></div><span className="heading-spark">✦</span></div>
              <form onSubmit={createTask} className="form-stack">
                <label>Task name<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to get done?" required maxLength={200} /></label>
                <label>Description <span className="optional">OPTIONAL</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a little context..." rows={3} /></label>
                <label>Priority<select value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
                <button className="primary-button" disabled={loading}>{loading ? "Working..." : "＋ Create task"}</button>
              </form>
            </section>

            <section className="panel ai-panel">
              <div className="ai-title"><span className="ai-star">✦</span><div><span className="eyebrow">THINK AHEAD</span><h3>AI task assistant</h3></div></div>
              <p>Turn a big goal into a few clear next steps.</p>
              <form onSubmit={generateSuggestion} className="ai-form"><input value={suggestionTitle} onChange={(e) => setSuggestionTitle(e.target.value)} placeholder="e.g. Launch my portfolio" required /><button aria-label="Generate task ideas" disabled={loading}>↗</button></form>
              {suggestion && <div className="suggestion-list"><span className="mock-label">DEMO PROVIDER: {suggestion.provider}</span>{suggestion.subtasks.map((item) => <div key={item} className="suggestion-item">✧ &nbsp; {item}</div>)}</div>}
              <div className="ai-footnote"><span>✦</span> Mock AI for now — no API key or AI charges.</div>
            </section>
          </div>
        </div>
        <footer>AI TASKPILOT <span>•</span> BUILT TO LEARN, MADE TO SHIP</footer>
      </section>
    </main>
  );
}

export default App;
