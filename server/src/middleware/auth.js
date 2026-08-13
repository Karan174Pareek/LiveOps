import { verifyAccessToken } from '../utils/jwt.js';
import { UserWorkspaceRole } from '../models/UserWorkspaceRole.js';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired access token.' });
  }

  req.user = decoded;
  next();
};

export const scopeWorkspace = async (req, res, next) => {
  try {
    const workspaceId = req.headers['x-workspace-id'] || req.params.workspaceId || req.query.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID header (x-workspace-id) or parameter is required.' });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required prior to workspace scoping.' });
    }

    const userRoleDoc = await UserWorkspaceRole.findOne({
      userId: req.user.userId,
      workspaceId
    });

    if (!userRoleDoc) {
      return res.status(403).json({ error: 'Forbidden: Access denied to this workspace.' });
    }

    req.workspaceId = workspaceId;
    req.userRole = userRoleDoc.role;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error during workspace security verification.' });
  }
};

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ error: 'Forbidden: Workspace role context missing.' });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        error: `Forbidden: Action requires one of the following roles: [${allowedRoles.join(', ')}]. Your role is '${req.userRole}'.`
      });
    }

    next();
  };
};
