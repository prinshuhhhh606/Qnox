const Organization = require('../models/Organization');

/**
 * Strict Multi-Tenant Isolation Middleware
 * Guarantees Gym A can NEVER query, mutate, or access Gym B's data.
 */
exports.verifyTenant = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for tenant operations.',
      });
    }

    const { role } = req.user;

    // 1. Super Admin has global platform visibility
    if (role === 'Super Admin') {
      req.isSuperAdmin = true;
      req.tenantOrgId = req.query.organizationId || req.body.organizationId || null;
      return next();
    }

    // 2. Gym Owner & Company Admin are bound strictly to their Organization
    if (role === 'Gym Owner' || role === 'Company Admin') {
      if (!req.user.organization) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: No gym organization is associated with your account.',
        });
      }

      req.tenantOrgId = req.user.organization;

      // Verify that if a target organization was requested in params/body, it matches
      const targetOrg = req.params.organizationId || req.body.organizationId || req.query.organizationId;
      if (targetOrg && String(targetOrg) !== String(req.user.organization)) {
        return res.status(403).json({
          success: false,
          message: 'Security Violation: Cross-tenant data access is strictly forbidden.',
        });
      }

      return next();
    }

    // 3. Branch Manager is bound to their assigned branch
    if (role === 'Branch Manager') {
      if (!req.user.assignedBranch) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You have not been assigned to a specific branch.',
        });
      }

      req.tenantOrgId = req.user.organization;
      req.tenantBranchId = req.user.assignedBranch;

      const targetBranch = req.params.branchId || req.body.branchId || req.query.branchId;
      if (targetBranch && String(targetBranch) !== String(req.user.assignedBranch)) {
        return res.status(403).json({
          success: false,
          message: 'Security Violation: Branch managers may only access their assigned facility.',
        });
      }

      return next();
    }

    // 4. Receptionist is bound to branch desk operations
    if (role === 'Receptionist') {
      if (!req.user.assignedBranch && !req.user.homeClub) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Receptionist has no branch location assigned.',
        });
      }

      req.tenantOrgId = req.user.organization;
      req.tenantBranchId = req.user.assignedBranch || req.user.homeClub;
      return next();
    }

    // For trainers and members, proceed with normal role authorization
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Tenant authorization validation failed.',
      error: err.message,
    });
  }
};
