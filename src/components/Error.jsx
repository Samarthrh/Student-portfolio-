function ErrorDisplay({ message, onRetry }) {
  return (
    <div className="empty-state error-banner" role="alert">
      <div className="error-icon">⚠️</div>
      <div>
        <h3>Something went wrong</h3>
        <p className="error-text">{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-secondary retry-btn" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorDisplay;