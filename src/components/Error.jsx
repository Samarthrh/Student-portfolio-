function ErrorDisplay({ message, onRetry }) {
  return (
    <div className="error-message">
      <p>Something went wrong: {message}</p>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  );
}

export default ErrorDisplay;