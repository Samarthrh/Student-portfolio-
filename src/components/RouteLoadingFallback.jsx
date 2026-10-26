function RouteLoadingFallback({ message = 'Loading page chunk...' }) {
  return (
    <div className="page route-fallback-container" role="status" aria-live="polite">
      <div className="card route-fallback-card">
        <div className="route-spinner" aria-hidden="true"></div>
        <h2>{message}</h2>
        <p className="subtext">Downloading code-split bundle on demand via React.lazy()...</p>
        <div className="route-fallback-bar">
          <div className="route-fallback-progress"></div>
        </div>
      </div>
    </div>
  );
}

export default RouteLoadingFallback;
