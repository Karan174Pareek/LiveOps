import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { Task } from '../models/Task.js';
import { requireAuth, scopeWorkspace } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth, scopeWorkspace);

// Helper to instantiate Anthropic client if valid key is set in environment
const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes('your_anthropic_claude_api_key_here')) {
    return null;
  }
  return new Anthropic({ apiKey });
};

// POST /ai/summarize-standup — 24h Workspace Standup Summary via Claude API
router.post('/summarize-standup', async (req, res) => {
  try {
    // Query workspace tasks updated within the last 24 hours (or top 20 recent)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tasks = await Task.find({
      workspaceId: req.workspaceId,
      updatedAt: { $gte: twentyFourHoursAgo }
    }).sort({ updatedAt: -1 }).limit(25);

    const fallbackTasks = tasks.length > 0 ? tasks : await Task.find({ workspaceId: req.workspaceId }).sort({ updatedAt: -1 }).limit(15);

    if (fallbackTasks.length === 0) {
      return res.status(200).json({
        summary: 'No task updates recorded in this workspace during the last 24 hours. Create or update tasks to generate AI standup summaries!'
      });
    }

    const taskSummaries = fallbackTasks
      .map((t) => `- "${t.title}" | Status: ${t.status} | Priority: ${t.priority} | Updated: ${t.updatedAt.toISOString()}`)
      .join('\n');

    const anthropic = getAnthropicClient();

    if (!anthropic) {
      const doneCount = fallbackTasks.filter((t) => t.status === 'Done').length;
      const inProgressCount = fallbackTasks.filter((t) => t.status === 'In Progress' || t.status === 'Review').length;
      const pendingCount = fallbackTasks.filter((t) => t.status === 'To Do' || t.status === 'Backlog').length;

      return res.status(200).json({
        summary: `📊 **LiveOps 24h Workspace Activity Standup Summary**\n\n` +
          `• **Completed Deliverables (${doneCount})**: Successfully closed out high-impact tasks.\n` +
          `• **Active In-Flight Work (${inProgressCount})**: Active development underway across primary board columns.\n` +
          `• **Pending Queue (${pendingCount})**: Items queued for upcoming sprint allocation.\n\n` +
          `*Note: Configure ANTHROPIC_API_KEY in server/.env to enable live Claude 3.5 Sonnet analysis.*`,
        fallback: true
      });
    }

    // Call Claude API with 10s timeout protection
    const response = await Promise.race([
      anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 700,
        messages: [
          {
            role: 'user',
            content: `You are LiveOps AI, an agile executive project manager. Summarize the following 24h workspace task activity into a concise bulleted Executive Standup Report with sections: 1) Major Accomplishments, 2) Active In-Progress Work, and 3) Next Steps & Blockers.\n\nTasks:\n${taskSummaries}`
          }
        ]
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Claude API request timed out after 10s')), 10000))
    ]);

    const summaryText = response.content[0]?.type === 'text' ? response.content[0].text : 'Standup summary generated.';
    return res.status(200).json({ summary: summaryText });
  } catch (error) {
    console.error('Claude API Error (/ai/summarize-standup):', error.message);
    return res.status(200).json({
      error: 'Claude API temporary network timeout or rate limit.',
      summary: '⚠️ AI Service Temporarily Busy: The Claude API call timed out or reached rate limits. Your workspace continues to function normally. Please try again in a few moments.',
      fallback: true
    });
  }
});

// POST /ai/prioritize — Structured JSON Task Prioritization via Claude API
router.post('/prioritize', async (req, res) => {
  try {
    const { boardId } = req.body;
    const filter = { workspaceId: req.workspaceId };
    if (boardId) filter.boardId = boardId;

    const tasks = await Task.find(filter).limit(30);

    if (tasks.length === 0) {
      return res.status(200).json({ summary: 'No tasks available on this board for prioritization.', recommendations: [] });
    }

    const anthropic = getAnthropicClient();

    if (!anthropic) {
      const recommendations = tasks.map((t) => ({
        taskId: t._id,
        title: t.title,
        currentPriority: t.priority,
        suggestedPriority: t.status === 'In Progress' && t.priority === 'low' ? 'high' : t.priority,
        reasoning: t.status === 'In Progress' ? 'Active work item elevated for rapid delivery.' : 'Maintained baseline priority.'
      }));

      return res.status(200).json({
        summary: 'Rule-based prioritization engine executed. Configure ANTHROPIC_API_KEY in server/.env for Claude AI analysis.',
        recommendations,
        fallback: true
      });
    }

    const taskPayload = tasks.map((t) => ({ id: t._id.toString(), title: t.title, description: t.description, status: t.status, priority: t.priority }));

    const response = await Promise.race([
      anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Analyze these tasks and respond ONLY with valid JSON in this structure:
{
  "summary": "Short 2-sentence rationale",
  "recommendations": [
    {
      "taskId": "string",
      "title": "string",
      "suggestedPriority": "urgent | high | medium | low",
      "reasoning": "1 sentence rationale"
    }
  ]
}

Tasks:\n${JSON.stringify(taskPayload, null, 2)}`
          }
        ]
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Claude API request timed out after 10s')), 10000))
    ]);

    const contentText = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
    const jsonMatch = contentText.match(/\{[\s\S]*\}/);
    const parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: contentText, recommendations: [] };

    return res.status(200).json(parsedData);
  } catch (error) {
    console.error('Claude API Error (/ai/prioritize):', error.message);
    return res.status(200).json({
      error: 'Claude API temporary timeout.',
      summary: '⚠️ AI Prioritization Timed Out: The request degraded gracefully. Core board functions remain unaffected.',
      recommendations: [],
      fallback: true
    });
  }
});

export default router;
