function Home() {
  return (
    <main className="page">
      <section className="hero-card">
        <p className="eyebrow">Student Portfolio</p>
        <h1>Building thoughtful web experiences with curiosity and care.</h1>
        <p className="lead">
          I’m a student developer crafting modern, responsive projects that balance creativity with clean code.
        </p>
        <div className="hero-actions">
          <a href="/projects" className="btn btn-primary">View Projects</a>
          <a href="/contact" className="btn btn-secondary">Get in Touch</a>
        </div>
      </section>

      <section className="info-grid">
        <article className="info-card">
          <h2>What I do</h2>
          <p>Designing interfaces, writing React components, and turning ideas into polished experiences.</p>
        </article>
        <article className="info-card">
          <h2>Focus</h2>
          <p>Frontend development, accessibility, and thoughtful user journeys.</p>
        </article>
      </section>
    </main>
  );
}

export default Home;