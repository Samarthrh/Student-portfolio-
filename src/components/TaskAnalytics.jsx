import { useState, useEffect, useCallback } from 'react';
import { getCacheStats, flushCache, getEventLogs } from '../api';

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

  // Cache stats state (Practical 9)
  const [cacheData, setCacheData] = useState(null);
  const [flushing, setFlushing] = useState(false);

  // Background events state (Practical 10)
  const [eventsList, setEventsList] = useState([]);

  const fetchStatsAndEvents = useCallback(() => {
    getCacheStats()
      .then((data) => setCacheData(data))
      .catch(() => {});

    getEventLogs()
      .then((data) => setEventsList(data.events || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStatsAndEvents();
  }, [fetchStatsAndEvents]);

  const handleFlushCache = async () => {
    setFlushing(true);
    try {
      const res = await flushCache();
      setCacheData(res.stats);
    } catch {
      // ignore
    } finally {
      setFlushing(false);
    }
  };

  return (
    <div className="card analytics-card">
      <div className="analytics-header">
        <div>
          <h3>📊 Task Analytics & In-Memory Cache Monitor</h3>
          <p className="subtext">
            Performance metrics, task distributions, and node-cache server stats
          </p>
        </div>
        <span className="badge-pill">Practical 8 & 9 Combined</span>
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

        {/* Practical 9: In-Memory Cache Monitor */}
        <div className="analytics-box cache-stats-box">
          <div className="analytics-metric-title">
            <span>⚡ Node-Cache Stats (TTL: 60s)</span>
            <strong>Hit Ratio: {cacheData ? cacheData.hitRatio : 'N/A'}</strong>
          </div>
          <div className="cache-stats-details">
            <div className="cache-stat-item">
              <span className="cache-stat-num text-success">{cacheData?.hits || 0}</span>
              <span className="cache-stat-label">Cache Hits</span>
            </div>
            <div className="cache-stat-item">
              <span className="cache-stat-num text-warning">{cacheData?.misses || 0}</span>
              <span className="cache-stat-label">Cache Misses</span>
            </div>
            <div className="cache-stat-item">
              <span className="cache-stat-num text-info">{cacheData?.writes || 0}</span>
              <span className="cache-stat-label">Cache Writes</span>
            </div>
            <div className="cache-stat-item">
              <span className="cache-stat-num text-danger">{cacheData?.invalidations || 0}</span>
              <span className="cache-stat-label">Invalidations</span>
            </div>
          </div>
          <div className="cache-actions-row">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchStatsAndEvents}
            >
              🔄 Refresh Stats
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleFlushCache}
              disabled={flushing}
            >
              {flushing ? 'Flushing...' : '🗑️ Flush Cache'}
            </button>
          </div>
        </div>

        {/* Practical 10: Asynchronous Event-Driven Architecture Log */}
        <div className="analytics-box events-log-box">
          <div className="analytics-metric-title">
            <span>📡 Asynchronous Event Stream (Node.js EventEmitter)</span>
            <strong>{eventsList.length} Background Events</strong>
          </div>
          <p className="subtext" style={{ margin: '0.25rem 0 0.85rem' }}>
            Non-blocking background events processed asynchronously after API response
          </p>

          <div className="events-stream-list">
            {eventsList.length > 0 ? (
              eventsList.slice(0, 4).map((evt) => (
                <div key={evt.id} className={`event-stream-item event-${evt.event}`}>
                  <div className="event-stream-header">
                    <span className="event-badge">{evt.event}</span>
                    <span className="event-time">
                      {evt.completedTime
                        ? new Date(evt.completedTime).toLocaleTimeString()
                        : new Date(evt.recordedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="event-stream-desc">
                    {evt.event === 'error' ? (
                      <span className="text-danger">⚠️ {evt.error}</span>
                    ) : (
                      <>
                        <strong>{evt.title}</strong> — {evt.note || 'Processed asynchronously'}
                      </>
                    )}
                  </p>
                </div>
              ))
            ) : (
              <div className="empty-state-mini">
                No background events logged yet. Create or delete a task to trigger events!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskAnalytics;
