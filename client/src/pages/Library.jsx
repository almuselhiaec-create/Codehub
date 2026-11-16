import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, ArrowUpRight, ArrowRight, SlidersHorizontal, LayoutGrid, List, Bookmark, Sparkles, Code2, BookOpen, Layers, Check, RotateCcw } from "lucide-react";
import { useHub } from "../App";
import ResourceCard, { TechIcon } from "../components/ResourceCard";
export default function Library({ favoritesOnly = false, categoriesOnly = false }) {
  const { resources, categories, config, loading, error, reload, favorites, toggle } = useHub();
  const [params, setParams] = useSearchParams();
  const [layout, setLayout] = useState("grid");
  const q = params.get("q") || "", category = params.get("category") || "", level = params.get("level") || "", type = params.get("type") || "", free = params.get("free") === "true";
  const [sort, setSort] = useState("curated");
  const set = (key, value) => setParams((previous) => {
    const next = new URLSearchParams(previous);
    value ? next.set(key, value) : next.delete(key);
    return next;
  }, { replace: true });
  const active = !!(q || category || level || type || free);
  let filtered = resources.filter((r) => (!favoritesOnly || favorites.includes(r.id)) && (!q || [r.name, r.description, r.category, ...r.keywords].join(" ").toLowerCase().includes(q.toLowerCase())) && (!category || r.category === category) && (!level || r.level === level) && (!type || r.type === type) && (!free || r.free));
  if (sort === "name") filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "level") filtered = [...filtered].sort((a, b) => config.levels.indexOf(a.level) - config.levels.indexOf(b.level));
  const featured = resources.filter((r) => r.featured).slice(0, 3);
  if (categoriesOnly) return (
    <div className="page">
      <div className="eyebrow">
        <Layers size={14} /> FIND YOUR PATH
      </div>
      <h1>One place. Every possibility
        <span>.</span>
      </h1>
      <p className="intro">Explore {categories.length} categories and make your next move.</p>{error ? 
      <Status error={error} reload={reload} /> : loading ? 
      <Status loading /> : 
      <div className="category-grid">{categories.map((c) => 
        <Link to={`/?category=${encodeURIComponent(c)}`} className="category-tile" key={c}>
          <TechIcon category={c} />
          <h2>{c}</h2>
          <span>{resources.filter((r) => r.category === c).length} resources 
            <ArrowUpRight size={17} />
          </span>
        </Link>)}</div>}
    </div>
  );
  return (
    <div className="page">
      <section className="intro-section">
        <div>
          <div className="eyebrow">
            <span /> YOUR SHORTCUT TO BETTER CODE
          </div>
          <h1>{favoritesOnly ? "Your personal toolkit" : "Less searching."}
            <br />{favoritesOnly ? 
            <span>Keep the good stuff.</span> : 
            <>More 
              <span>building.</span>
            </>}
          </h1>
          <p className="intro">{favoritesOnly ? "The resources you love, ready when you are." : 
            <>Handpicked resources to learn, build, and level up.
              <br />All your developer essentials. One thoughtfully curated place.
            </>}</p>
        </div>
        <div className="hero-terminal" aria-hidden="true">
          <div className="terminal-top">
            <i />
            <i />
            <i />
            <span>your-next-chapter.js</span>
            <Code2 size={14} />
          </div>
          <pre><span className="purple">const</span> developer = {"{"}<br />{"  "}curiosity: <span className="mint">"limitless"</span>,<br />{"  "}resources: <span className="mint">"all in one place"</span>,<br />{"  "}nextStep: <span className="purple">() =&gt;</span> <span className="yellow-text">keepBuilding</span>()<br />{"}"};</pre>
          <div className="terminal-comment">// great things start with a little curiosity
            <span className="cursor" />
          </div>
          <div className="terminal-badge">
            <Sparkles size={13} /> A better way to learn
          </div>
        </div>
      </section>
      <div className="stats-strip">
        <span>
          <BookOpen size={16} />
          <strong>{loading ? "…" : resources.length}</strong> curated resources
        </span>
        <i />
        <span>
          <Layers size={16} />
          <strong>{loading ? "…" : categories.length}</strong> categories
        </span>
        <i />
        <span>
          <Check size={16} />
          <strong>{loading ? "…" : resources.filter((r) => r.free).length}</strong> free to explore
        </span>
        <div>Less noise. More knowledge.
          <span>↗</span>
        </div>
      </div>{!favoritesOnly && !active && 
      <section className="featured-section">
        <div className="section-heading">
          <h2>
            <Sparkles size={18} /> A great place to start 
            <span className="label">EDITOR’S PICKS</span>
          </h2>
          <a href="#library">Explore all 
            <ArrowRight size={15} />
          </a>
        </div>
        <div className="featured-grid">{loading ? [1, 2, 3].map((n) => 
          <div className="featured-card skeleton" key={n} />) : featured.map((r, i) => 
          <Link className={`featured-card feature-${i}`} to={`/resources/${r.id}`} key={r.id}>
            <div>
              <TechIcon category={r.category} name={r.name} />
              <span className="feature-type">{i === 0 ? "BUILD SOMETHING" : i === 1 ? "LEARN THE LANGUAGE" : "FIND YOUR DIRECTION"}
                <ArrowUpRight size={18} />
              </span>
            </div>
            <h3>{r.name}</h3>
            <p>{r.description}</p>
            <span className="feature-link">{r.type === "Roadmap" ? "Find your path" : "Start learning"} 
              <ArrowRight size={14} />
            </span>
          </Link>)}</div>
      </section>}
      <section id="library" className="library-section">
        <div className="section-heading">
          <h2>{favoritesOnly ? 
            <Bookmark size={19} /> : 
            <LayoutGrid size={18} />} {favoritesOnly ? "Saved resources" : "Explore the library"}
            <span className="number-label">{filtered.length}</span>
          </h2>
          <span className="section-caption">Your next favorite resource is in here.</span>
        </div>
        <div className="search-line">
          <label className="search-box">
            <Search size={19} />
            <input value={q} onChange={(e) => set("q", e.target.value)} placeholder="Search resources, topics, or technologies…" aria-label="Search resources" />
            <span className="search-hint">Search</span>
          </label>
          <div className="view-buttons">
            <button onClick={() => setLayout("grid")} className={layout === "grid" ? "active" : ""} aria-label="Grid view" aria-pressed={layout === "grid"}>
              <LayoutGrid size={17} />
            </button>
            <button onClick={() => setLayout("list")} className={layout === "list" ? "active" : ""} aria-label="List view" aria-pressed={layout === "list"}>
              <List size={18} />
            </button>
          </div>
        </div>
        <div className="filters">
          <SlidersHorizontal size={16} />
          <select aria-label="Filter by category" value={category} onChange={(e) => set("category", e.target.value)}>
            <option value="">All categories</option>{categories.map((c) => 
            <option key={c}>{c}</option>)}
          </select>
          <select aria-label="Filter by level" value={level} onChange={(e) => set("level", e.target.value)}>
            <option value="">All levels</option>{config.levels.map((c) => 
            <option key={c}>{c}</option>)}
          </select>
          <select aria-label="Filter by type" value={type} onChange={(e) => set("type", e.target.value)}>
            <option value="">All types</option>{config.types.map((c) => 
            <option key={c}>{c}</option>)}
          </select>
          <label className="free-filter">
            <input type="checkbox" checked={free} onChange={(e) => set("free", e.target.checked ? "true" : "")} />Free only
          </label>{active && 
          <button className="text-button reset" onClick={() => setParams({})}>
            <RotateCcw size={13} />Reset
          </button>}
          <div className="sort">
            <span>Sort by:</span>
            <select aria-label="Sort resources" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="curated">Curated</option>
              <option value="name">Name A–Z</option>
              <option value="level">Difficulty</option>
            </select>
          </div>
        </div>{error ? 
        <Status error={error} reload={reload} /> : loading ? 
        <div className="resource-grid" aria-label="Loading resources">{[1, 2, 3, 4, 5, 6].map((n) => 
          <div className="resource-card skeleton" key={n} />)}</div> : filtered.length ? 
        <>
          <div className="results-label">{category || (favoritesOnly ? "Your collection" : "All resources")}
            <span>Showing {filtered.length} resource{filtered.length !== 1 ? "s" : ""}</span>
          </div>
          <div className={`resource-grid ${layout === "list" ? "list-view" : ""}`}>{filtered.map((r) => 
            <ResourceCard key={r.id} resource={r} favorites={favorites} toggle={toggle} />)}</div>
          <div className="end-note">
            <span /> You’re all caught up. Keep the curiosity going. 
            <span />
          </div>
        </> : 
        <div className="empty">
          <Search size={30} />
          <h3>{favoritesOnly && !active ? "Your collection starts here" : "No resources found"}</h3>
          <p>{favoritesOnly && !active ? "Save a resource using its bookmark button to find it here." : "Try a different search or clear your filters."}</p>{active ? 
          <button className="primary-button" onClick={() => setParams({})}>Clear filters</button> : 
          <Link className="primary-button" to="/">Explore resources</Link>}
        </div>}
      </section>
    </div>
  );
}
export function Status({ loading, error, reload }) {
  return (
    <div className="empty" role={error ? "alert" : "status"}>{loading ? 
      <>
        <div className="spinner" />Loading your library…
      </> : 
      <>
        <h3>We couldn’t load the library</h3>
        <p>{error}</p>
        <button className="primary-button" onClick={reload}>Try again</button>
      </>}</div>
  );
}
