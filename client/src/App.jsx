import { useState, useEffect, createContext, useContext } from "react";
import { Routes, Route, NavLink, Link, useLocation } from "react-router-dom";
import { Code2, Compass, Bookmark, Layers, Shield, Sun, Moon, Menu, X, ArrowUpRight, ChevronRight, Heart } from "lucide-react";
import { api } from "./services/api";
import Library from "./pages/Library";
import Detail from "./pages/Detail";
import Admin from "./pages/Admin";
export const HubContext = createContext();
export const useHub = () => useContext(HubContext);
function readLocal(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export default function App() {
  const [resources, setResources] = useState([]), [categories, setCategories] = useState([]), [config, setConfig] = useState({ adminEnabled: false, levels: [], types: [] }), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [favorites, setFavorites] = useState(() => {
    const value = readLocal("codehub-favorites", []);
    return Array.isArray(value) ? value.filter((x) => typeof x === "string") : [];
  });
  const [theme, setTheme] = useState(() => readLocal("codehub-theme", "dark") === "light" ? "light" : "dark");
  const [storageError, setStorageError] = useState(""), [menu, setMenu] = useState(false);
  const location = useLocation();
  async function reload() {
    setLoading(true);
    setError("");
    try {
      const [r, c, s] = await Promise.all([api.resources(), api.categories(), api.config()]);
      setResources(r);
      setCategories(c);
      setConfig(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("codehub-theme", JSON.stringify(theme));
    } catch {
    }
  }, [theme]);
  useEffect(() => {
    try {
      localStorage.setItem("codehub-favorites", JSON.stringify(favorites));
    } catch {
      setStorageError("Browser storage is unavailable. Favorites will last for this session only.");
    }
  }, [favorites]);
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  const toggle = (id) => setFavorites((previous) => previous.includes(id) ? previous.filter((x) => x !== id) : [...previous, id]);
  return (
    <HubContext.Provider value={{ resources, categories, config, loading, error, reload, favorites, toggle }}>
      <div className="app-shell">
        <aside className={`sidebar ${menu ? "open" : ""}`}>
          <Link to="/" className="brand">
            <span>
              <Code2 size={22} />
            </span>CodeHub
            <span className="brand-dot">.</span>
          </Link>
          <button className="mobile-close icon-button" onClick={() => setMenu(false)} aria-label="Close navigation">
            <X />
          </button>
          <div className="workspace-label">YOUR LEARNING WORKSPACE</div>
          <nav>
            <NavLink to="/" end>
              <Compass size={18} />Explore resources
            </NavLink>
            <NavLink to="/favorites">
              <Bookmark size={18} />My favorites
              <span className="nav-count">{favorites.length}</span>
            </NavLink>
            <NavLink to="/categories">
              <Layers size={18} />All categories
              <span className="nav-count">{categories.length || 16}</span>
            </NavLink>
          </nav>
          <div className="side-divider" />
          <div className="side-heading">CATEGORIES</div>
          <nav className="category-nav">{categories.map((c, i) => 
            <NavLink key={c} to={`/?category=${encodeURIComponent(c)}`} className={() => location.pathname === "/" && new URLSearchParams(location.search).get("category") === c ? "selected" : ""}>
              <span className={`category-symbol c${i % 6}`}>{["◇", "#", "JS", "⚛", "⬡", "ex", "Py", "✧", "⌘", "∞", "⑂", "GH", "▯", "▤", "✓", "⌨"][i]}</span>{c}
              <span className="category-count">{resources.filter((r) => r.category === c).length}</span>
            </NavLink>)}</nav>
          <div className="sidebar-footer">
            <div className="curated-note">
              <span>✦</span>
              <strong>A little learning, every day.</strong>
              <p>Your next big idea starts here.</p>
            </div>
            <NavLink className="admin-link" to="/admin">
              <Shield size={16} /> Local admin 
              <ChevronRight size={14} />
            </NavLink>
          </div>
        </aside>{menu && 
        <button className="scrim" onClick={() => setMenu(false)} aria-label="Close menu" />}
        <div className="main-shell">
          <header className="topbar">
            <button className="mobile-toggle icon-button" onClick={() => setMenu(true)} aria-label="Open navigation">
              <Menu />
            </button>
            <div className="breadcrumb">Workspace 
              <ChevronRight size={13} />
              <span>{location.pathname === "/favorites" ? "My favorites" : location.pathname === "/admin" ? "Local admin" : location.pathname === "/categories" ? "Categories" : "Explore"}</span>
            </div>
            <div className="topbar-right">
              <span className="curated-pill">
                <i />Curated for developers
              </span>
              <button className="icon-button theme-button" onClick={() => setTheme((t) => t === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? 
                <Sun size={18} /> : 
                <Moon size={18} />}</button>
              <span className="avatar">CH</span>
            </div>
          </header>
          <main>{storageError && 
            <div role="status" className="notice">{storageError}</div>}
            <Routes>
              <Route path="/" element={
                <Library />} />
              <Route path="/favorites" element={
                <Library favoritesOnly />} />
              <Route path="/categories" element={
                <Library categoriesOnly />} />
              <Route path="/resources/:id" element={
                <Detail />} />
              <Route path="/admin" element={
                <Admin />} />
              <Route path="*" element={
                <div className="empty">
                  <h1>Page not found</h1>
                  <Link to="/">Explore resources →</Link>
                </div>} />
            </Routes>
          </main>
          <footer>
            <span>
              <Code2 size={15} /> Built for curious minds.
            </span>
            <span>Made with 
              <Heart size={12} /> for the developer community
            </span>
            <a href="https://github.com/skills" target="_blank" rel="noreferrer">Keep learning 
              <ArrowUpRight size={13} />
            </a>
          </footer>
        </div>
      </div>
    </HubContext.Provider>
  );
}
