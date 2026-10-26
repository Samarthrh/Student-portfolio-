function Loading({ message = "Loading tasks from database..." }) {
  return (
    <div className="empty-state loading-state">
      <span className="spinner" aria-hidden="true"></span>
      <p>{message}</p>
    </div>
  );
}

export default Loading;