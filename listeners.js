import taskEvents from './events.js';

// In-memory audit log for background events (for verification & debug endpoint)
export const eventLog = [];

const recordEventLog = (entry) => {
  eventLog.unshift({
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...entry,
    recordedAt: new Date().toISOString()
  });
  if (eventLog.length > 50) eventLog.pop();
};

/* ==========================================================================
   Event Listeners (Practical 10)
   ========================================================================== */

// 1. 'task-created' Event Listener (with simulated background notification delay)
taskEvents.on('task-created', (task) => {
  const triggerTime = new Date().toISOString();
  console.log(`[Event Triggered] 'task-created' received at ${triggerTime} for task: "${task.title}"`);

  // Simulate slow asynchronous background processing (e.g. sending email / notification)
  setTimeout(() => {
    try {
      // Test error handling simulation if title contains [test-error]
      if (task.title?.includes('[test-error]')) {
        throw new Error(`Notification dispatch failed for task: "${task.title}"`);
      }

      const completedTime = new Date().toISOString();
      console.log(
        `[Background Notification] Task "${task.title}" (Priority: ${task.priority || 'medium'}) processed for user <${task.userEmail || task.user}> at ${completedTime}`
      );

      recordEventLog({
        event: 'task-created',
        taskId: task._id || task.id,
        title: task.title,
        priority: task.priority,
        user: task.userEmail || task.user,
        triggerTime,
        completedTime,
        status: 'delivered',
        note: 'Email notification delivered asynchronously via EventEmitter'
      });
    } catch (err) {
      // Forward caught listener errors to the 'error' event listener
      taskEvents.emit('error', err);
    }
  }, 1500); // 1.5s simulated async background delay
});

// 2. 'task-deleted' Event Listener (Supplementary Requirement 1)
taskEvents.on('task-deleted', (payload) => {
  const triggerTime = new Date().toISOString();
  console.log(`[Event Triggered] 'task-deleted' received at ${triggerTime} for task: "${payload.title}"`);

  setTimeout(() => {
    const completedTime = new Date().toISOString();
    console.log(
      `[Background Notification] Task deletion archived for "${payload.title}" (ID: ${payload.id}) by user <${payload.userEmail || payload.user}> at ${completedTime}`
    );

    recordEventLog({
      event: 'task-deleted',
      taskId: payload.id,
      title: payload.title,
      user: payload.userEmail || payload.user,
      triggerTime,
      completedTime,
      status: 'archived',
      note: 'Task deletion audit log stored asynchronously in background'
    });
  }, 1000); // 1.0s simulated background archival delay
});

// 3. 'error' Event Listener (Supplementary Requirement 2)
taskEvents.on('error', (err) => {
  const errorTime = new Date().toISOString();
  console.error(`[Event Error Caught] Handled by EventEmitter error listener at ${errorTime}:`, err.message);

  recordEventLog({
    event: 'error',
    error: err.message,
    timestamp: errorTime,
    status: 'error_caught'
  });
});

export default taskEvents;
