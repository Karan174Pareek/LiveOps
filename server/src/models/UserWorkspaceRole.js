import mongoose from 'mongoose';

const userWorkspaceRoleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'guest'],
      default: 'member',
      required: true
    }
  },
  { timestamps: true }
);

// Enforce unique role per user per workspace
userWorkspaceRoleSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });

export const UserWorkspaceRole = mongoose.model('UserWorkspaceRole', userWorkspaceRoleSchema);
