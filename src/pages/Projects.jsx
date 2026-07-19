function Projects() {
  return (
    <main className="page">
      <section className="section-header">
        <p className="eyebrow">Selected work</p>
        <h1>Projects that blend function and personality.</h1>
      </section>

      <div className="project-grid">
        <article className="card">
          <h2>Portfolio Website</h2>
          <p>A responsive React portfolio with smooth navigation and a bright visual identity.</p>
        </article>
        <article className="card">
          <h2>Student Dashboard</h2>
          <p>A simple, focused experience for tracking goals, tasks, and progress.</p>
        </article>
        <article className="card">
          <h2>Creative Landing Page</h2>
          <p>An expressive landing experience designed to make first impressions feel memorable.</p>
        </article>
      </div>
    </main>
  );
}

export default Projects;