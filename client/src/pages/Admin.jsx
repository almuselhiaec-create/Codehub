import { useState } from "react";
import { Shield, Plus, Pencil, Trash2, X, Search } from "lucide-react";
import { useHub } from "../App";
import { api } from "../services/api";
import { Status } from "./Library";
const blank = { name: "", description: "", url: "", category: "HTML", level: "Beginner", type: "Documentation", free: true, featured: false, keywords: "" };
export default function Admin() {
  const { config, categories, resources, reload, loading, error } = useHub();
  const [form, setForm] = useState(null), [id, setId] = useState(null), [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [failure, setFailure] = useState(""), [deleting, setDeleting] = useState(null), [query, setQuery] = useState("");
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setFailure("");
    try {
      await api.save({ ...form, keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean) }, id);
      setForm(null);
      setMessage(id ? "Resource updated." : "Resource added.");
      await reload();
    } catch (e2) {
      setFailure(e2.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id2) {
    setBusy(true);
    setFailure("");
    try {
      await api.remove(id2);
      setDeleting(null);
      setMessage("Resource deleted.");
      await reload();
    } catch (e) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <div className="eyebrow">
        <Shield size={15} /> LOCAL WORKSPACE
      </div>
      <h1>Manage the library
        <span>.</span>
      </h1>
      <p className="intro">Keep your collection useful, accurate, and inspiring.</p>{loading ? 
      <Status loading /> : error ? 
      <Status error={error} reload={reload} /> : !config.adminEnabled ? 
      <div className="locked-admin">
        <Shield size={36} />
        <h2>Editing is locked by default</h2>
        <p>To manage resources, stop the development servers and run:</p>
        <code>npm run dev:admin</code>
        <p>This enables editing on the loopback interface in development only. Restart with 
          <code>npm run dev</code> to lock it again.
        </p>
        <div className="notice">There is no authentication. Local mode is for a trusted computer only. Do not expose it through tunnels or reverse proxies. Public deployment requires real authentication and authorization.</div>
      </div> : 
      <>
        <div className="notice">
          <Shield size={16} />Local development editing is enabled. Changes are saved to server/data/resources.json.
        </div>{message && 
        <p className="success-message" role="status">{message}</p>}{failure && 
        <p className="error-message" role="alert">{failure}</p>}
        <div className="admin-toolbar">
          <label className="search-box">
            <Search size={18} />
            <input placeholder="Find a resource to manage…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Find a resource" />
          </label>
          <button className="primary-button" disabled={busy} onClick={() => {
    setId(null);
    setForm({ ...blank });
    setFailure("");
  }}>
            <Plus size={16} />Add resource
          </button>
        </div>{form && 
        <form className="admin-form" onSubmit={save}>
          <div className="section-heading">
            <h2>{id ? "Edit resource" : "New resource"}</h2>
            <button type="button" className="icon-button" disabled={busy} onClick={() => setForm(null)} aria-label="Close editor">
              <X size={18} />
            </button>
          </div>
          <label>Name
            <input required maxLength={120} value={form.name} onChange={(e) => update("name", e.target.value)} />
          </label>
          <label>External URL
            <input type="url" required maxLength={2048} pattern="https?://.*" value={form.url} onChange={(e) => update("url", e.target.value)} />
          </label>
          <label className="full">Description
            <textarea required maxLength={1200} value={form.description} onChange={(e) => update("description", e.target.value)} />
          </label>{[["category", categories], ["level", config.levels], ["type", config.types]].map(([key, values]) => 
          <label key={key}>{key}
            <select value={form[key]} onChange={(e) => update(key, e.target.value)}>{values.map((v) => 
              <option key={v}>{v}</option>)}</select>
          </label>)}
          <label>Keywords (comma separated)
            <input value={form.keywords} onChange={(e) => update("keywords", e.target.value)} />
          </label>
          <div className="full checkbox-row">
            <label>
              <input type="checkbox" checked={form.free} onChange={(e) => update("free", e.target.checked)} />Free resource
            </label>
            <label>
              <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />Featured
            </label>
          </div>
          <button className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save resource"}</button>
        </form>}
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Category</th>
                <th>Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{resources.filter((r) => (r.name + " " + r.category).toLowerCase().includes(query.toLowerCase())).map((r) => 
              <tr key={r.id}>
                <td>
                  <strong>{r.name}</strong>
                  <span>{r.url}</span>
                </td>
                <td>{r.category}</td>
                <td>{r.level}</td>
                <td>{deleting === r.id ? 
                  <div className="delete-confirm">
                    <span>Delete this resource?</span>
                    <button disabled={busy} className="danger-button" onClick={() => remove(r.id)}>Delete</button>
                    <button disabled={busy} className="text-button" onClick={() => setDeleting(null)}>Cancel</button>
                  </div> : 
                  <div className="row-actions">
                    <button disabled={busy} className="icon-button" aria-label={`Edit ${r.name}`} onClick={() => {
    setId(r.id);
    setForm({ ...r, keywords: r.keywords.join(", ") });
    setFailure("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }}>
                      <Pencil size={16} />
                    </button>
                    <button disabled={busy} className="icon-button" aria-label={`Delete ${r.name}`} onClick={() => setDeleting(r.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>}</td>
              </tr>)}</tbody>
          </table>
        </div>
      </>}
    </div>
  );
}
