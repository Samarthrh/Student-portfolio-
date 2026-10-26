import { EventEmitter } from 'events';

// Create a dedicated EventEmitter subclass for task lifecycle events (Practical 10)
class TaskEvents extends EventEmitter {}

const taskEvents = new TaskEvents();

// Set appropriate max listeners
taskEvents.setMaxListeners(25);

export default taskEvents;
