import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      required: true,
      default: 'To Do',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    assigneeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    position: {
      type: Number,
      default: 0
    },
    dueDate: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

taskSchema.index({ workspaceId: 1, boardId: 1, position: 1 });

export const Task = mongoose.model('Task', taskSchema);
