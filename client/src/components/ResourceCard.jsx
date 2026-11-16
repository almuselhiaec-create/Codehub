import { Bookmark, ArrowUpRight, BookOpen, FileText, Map, Code2, Play, Book } from "lucide-react";
import { Link } from "react-router-dom";
const icons = { Documentation: FileText, Course: Play, Book, Interactive: Code2, Roadmap: Map };
export const categoryColors = { "HTML": "orange", "CSS": "blue", "JavaScript": "yellow", "React": "cyan", "Node.js": "green", "Python": "blue", "AI": "violet", "DevOps": "orange", "Software Engineering": "violet" };
export function TechIcon({ category, name }) {
  const marks = { "HTML": "5", "CSS": "#", "JavaScript": "JS", "React": "⚛", "Node.js": "JS", "Express": "ex", "Python": "Py", "AI": "✧", "Machine Learning": "ML", "DevOps": "∞", "Git": "⑂", "GitHub": "GH", "Mobile Development": "▯", "Databases": "DB", "Testing": "✓", "Software Engineering": "⌘" };
  return (
    <span className={`tech-icon ${categoryColors[category] || "violet"}`}>{name === "Developer Roadmaps" ? 
      <Map size={23} /> : marks[category] || "⌘"}</span>
  );
}
export default function ResourceCard({ resource: r, favorites, toggle }) {
  const Icon = icons[r.type] || BookOpen;
  return (
    <article className="resource-card">
      <div className="card-top">
        <TechIcon category={r.category} name={r.name} />
        <button className={`icon-button bookmark ${favorites.includes(r.id) ? "saved" : ""}`} onClick={() => toggle(r.id)} aria-label={`${favorites.includes(r.id) ? "Remove" : "Save"} ${r.name}`} aria-pressed={favorites.includes(r.id)}>
          <Bookmark size={18} />
        </button>
      </div>
      <Link className="card-title" to={`/resources/${r.id}`}>{r.name}</Link>
      <p>{r.description}</p>
      <div className="tags">
        <span className={`tag ${categoryColors[r.category] || "violet"}`}>{r.category}</span>
        <span className="level">
          <i className={r.level.toLowerCase()} />{r.level}
        </span>
      </div>
      <div className="card-bottom">
        <span>
          <Icon size={14} />{r.type}
        </span>
        <span className={r.free ? "free" : "paid"}>{r.free ? "Free" : "Paid"}</span>
        <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${r.name}`}>
          <ArrowUpRight size={18} />
        </a>
      </div>
    </article>
  );
}
