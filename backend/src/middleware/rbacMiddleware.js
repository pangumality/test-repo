import { ROLE_PERMISSIONS } from '../config/rbac.js';
import { logAudit } from '../utils/auditLogger.js';
import { getDepartmentStaff } from '../config/departmentsStore.js';

export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: User context missing' });
      }

      // Check if user has the role (using existing Enum role from User model)
      const userRole = user.role; // e.g., 'admin', 'teacher'
      const permissions = ROLE_PERMISSIONS[userRole] || [];

      if (!permissions.includes(permission)) {
        // Log the failed attempt
        await logAudit(user.id, 'ACCESS_DENIED', permission, `Role ${userRole} missing permission`);
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }

      // Log successful access for auditing (optional: could be noisy, maybe log only writes)
      // await logAudit(user.id, 'ACCESS_GRANTED', permission);

      next();
    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};

export const requirePermissionOrDepartmentStaff = (permission, department) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: User context missing' });
      }

      const userRole = user.role;
      const permissions = ROLE_PERMISSIONS[userRole] || [];

      if (permissions.includes(permission)) {
        return next();
      }

      const { schoolId, id: userId } = user;
      if (!schoolId || !userId) {
        await logAudit(user.id, 'ACCESS_DENIED', permission, `Role ${userRole} missing permission and no school context`);
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }

      const ids = getDepartmentStaff(department, schoolId);
      if (Array.isArray(ids) && ids.includes(userId)) {
        return next();
      }

      await logAudit(
        user.id,
        'ACCESS_DENIED',
        permission,
        `Role ${userRole} missing permission and not in department ${department}`
      );
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    } catch (error) {
      console.error('RBAC Middleware Error (department):', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};
