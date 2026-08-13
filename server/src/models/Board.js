import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    columns: {
      type: [String],
      default: ['Backlog', 'To Do', 'In Progress', 'Review', 'Done']
    }
  },
  { timestamps: true }
);

boardSchema.index({ workspaceId: 1, createdAt: -1 });

export const Board = mongoose.model('Board', boardSchema);
