import express from 'express';
import { Task } from '../models/Task.js';
import { Board } from '../models/Board.js';
import { requireAuth, scopeWorkspace, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Apply auth and workspace scoping to all task routes
router.use(requireAuth, scopeWorkspace);

// GET /tasks — Get tasks in active workspace (Optional boardId filter)
router.get('/', async (req, res) => {
  try {
    const filter = { workspaceId: req.workspaceId };
    if (req.query.boardId) {
      filter.boardId = req.query.boardId;
    }

    const tasks = await Task.find(filter).sort({ position: 1, createdAt: -1 });
    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ error: 'Server error while fetching tasks.' });
  }
});

// POST /tasks — Create a new task (Admin & Member)
router.post('/', requireRole(['admin', 'member']), async (req, res) => {
  try {
    const { boardId, title, description, status, priority, dueDate, assigneeIds } = req.body;

    if (!boardId || !title) {
      return res.status(400).json({ error: 'boardId and task title are required.' });
    }

    // Verify board exists within the active workspace
    const board = await Board.findOne({ _id: boardId, workspaceId: req.workspaceId });
    if (!board) {
      return res.status(404).json({ error: 'Board not found in current workspace.' });
    }

    // Determine task position
    const maxPositionTask = await Task.findOne({ boardId, workspaceId: req.workspaceId, status: status || board.columns[0] }).sort({ position: -1 });
    const position = maxPositionTask ? maxPositionTask.position + 1 : 0;

    const task = new Task({
      workspaceId: req.workspaceId,
      boardId,
      title: title.trim(),
      description: description ? description.trim() : '',
      status: status || board.columns[0],
      priority: priority || 'medium',
      dueDate: dueDate || null,
      assigneeIds: assigneeIds || [],
      position
    });

    await task.save();
    return res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ error: 'Server error while creating task.' });
  }
});

// PUT /tasks/:taskId — Update task details, status, or position (Admin & Member)
router.put('/:taskId', requireRole(['admin', 'member']), async (req, res) => {
  try {
    const { title, description, status, priority, position, dueDate, assigneeIds } = req.body;

    const task = await Task.findOne({ _id: req.params.taskId, workspaceId: req.workspaceId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found or access denied.' });
    }

    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (position !== undefined) task.position = position;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assigneeIds !== undefined) task.assigneeIds = assigneeIds;

    await task.save();
    return res.status(200).json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ error: 'Server error while updating task.' });
  }
});

// DELETE /tasks/:taskId — Delete task (Admin & Member)
router.delete('/:taskId', requireRole(['admin', 'member']), async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.taskId, workspaceId: req.workspaceId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found or access denied.' });
    }

    return res.status(200).json({ message: 'Task deleted successfully.', taskId: task._id });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ error: 'Server error while deleting task.' });
  }
});

export default router;
