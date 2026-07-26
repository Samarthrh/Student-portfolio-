import { useState, useEffect, useCallback } from "react";
import Loading from "../components/Loading";
import ErrorDisplay from "../components/Error";

function Projects() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchRepos = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("https://api.github.com/users/Samarthrh/repos")
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        return res.json();
      })
      .then((data) => setRepos(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  if (loading) return <Loading />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchRepos} />;

  const filtered = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="page projects-page">
      <section className="hero-card projects-hero">
        <p className="eyebrow">My Work</p>
        <h1>Open-source repositories with clean design and purpose.</h1>
        <p className="lead">
          Explore live projects, utilities, and learning experiments from my GitHub.
        </p>
      </section>

      <section className="card projects-grid">
        <div className="projects-topbar">
          <div>
            <h2>Repositories</h2>
            <p className="subtext">Search by name to find the code you want.</p>
          </div>
          <input
            className="search-input"
            type="text"
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="repo-grid">
          {filtered.length > 0 ? (
            filtered.map((repo) => (
              <article className="repo-card" key={repo.id}>
                <div>
                  <a href={repo.html_url} target="_blank" rel="noreferrer">
                    {repo.name}
                  </a>
                  <p>{repo.description || 'No description available.'}</p>
                </div>
                <div className="repo-meta">
                  <span>⭐ {repo.stargazers_count}</span>
                  <span>{repo.language || 'JavaScript'}</span>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              No repositories match your search. Try a different term.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Projects;