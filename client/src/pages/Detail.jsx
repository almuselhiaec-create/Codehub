import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Bookmark, Check, ExternalLink } from "lucide-react";
import { api } from "../services/api";
import { useHub } from "../App";
import { TechIcon } from "../components/ResourceCard";
export default function Detail() {
  const { id } = useParams(), { favorites, toggle } = useHub();
  const [resource, setResource] = useState(null), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setResource(null);
    setError("");
    api.resource(id).then((r) => {
      if (alive) setResource(r);
    }).catch((e) => {
      if (alive) setError(e.message);
    });
    return () => {
      alive = false;
    };
  }, [id, retry]);
  return (
    <div className="page detail-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={16} />Back to the library
      </Link>{error ? 
      <div className="empty" role="alert">
        <h2>{error}</h2>
        <button className="primary-button" onClick={() => setRetry((n) => n + 1)}>Try again</button>
      </div> : !resource ? 
      <div className="empty" role="status">Loading resource…</div> : 
      <article className="detail-card">
        <div className="eyebrow">A LITTLE KNOWLEDGE GOES A LONG WAY</div>
        <TechIcon category={resource.category} name={resource.name} />
        <h1>{resource.name}</h1>
        <p className="detail-description">{resource.description}</p>
        <div className="detail-meta">{[["Category", resource.category], ["Difficulty", resource.level], ["Format", resource.type], ["Access", resource.free ? "Free" : "Paid"]].map(([label, value]) => 
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>)}</div>
        <div className="detail-actions">
          <a className="primary-button" href={resource.url} target="_blank" rel="noopener noreferrer">Visit resource
            <ArrowUpRight size={18} />
          </a>
          <button className="secondary-button" onClick={() => toggle(resource.id)}>
            <Bookmark size={17} />{favorites.includes(resource.id) ? "Saved to favorites" : "Save resource"}
          </button>
        </div>
        <div className="destination">
          <ExternalLink size={15} />
          <a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.url}</a>
        </div>
        <div className="tags">{resource.keywords.map((k) => 
          <span className="tag" key={k}>#{k}</span>)}</div>
        <div className="notice">
          <Check size={17} />This resource opens on an external website. Availability and pricing are managed by its publisher.
        </div>
      </article>}
    </div>
  );
}
