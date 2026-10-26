function TaskAnalytics({ tasks = [] }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const highPriority = tasks.filter((t) => t.priority === 'high').length;
  const mediumPriority = tasks.filter((t) => t.priority === 'medium').length;
  const lowPriority = tasks.filter((t) => t.priority === 'low').length;

  const highPct = total > 0 ? Math.round((highPriority / total) * 100) : 0;
  const medPct = total > 0 ? Math.round((mediumPriority / total) * 100) : 0;
  const lowPct = total > 0 ? Math.round((lowPriority / total) * 100) : 0;

  return (
    <div className="card analytics-card">
      <div className="analytics-header">
        <div>
          <h3>📊 Task Analytics & Distribution</h3>
          <p className="subtext">
            Heavy analytics component code-split and loaded on demand via React.lazy()
          </p>
        </div>
        <span className="badge-pill">Lazy Loaded Chunk</span>
      </div>

      <div className="analytics-grid">
        {/* Completion Progress Metric */}
        <div className="analytics-box">
          <div className="analytics-metric-title">
            <span>Overall Completion Rate</span>
            <strong>{completionRate}%</strong>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${completionRate}%` }}
              role="progressbar"
              aria-valuenow={completionRate}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
          <div className="analytics-legend">
            <span>✅ Completed: {completed}</span>
            <span>⏳ Pending: {pending}</span>
          </div>
        </div>

        {/* Priority Breakdown Metric */}
        <div className="analytics-box">
          <div className="analytics-metric-title">
            <span>Priority Breakdown</span>
            <strong>{total} Total Tasks</strong>
          </div>
          <div className="stacked-bar">
            <div
              className="stacked-slice slice-high"
              style={{ width: `${highPct}%` }}
              title={`High: ${highPriority} (${highPct}%)`}
            ></div>
            <div
              className="stacked-slice slice-medium"
              style={{ width: `${medPct}%` }}
              title={`Medium: ${mediumPriority} (${medPct}%)`}
            ></div>
            <div
              className="stacked-slice slice-low"
              style={{ width: `${lowPct}%` }}
              title={`Low: ${lowPriority} (${lowPct}%)`}
            ></div>
          </div>
          <div className="analytics-legend">
            <span className="dot dot-high">High: {highPriority} ({highPct}%)</span>
            <span className="dot dot-med">Medium: {mediumPriority} ({medPct}%)</span>
            <span className="dot dot-low">Low: {lowPriority} ({lowPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskAnalytics;
