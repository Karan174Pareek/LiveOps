import express from 'express';
import { Board } from '../models/Board.js';
import { Task } from '../models/Task.js';
import { requireAuth, scopeWorkspace, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Apply auth and workspace scoping to all board routes
router.use(requireAuth, scopeWorkspace);

// GET /boards — List all boards in the active workspace
router.get('/', async (req, res) => {
  try {
    const boards = await Board.find({ workspaceId: req.workspaceId }).sort({ createdAt: -1 });
    return res.status(200).json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    return res.status(500).json({ error: 'Server error while fetching workspace boards.' });
  }
});

// POST /boards — Create a new board (Admin & Member)
router.post('/', requireRole(['admin', 'member']), async (req, res) => {
  try {
    const { name, description, columns } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Board name is required.' });
    }

    const board = new Board({
      workspaceId: req.workspaceId,
      name: name.trim(),
      description: description ? description.trim() : '',
      columns: columns && Array.isArray(columns) && columns.length > 0 ? columns : ['To Do', 'In Progress', 'Done']
    });

    await board.save();
    return res.status(201).json(board);
  } catch (error) {
    console.error('Error creating board:', error);
    return res.status(500).json({ error: 'Server error while creating board.' });
  }
});

// GET /boards/:boardId — Get single board details & tasks (Query-scoped)
router.get('/:boardId', async (req, res) => {
  try {
    const board = await Board.findOne({ _id: req.params.boardId, workspaceId: req.workspaceId });
    if (!board) {
      return res.status(404).json({ error: 'Board not found or access denied.' });
    }

    const tasks = await Task.find({ boardId: board._id, workspaceId: req.workspaceId }).sort({ position: 1 });
    return res.status(200).json({ board, tasks });
  } catch (error) {
    console.error('Error fetching board details:', error);
    return res.status(500).json({ error: 'Server error while fetching board.' });
  }
});

// PUT /boards/:boardId — Update board (Admin & Member)
router.put('/:boardId', requireRole(['admin', 'member']), async (req, res) => {
  try {
    const { name, description, columns } = req.body;
    const board = await Board.findOne({ _id: req.params.boardId, workspaceId: req.workspaceId });

    if (!board) {
      return res.status(404).json({ error: 'Board not found or access denied.' });
    }

    if (name) board.name = name.trim();
    if (description !== undefined) board.description = description.trim();
    if (columns && Array.isArray(columns)) board.columns = columns;

    await board.save();
    return res.status(200).json(board);
  } catch (error) {
    console.error('Error updating board:', error);
    return res.status(500).json({ error: 'Server error while updating board.' });
  }
});

// DELETE /boards/:boardId — Delete board & all contained tasks (Admin only)
router.delete('/:boardId', requireRole(['admin']), async (req, res) => {
  try {
    const board = await Board.findOneAndDelete({ _id: req.params.boardId, workspaceId: req.workspaceId });
    if (!board) {
      return res.status(404).json({ error: 'Board not found or access denied.' });
    }

    // Cascading delete of tasks associated with this board in the workspace
    await Task.deleteMany({ boardId: board._id, workspaceId: req.workspaceId });
    return res.status(200).json({ message: 'Board and associated tasks deleted successfully.', boardId: board._id });
  } catch (error) {
    console.error('Error deleting board:', error);
    return res.status(500).json({ error: 'Server error while deleting board.' });
  }
});

export default router;
