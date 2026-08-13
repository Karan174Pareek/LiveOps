import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { Task } from '../models/Task.js';
import { requireAuth, scopeWorkspace } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth, scopeWorkspace);

// Helper to initialize Anthropic SDK if key is provided
const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes('your_anthropic_claude_api_key_here')) {
    return null;
  }
  return new Anthropic({ apiKey });
};

// POST /ai/summarize-standup — Generate workspace standup activity summary
router.post('/summarize-standup', async (req, res) => {
  try {
    const tasks = await Task.find({ workspaceId: req.workspaceId }).sort({ updatedAt: -1 }).limit(20);

    if (tasks.length === 0) {
      return res.status(200).json({
        summary: 'No recent task activity recorded in this workspace. Create tasks to generate automated standup summaries!'
      });
    }

    const taskSummaries = tasks.map((t) => `- Title: "${t.title}" | Status: ${t.status} | Priority: ${t.priority} | Updated: ${t.updatedAt.toISOString().slice(0, 10)}`).join('\n');

    const anthropic = getAnthropicClient();

    if (!anthropic) {
      // Graceful fallback summary if Anthropic API key is not configured in env
      const doneCount = tasks.filter((t) => t.status === 'Done').length;
      const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
      const todoCount = tasks.filter((t) => t.status === 'To Do' || t.status === 'Backlog').length;

      return res.status(200).json({
        summary: `📊 **LiveOps Automated Workspace Standup Summary**:\n\n` +
          `• **Completed Deliverables**: ${doneCount} task(s) currently marked Done.\n` +
          `• **Active Work in Progress**: ${inProgressCount} task(s) being worked on right now.\n` +
          `• **Backlog / Pending Queue**: ${todoCount} task(s) waiting in queue.\n\n` +
          `*Note: Configure ANTHROPIC_API_KEY in server/.env for AI-generated text analysis.*`,
        fallback: true
      });
    }

    const prompt = `You are LiveOps AI, an executive agile project manager. Analyze these recent workspace tasks and produce a bulleted 24h Daily Standup Summary with:
1) Key Accomplishments Completed
2) Work In Progress
3) Blockers or High Priority Items requiring attention.

Workspace Tasks:
${taskSummaries}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    });

    const summaryText = response.content[0]?.type === 'text' ? response.content[0].text : 'Summary completed.';
    return res.status(200).json({ summary: summaryText });
  } catch (error) {
    console.error('Claude API Error (summarize-standup):', error);
    return res.status(500).json({
      error: 'AI service temporary failure. The rest of your workspace functions normally.',
      summary: 'Unable to connect to Claude API at this moment.'
    });
  }
});

// POST /ai/prioritize — AI Task Prioritization & Optimization Suggestions
router.post('/prioritize', async (req, res) => {
  try {
    const { boardId } = req.body;
    const filter = { workspaceId: req.workspaceId };
    if (boardId) filter.boardId = boardId;

    const tasks = await Task.find(filter);

    if (tasks.length === 0) {
      return res.status(200).json({ recommendations: [], summary: 'No tasks available on this board to prioritize.' });
    }

    const anthropic = getAnthropicClient();

    if (!anthropic) {
      // Deterministic fallback prioritization rule
      const recommendations = tasks.map((t) => {
        let suggestedPriority = t.priority;
        let reasoning = 'Maintained default priority score.';
        if (t.status === 'In Progress' && t.priority === 'low') {
          suggestedPriority = 'high';
          reasoning = 'Active work items should be elevated above backlog items.';
        }
        return {
          taskId: t._id,
          title: t.title,
          currentPriority: t.priority,
          suggestedPriority,
          reasoning
        };
      });

      return res.status(200).json({
        recommendations,
        summary: 'Prioritization evaluated via rule engine. Configure ANTHROPIC_API_KEY for Claude AI analysis.',
        fallback: true
      });
    }

    const taskPayload = tasks.map((t) => ({ id: t._id.toString(), title: t.title, description: t.description, status: t.status, priority: t.priority }));

    const prompt = `You are LiveOps AI Prioritization Engine. Analyze these tasks and output JSON only with this structure:
{
  "summary": "Short 2-sentence rationale for prioritization recommendations",
  "recommendations": [
    {
      "taskId": "task id string",
      "title": "task title",
      "suggestedPriority": "urgent | high | medium | low",
      "reasoning": "1 sentence rationale"
    }
  ]
}

Tasks list:
${JSON.stringify(taskPayload, null, 2)}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const contentText = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
    const jsonMatch = contentText.match(/\{[\s\S]*\}/);
    const parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: contentText, recommendations: [] };

    return res.status(200).json(parsedData);
  } catch (error) {
    console.error('Claude API Error (prioritize):', error);
    return res.status(500).json({
      error: 'AI Prioritization request failed gracefully.',
      summary: 'Could not communicate with Claude API.'
    });
  }
});

export default router;
