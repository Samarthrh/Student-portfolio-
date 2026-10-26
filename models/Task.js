import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

taskSchema.pre('save', function trimTitle() {
  if (typeof this.title === 'string') {
    this.title = this.title.trim();
  }
});

export default mongoose.model('Task', taskSchema);